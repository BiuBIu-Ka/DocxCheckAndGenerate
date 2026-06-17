<template>
  <div class="page-shell">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Templates</div>
        <h2>模板中心</h2>
        <p>统一管理 DOCX 模板、变量说明、结构预览和生成入口。</p>
      </div>
    </div>

    <div class="page-grid">
      <TemplateListPanel
        :templates="templates"
        :selected-id="selectedTemplateId"
        @create="createNewTemplate"
        @select="selectTemplate"
        @delete="deleteTemplate"
        @generate="goToGenerate"
      />

      <div class="editor-column">
        <TemplateEditorPanel
          :template="currentTemplate"
          :saving="saving"
          @update:template="currentTemplate = $event"
          @pick-file="pickFile"
          @save="saveTemplate"
        />
        <TemplateSchemaPreview :schema="schemaPreview" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import TemplateListPanel from '../components/templates/TemplateListPanel.vue'
import TemplateEditorPanel from '../components/templates/TemplateEditorPanel.vue'
import TemplateSchemaPreview from '../components/templates/TemplateSchemaPreview.vue'
import type { TemplateProfile } from '../types/app'
import type { TemplateSchema } from '../features/generation/templateSchema'
import { useAppConfigStore } from '../stores/appConfig'
import {
  deleteTemplateById,
  extractTemplateVariables,
  inspectTemplateStructure,
  listTemplates,
  loadTemplateBuffer,
  persistTemplateBuffer,
  pickTemplateFile,
  upsertTemplate,
} from '../services/templateService'

const router = useRouter()
const appConfig = useAppConfigStore()
const templates = ref<TemplateProfile[]>([])
const selectedTemplateId = ref('')
const currentTemplate = ref<TemplateProfile | undefined>()
const schemaPreview = ref<TemplateSchema | null>(null)
const saving = ref(false)

function createBlankTemplate(): TemplateProfile {
  return {
    id: `tpl_${Date.now()}`,
    name: '新模板',
    path: '',
    fileName: '',
    standardText: '',
    variables: [],
    updatedAt: new Date().toISOString(),
  }
}

async function refreshTemplates() {
  templates.value = await listTemplates()
  if (!selectedTemplateId.value && templates.value[0]) {
    await selectTemplate(templates.value[0].id)
  }
}

async function refreshSchema(template?: TemplateProfile) {
  if (!template) {
    schemaPreview.value = null
    return
  }
  const buffer = await loadTemplateBuffer(template)
  if (!buffer) {
    schemaPreview.value = null
    return
  }
  schemaPreview.value = inspectTemplateStructure(buffer)
}

async function selectTemplate(templateId: string) {
  selectedTemplateId.value = templateId
  const found = templates.value.find((item) => item.id === templateId)
  currentTemplate.value = found ? JSON.parse(JSON.stringify(found)) : undefined
  await refreshSchema(found)
}

function createNewTemplate() {
  currentTemplate.value = createBlankTemplate()
  selectedTemplateId.value = currentTemplate.value.id
  schemaPreview.value = null
}

async function deleteTemplate(templateId: string) {
  try {
    await ElMessageBox.confirm('确定删除这个模板吗？', '提示', { type: 'warning' })
    await deleteTemplateById(templateId)
    await appConfig.load()
    if (selectedTemplateId.value === templateId) {
      selectedTemplateId.value = ''
      currentTemplate.value = undefined
      schemaPreview.value = null
    }
    await refreshTemplates()
    ElMessage.success('模板已删除')
  } catch {
    // ignore
  }
}

async function pickFile() {
  if (!currentTemplate.value) return
  const result = await pickTemplateFile()
  if (!result) return

  currentTemplate.value = {
    ...currentTemplate.value,
    path: result.path,
    fileName: result.name,
    name: currentTemplate.value.name === '新模板' ? result.name.replace(/\.docx$/i, '') : currentTemplate.value.name,
    variables: extractTemplateVariables(result.buffer).map((item) => {
      const existing = currentTemplate.value?.variables.find((variable) => variable.name === item.name)
      return {
        name: item.name,
        description: existing?.description || '',
      }
    }),
  }
  schemaPreview.value = inspectTemplateStructure(result.buffer)
  await persistTemplateBuffer(currentTemplate.value.id, result.buffer)
  ElMessage.success('模板文件已解析')
}

async function saveTemplate() {
  if (!currentTemplate.value) {
    return ElMessage.warning('请先选择或创建模板')
  }
  if (!currentTemplate.value.name.trim()) {
    return ElMessage.warning('请输入模板名称')
  }

  saving.value = true
  try {
    await upsertTemplate(currentTemplate.value)
    await appConfig.load()
    await refreshTemplates()
    await selectTemplate(currentTemplate.value.id)
    ElMessage.success('模板已保存')
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

function goToGenerate(templateId: string) {
  router.push({ path: '/generation', query: { templateId } })
}

onMounted(async () => {
  await refreshTemplates()
})
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-eyebrow,
.page-header p {
  margin: 0;
  color: var(--text-secondary);
}

.page-header h2 {
  margin: 6px 0;
  color: var(--text-primary);
}

.page-grid {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 16px;
}

.editor-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1280px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
