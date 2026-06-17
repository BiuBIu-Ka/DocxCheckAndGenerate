<template>
  <div class="page-shell">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Workbench</div>
        <h2>生成中台</h2>
        <p>左侧配置生成输入，中间查看完整 AI / Tool / Patch 时间线，右侧检查结构化结果后再导出 DOCX。</p>
      </div>
      <el-space wrap>
        <el-tag effect="dark" :type="appConfig.hasModelConfig ? 'success' : 'danger'">
          {{ appConfig.hasModelConfig ? '模型已配置' : '模型未配置' }}
        </el-tag>
        <el-tag effect="plain">
          当前模板 {{ selectedTemplate?.name || '未选择' }}
        </el-tag>
      </el-space>
    </div>

    <div class="workbench-grid">
      <GenerationControlPanel
        :templates="templates"
        :knowledge-bases="knowledgeBases"
        :selected-template-id="templateId"
        :selected-template="selectedTemplate"
        :selected-knowledge-base-ids="selectedKnowledgeBaseIds"
        :global-context="globalContext"
        :reference-materials="referenceMaterials"
        :notes="notes"
        :has-model-config="appConfig.hasModelConfig"
        :generating="generating || exporting"
        @update:selected-template-id="templateId = $event"
        @update:selected-knowledge-base-ids="selectedKnowledgeBaseIds = $event"
        @update:global-context="globalContext = $event"
        @update:reference-materials="referenceMaterials = $event"
        @update:notes="notes = $event"
        @run="generateDoc"
        @reset="resetInputs"
      />

      <GenerationTimelinePanel
        :events="events"
        :metrics="metrics"
        :generating="generating"
        :current-step="currentStep"
        :selected-event-id="selectedEventId"
        @select-event="selectedEventId = $event"
      />

      <GenerationPreviewPanel
        :preview-json="previewJson"
        :preview-summary="previewSummary"
        :metrics="metrics"
        :can-export="Boolean(previewData && !exporting)"
        @copy="copyPreviewJson"
        @export="exportDocx"
      />
    </div>

    <GenerationEventDetailDrawer
      v-model="eventDrawerVisible"
      :event="selectedEvent"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import GenerationControlPanel from '../components/generation/GenerationControlPanel.vue'
import GenerationTimelinePanel from '../components/generation/GenerationTimelinePanel.vue'
import GenerationPreviewPanel from '../components/generation/GenerationPreviewPanel.vue'
import GenerationEventDetailDrawer from '../components/generation/GenerationEventDetailDrawer.vue'
import { useAppConfigStore } from '../stores/appConfig'
import { useGenerationWorkbenchStore } from '../stores/generationWorkbench'
import { InternalToolManager } from '../utils/internalTools'
import { getTemplateBuffer, saveGeneratedDocument } from '../utils/bridge'
import { parseTemplateSchema } from '../features/generation/templateSchema'
import {
  buildRenderDataFromCanonical,
  inspectRenderData,
  sanitizeForDocx,
  summarizeDocumentData,
  validateRenderStats,
  yieldToUi,
} from '../features/generation/canonicalData'
import { buildGenerationPrompt } from '../features/generation/promptBuilder'
import { runGenerationAgent } from '../features/generation/agentRunner'

const route = useRoute()
const appConfig = useAppConfigStore()
const workbench = useGenerationWorkbenchStore()
const exporting = ref(false)
const currentTemplateBuffer = ref<ArrayBuffer | null>(null)

const { settings } = storeToRefs(appConfig)
const {
  templateId,
  selectedKnowledgeBaseIds,
  globalContext,
  referenceMaterials,
  notes,
  generating,
  currentStep,
  events,
  metrics,
  previewJson,
  previewData,
  previewSummary,
  selectedEventId,
  selectedEvent,
} = storeToRefs(workbench)

const templates = computed(() => settings.value.templates)
const knowledgeBases = computed(() => settings.value.knowledgeBases)
const selectedTemplate = computed(() => appConfig.findTemplateById(templateId.value))
const selectedKnowledgeBases = computed(() =>
  knowledgeBases.value.filter((item) => selectedKnowledgeBaseIds.value.includes(item.id)),
)

const eventDrawerVisible = computed({
  get: () => Boolean(selectedEventId.value),
  set: (value: boolean) => {
    if (!value) selectedEventId.value = ''
  },
})

function syncTemplateSelection() {
  const routeTemplateId = route.query.templateId as string | undefined
  if (routeTemplateId && appConfig.findTemplateById(routeTemplateId)) {
    templateId.value = routeTemplateId
    return
  }
  if (!templateId.value && templates.value[0]) {
    templateId.value = templates.value[0].id
  }
}

function resetInputs() {
  workbench.resetWorkbench()
  globalContext.value = ''
  referenceMaterials.value = ''
  notes.value = ''
  selectedKnowledgeBaseIds.value = []
}

async function loadWorkbenchDependencies() {
  await Promise.all([appConfig.load(), workbench.loadRecentRuns()])
  syncTemplateSelection()
}

async function copyPreviewJson() {
  if (!previewJson.value) return
  try {
    await navigator.clipboard.writeText(previewJson.value)
    ElMessage.success('预览结果已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

async function resolveTemplateBuffer() {
  if (!selectedTemplate.value) return null
  if (currentTemplateBuffer.value) return currentTemplateBuffer.value

  currentTemplateBuffer.value =
    await getTemplateBuffer(selectedTemplate.value.id) ||
    await getTemplateBuffer(selectedTemplate.value.path)

  return currentTemplateBuffer.value
}

async function generateDoc() {
  await appConfig.load()
  syncTemplateSelection()

  if (!appConfig.hasModelConfig) {
    return ElMessage.warning('请先在模型配置页面配置 AI 模型')
  }
  if (!selectedTemplate.value) {
    return ElMessage.warning('请先选择模板')
  }
  if (selectedKnowledgeBaseIds.value.length === 0 && !referenceMaterials.value.trim()) {
    return ElMessage.warning('请选择知识库或输入补充参考资料')
  }

  workbench.startRun()
  workbench.setTemplate(selectedTemplate.value)
  currentStep.value = 1

  try {
    const buffer = await resolveTemplateBuffer()
    if (!buffer) {
      throw new Error('无法读取模板文件内容，请重新上传模板')
    }

    const templateZip = new PizZip(buffer)
    const templateDoc = new Docxtemplater(templateZip, {
      paragraphLoop: true,
      linebreaks: true,
    })
    const templateText = templateDoc.getFullText()
    const templateSchema = parseTemplateSchema(templateText)
    const { prompt, knowledgeBaseContent } = buildGenerationPrompt({
      template: selectedTemplate.value,
      templateSchema,
      selectedKnowledgeBases: selectedKnowledgeBases.value,
      globalContext: globalContext.value,
      referenceMaterials: referenceMaterials.value,
      notes: notes.value,
    })

    currentStep.value = 2
    const activeInternalTools = await InternalToolManager.getActiveTools()

    const { canonicalData } = await runGenerationAgent(
      {
        modelConfig: {
          apiUrl: settings.value.apiUrl,
          apiKey: settings.value.apiKey,
          modelName: settings.value.modelName,
          temperature: settings.value.temperature,
          maxRounds: settings.value.maxRounds,
          debugEnabled: settings.value.debugEnabled,
        },
        prompt,
        knowledgeBaseContent,
        internalTools: activeInternalTools as any,
        mcpServers: settings.value.mcpServers,
      },
      {
        onEvent: (event) => {
          workbench.appendEvent(event)
        },
        onMetrics: (partial) => {
          workbench.updateMetrics(partial)
        },
      },
    )

    currentStep.value = 3
    await nextTick()
    await yieldToUi()

    const canonical = sanitizeForDocx(canonicalData)
    const finalData = buildRenderDataFromCanonical(templateSchema, canonical)
    const renderStats = inspectRenderData(finalData)
    validateRenderStats(renderStats)
    workbench.updateMetrics(renderStats)

    const summary = `${summarizeDocumentData(finalData)}\n总文本字符: ${renderStats.totalStringChars}\n数组项总数: ${renderStats.totalArrayItems}\n最大字段长度: ${renderStats.maxStringLength}`
    workbench.setPreview({
      json: JSON.stringify(finalData, null, 2),
      data: finalData,
      summary,
    })
    workbench.finishRun('success')
    await workbench.persistCurrentRun({
      status: 'success',
      templateName: selectedTemplate.value.name,
      knowledgeBaseIds: selectedKnowledgeBaseIds.value,
      knowledgeBaseNames: selectedKnowledgeBases.value.map((item) => item.name),
    })
    ElMessage.success('结构化结果已生成，请检查右侧预览后再导出 DOCX')
  } catch (error: any) {
    console.error(error)
    workbench.setError(error.message)
    workbench.appendEvent({
      type: 'error',
      title: '生成失败',
      summary: error.message,
      status: 'error',
      payload: { message: error.message },
    })
    workbench.finishRun('error')
    await workbench.persistCurrentRun({
      status: 'error',
      templateName: selectedTemplate.value?.name,
      knowledgeBaseIds: selectedKnowledgeBaseIds.value,
      knowledgeBaseNames: selectedKnowledgeBases.value.map((item) => item.name),
    })
    ElMessage.error(`生成出错: ${error.message}`)
  }
}

async function exportDocx() {
  if (!previewData.value || !selectedTemplate.value) {
    return ElMessage.warning('请先生成结构化结果')
  }

  try {
    exporting.value = true
    currentStep.value = 4
    await nextTick()
    await yieldToUi()

    const buffer = await resolveTemplateBuffer()
    if (!buffer) {
      throw new Error('无法读取模板文件内容，请重新上传模板')
    }

    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    doc.render(previewData.value)
    const outZip = doc.getZip().generate({
      type: 'uint8array',
      compression: 'DEFLATE',
    })

    const success = await saveGeneratedDocument(outZip, 'generated_document.docx')
    if (success) {
      ElMessage.success('文档导出成功')
    } else {
      ElMessage.info('已取消保存')
    }
  } catch (error: any) {
    console.error(error)
    ElMessage.error(`导出出错: ${error.message}`)
  } finally {
    exporting.value = false
    currentStep.value = 0
  }
}

watch(
  () => route.query.templateId,
  () => {
    syncTemplateSelection()
  },
)

watch(templateId, () => {
  currentTemplateBuffer.value = null
})

onMounted(async () => {
  await loadWorkbenchDependencies()
})
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-eyebrow,
.page-header p {
  color: var(--text-secondary);
  margin: 0;
}

.page-header h2 {
  margin: 6px 0;
  color: var(--text-primary);
}

.workbench-grid {
  display: grid;
  grid-template-columns: 320px minmax(420px, 1fr) 420px;
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 1500px) {
  .workbench-grid {
    grid-template-columns: 290px minmax(0, 1fr) 360px;
  }
}

@media (max-width: 1280px) {
  .workbench-grid {
    grid-template-columns: 1fr;
  }
}
</style>
