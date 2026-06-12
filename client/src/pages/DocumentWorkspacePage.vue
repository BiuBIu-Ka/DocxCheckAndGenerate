
<script setup lang="ts">
import { onMounted, ref, onUnmounted, nextTick, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  RocketOutlined, 
  SafetyCertificateOutlined, 
  SaveOutlined, 
  UploadOutlined,
  LoadingOutlined,
  DownOutlined,
  PlusOutlined,
  SyncOutlined,
  DeleteOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue'
import axios from 'axios'

interface TemplateRule {
  sectionName: string
  requirementType: string
  description: string
  isActive: boolean
}

interface TemplateTerm {
  standardName: string
  aliases?: string
  forbiddenTerms?: string
  description?: string
}

interface TemplateStructureItem {
  title: string
  children?: TemplateStructureItem[]
}

interface TemplateDocument {
  id: number
  title: string
  projectName: string
  docType: string
  status: string
  templateFileName?: string | null
  templateHtml?: string | null
  structureJson?: string | null
  rulesJson?: string | null
  termsJson?: string | null
  generationPrompt?: string | null
  generationSourcesJson?: string | null
  contentJson?: string | null
  issuesJson?: string | null
  reviewScore?: number | null
  reviewSummary?: string | null
}

const route = useRoute()
const docId = route.params.id
const templateDocument = ref<TemplateDocument | null>(null)
const loading = ref(false)
const actionLoading = ref(false)
const uploadLoading = ref(false)
const uploadError = ref('')
const parsedStructure = ref<TemplateStructureItem[]>([])
const activeTab = ref('content')
const templateRules = ref<TemplateRule[]>([])
const templateTerms = ref<TemplateTerm[]>([])
const templateHtml = ref('')
const templateEditor = ref<HTMLElement | null>(null)
const generationModalVisible = ref(false)
const generationFileList = ref<any[]>([])
const generationForm = reactive({
  prompt: '',
})

let pollTimer: any = null

function safeParseArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function extractTitleFromText(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 60)
}

function buildStructureFromHtml(html: string): TemplateStructureItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '', 'text/html')
  const headings = Array.from(doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  if (headings.length) {
    return headings.map((heading) => ({
      title: extractTitleFromText(heading.textContent || '未命名章节') || '未命名章节',
      children: [],
    }))
  }

  const paragraphs = Array.from(doc.body.querySelectorAll('p'))
    .map((paragraph) => extractTitleFromText(paragraph.textContent || ''))
    .filter(Boolean)
  if (paragraphs.length) {
    return paragraphs.slice(0, 20).map((title) => ({ title, children: [] }))
  }

  return [{ title: '模板正文', children: [] }]
}

async function syncTemplateEditor() {
  await nextTick()
  if (!templateEditor.value) return
  if (templateEditor.value.innerHTML !== templateHtml.value) {
    templateEditor.value.innerHTML = templateHtml.value || '<p>请上传模板文件或在此直接编写模板内容。</p>'
  }
}

function handleTemplateHtmlInput(event: Event) {
  templateHtml.value = (event.target as HTMLElement).innerHTML
}

function handleGenerationFileChange(info: any) {
  generationFileList.value = info.fileList || []
}

async function loadDocument() {
  loading.value = true
  try {
    const { data } = await axios.get(`/api/documents/${docId}`)
    templateDocument.value = data
    templateHtml.value = data.templateHtml || ''
    generationForm.prompt = data.generationPrompt || ''
    parsedStructure.value = safeParseArray<TemplateStructureItem>(data.structureJson)
    templateRules.value = safeParseArray<TemplateRule>(data.rulesJson)
    templateTerms.value = safeParseArray<TemplateTerm>(data.termsJson)
    await syncTemplateEditor()
    if (['generating', 'reviewing'].includes(data.status)) {
      startPolling()
    } else {
      stopPolling()
    }
  } catch (e) {
    message.error('加载文档详情失败')
  } finally {
    loading.value = false
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    try {
      const { data } = await axios.get(`/api/documents/${docId}`)
      templateDocument.value = data
      templateHtml.value = data.templateHtml || ''
      generationForm.prompt = data.generationPrompt || generationForm.prompt
      parsedStructure.value = safeParseArray<TemplateStructureItem>(data.structureJson)
      templateRules.value = safeParseArray<TemplateRule>(data.rulesJson)
      templateTerms.value = safeParseArray<TemplateTerm>(data.termsJson)
      await syncTemplateEditor()
      if (!['generating', 'reviewing'].includes(data.status)) {
        stopPolling()
        message.success('后台任务已完成')
      }
    } catch {
      stopPolling()
      message.error('后台状态轮询失败，请稍后手动刷新')
    }
  }, 3000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function handleUploadTemplate(info: any) {
  uploadLoading.value = true
  uploadError.value = ''
  const formData = new FormData()
  formData.append('file', info.file)
  try {
    const { data } = await axios.post('/api/documents/parse-template', formData)
    parsedStructure.value = data.structure
    templateHtml.value = data.html || ''
    const { data: updated } = await axios.put(`/api/documents/${docId}`, {
      structureJson: JSON.stringify(data.structure),
      templateHtml: data.html || '',
      templateFileName: data.templateFileName
    })
    templateDocument.value = updated
    await syncTemplateEditor()
    info.onSuccess?.(data, info.file)
    message.success('模板已替换并解析完成')
  } catch (e: any) {
    const detail = e?.response?.data?.detail || e?.message || '模板解析失败'
    uploadError.value = detail
    info.onError?.(e)
    message.error(detail)
  } finally {
    uploadLoading.value = false
  }
}

function openGenerateModal() {
  generationModalVisible.value = true
}

async function handleGenerateSubmit() {
  const derivedStructure = parsedStructure.value.length ? parsedStructure.value : buildStructureFromHtml(templateHtml.value)
  if (!derivedStructure.length) {
    message.warning('请先上传或维护模板内容')
    return
  }
  if (!generationForm.prompt.trim()) {
    message.warning('请填写本次生成的具体要求')
    return
  }

  actionLoading.value = true
  try {
    const formData = new FormData()
    formData.append('document_id', String(docId))
    formData.append('prompt', generationForm.prompt)
    formData.append('structure_json', JSON.stringify(derivedStructure))
    generationFileList.value.forEach((item) => {
      const file = item.originFileObj || item
      if (file) {
        formData.append('files', file)
      }
    })

    await axios.put(`/api/documents/${docId}`, {
      generationPrompt: generationForm.prompt,
      structureJson: JSON.stringify(derivedStructure),
      templateHtml: templateHtml.value,
    })

    await axios.post('/api/generation/trigger-with-context', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    generationModalVisible.value = false
    message.info('AI 生成任务已启动，请稍候...')
    loadDocument()
  } catch (e: any) {
    message.error(e?.response?.data?.detail || '任务启动失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleReview() {
  actionLoading.value = true
  try {
    await axios.post(`/api/review/trigger/${docId}`)
    message.info('智能审查任务已启动...')
    loadDocument()
  } catch (e) {
    message.error('任务启动失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleExportDocx() {
  try {
    const response = await axios.get(`/api/documents/${docId}/export-docx`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${templateDocument.value?.title || 'generated-document'}.docx`
    link.click()
    window.URL.revokeObjectURL(url)
    message.success('文档已导出为 docx')
  } catch (e: any) {
    message.error(e?.response?.data?.detail || '导出失败')
  }
}

async function handleSave() {
  try {
    const derivedStructure = buildStructureFromHtml(templateHtml.value)
    parsedStructure.value = derivedStructure
    await axios.put(`/api/documents/${docId}`, {
      contentJson: templateDocument.value?.contentJson ?? null,
      templateHtml: templateHtml.value,
      structureJson: JSON.stringify(derivedStructure),
      rulesJson: JSON.stringify(templateRules.value),
      termsJson: JSON.stringify(templateTerms.value),
      templateFileName: templateDocument.value?.templateFileName ?? null
    })
    message.success('模板已成功保存')
  } catch (e) {
    message.error('保存失败')
  }
}

async function handleSyncKnowledge() {
  actionLoading.value = true
  try {
    const { data } = await axios.post(`/api/documents/${docId}/sync-knowledge`)
    templateDocument.value = data
    templateRules.value = safeParseArray<TemplateRule>(data.rulesJson)
    templateTerms.value = safeParseArray<TemplateTerm>(data.termsJson)
    message.success('已同步全局知识库到当前模板')
  } catch {
    message.error('同步知识库失败')
  } finally {
    actionLoading.value = false
  }
}

function addRule() {
  templateRules.value.push({
    sectionName: '',
    requirementType: 'mandatory',
    description: '',
    isActive: true,
  })
}

function removeRule(index: number) {
  templateRules.value.splice(index, 1)
}

function addTerm() {
  templateTerms.value.push({
    standardName: '',
    aliases: '',
    forbiddenTerms: '',
    description: '',
  })
}

function removeTerm(index: number) {
  templateTerms.value.splice(index, 1)
}

const getContent = () => {
  if (!templateDocument.value?.contentJson) return {}
  try {
    return JSON.parse(templateDocument.value.contentJson)
  } catch {
    return {}
  }
}

const getIssues = () => {
  if (!templateDocument.value?.issuesJson) return []
  try {
    return JSON.parse(templateDocument.value.issuesJson)
  } catch {
    return []
  }
}

function getStatusLabel(status: string) {
  const map: any = {
    draft: '编辑中',
    generating: '生成中',
    reviewing: '审查中',
    completed: '已就绪',
    error: '异常'
  }
  return map[status] || status
}

onMounted(loadDocument)
onUnmounted(stopPolling)
watch(activeTab, async (tab) => {
  if (tab === 'template') {
    await syncTemplateEditor()
  }
})
</script>

<template>
  <div v-if="templateDocument" class="space-y-6">
    <div class="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold m-0">{{ templateDocument.title }} <span class="text-gray-400 font-normal">(模板)</span></h2>
          <a-tag :color="templateDocument.status === 'completed' ? 'success' : 'processing'">
            {{ getStatusLabel(templateDocument.status) }}
          </a-tag>
        </div>
        <div class="text-gray-500 mt-1">适用项目：{{ templateDocument.projectName }} · 类型：{{ templateDocument.docType }}</div>
        <div v-if="templateDocument.templateFileName" class="text-xs text-gray-400 mt-1">源模板文件：{{ templateDocument.templateFileName }}</div>
      </div>
      <div class="flex gap-3">
        <a-button @click="handleSave"><template #icon><SaveOutlined /></template>保存模板</a-button>
        <a-button :loading="actionLoading" @click="handleSyncKnowledge"><template #icon><SyncOutlined /></template>同步全局知识库</a-button>
        <a-button v-if="Object.keys(getContent()).length" @click="handleExportDocx"><template #icon><DownloadOutlined /></template>导出 docx</a-button>
        <a-dropdown>
          <template #overlay>
            <a-menu>
              <a-menu-item key="gen" @click="openGenerateModal">
                <RocketOutlined /> 基于此模板生成文档
              </a-menu-item>
              <a-menu-item key="rev" @click="handleReview">
                <SafetyCertificateOutlined /> 基于此模板审查文档
              </a-menu-item>
            </a-menu>
          </template>
          <a-button type="primary">
            使用模板 <DownOutlined />
          </a-button>
        </a-dropdown>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-1 space-y-6">
        <a-card title="模板结构解析" size="small">
          <a-upload-dragger accept=".docx" :multiple="false" :show-upload-list="false" :customRequest="handleUploadTemplate" class="mb-4">
            <template #icon><UploadOutlined /></template>
            <p class="ant-upload-text">点击或拖拽 Word 模板到此处</p>
            <p class="ant-upload-hint text-xs">仅支持 `.docx`。每次上传都会替换当前模板文件，并转换为可编辑 HTML 样式。</p>
          </a-upload-dragger>
          <a-alert v-if="uploadLoading" type="info" show-icon message="正在解析模板，请稍候..." class="mb-3" />
          <a-alert v-else-if="uploadError" :message="uploadError" type="error" show-icon class="mb-3" />
          <div v-if="parsedStructure.length" class="space-y-1">
            <div class="text-xs font-bold mb-2 text-gray-500">解析出的章节预览：</div>
            <div v-for="s in parsedStructure" :key="s.title" class="text-xs p-2 bg-blue-50 rounded text-blue-700 border border-blue-100 truncate">
              {{ s.title }}
            </div>
          </div>
          <a-empty v-else description="请上传 .docx 模板文件" />
        </a-card>

        <a-card v-if="templateDocument.reviewScore !== null" title="质量概览" size="small">
          <a-statistic title="审查评分" :value="templateDocument.reviewScore" suffix="/ 100" />
          <div class="mt-4 text-xs text-gray-500">{{ templateDocument.reviewSummary }}</div>
        </a-card>
      </div>

      <div class="lg:col-span-3">
        <a-tabs v-model:activeKey="activeTab" type="card" class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <a-tab-pane key="content" tab="文档正文">
            <div v-if="templateDocument.status === 'generating'" class="flex flex-col items-center py-20">
               <LoadingOutlined style="font-size: 40px" class="text-blue-500 mb-4" />
               <div class="text-gray-500">AI 正在努力编制中，请稍候...</div>
            </div>
            <div v-else-if="Object.keys(getContent()).length" class="space-y-6">
               <div v-for="(body, title) in getContent()" :key="title">
                  <h3 class="text-lg font-bold border-l-4 border-blue-500 pl-3 mb-3">{{ title }}</h3>
                  <div class="bg-gray-50 p-6 rounded-lg border border-gray-100 whitespace-pre-wrap leading-relaxed">
                    {{ body }}
                  </div>
               </div>
            </div>
            <a-empty v-else description="文档暂无内容，请点击“AI 生成”或手动编辑" class="py-20" />
          </a-tab-pane>

          <a-tab-pane key="template" tab="模板可视编辑">
            <div class="space-y-4">
              <div class="text-sm text-gray-500">
                当前模板文件会被转换为 HTML 可视内容。你可以直接在下面继续修改，保存后系统会反推章节结构并作为模板基线保存。
              </div>
              <div
                ref="templateEditor"
                contenteditable="true"
                class="min-h-[520px] rounded-lg border border-gray-200 bg-white p-6 outline-none focus:border-blue-500 whitespace-normal"
                @input="handleTemplateHtmlInput"
              />
            </div>
          </a-tab-pane>

          <a-tab-pane key="knowledge" tab="模板知识库">
            <div class="space-y-6">
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <a-card title="模板规则" size="small">
                  <template #extra>
                    <a-button type="link" @click="addRule"><template #icon><PlusOutlined /></template>新增规则</a-button>
                  </template>
                  <div class="space-y-4">
                    <div v-for="(rule, index) in templateRules" :key="`rule-${index}`" class="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <a-input v-model:value="rule.sectionName" placeholder="章节名称，例如：1 范围" />
                        <a-select v-model:value="rule.requirementType">
                          <a-select-option value="mandatory">必备章节</a-select-option>
                          <a-select-option value="optional">建议章节</a-select-option>
                        </a-select>
                        <a-textarea v-model:value="rule.description" :rows="2" placeholder="编制要求或审查建议" class="md:col-span-2" />
                      </div>
                      <div class="flex justify-between items-center mt-3">
                        <a-checkbox v-model:checked="rule.isActive">启用该规则</a-checkbox>
                        <a-button danger type="link" @click="removeRule(index)"><template #icon><DeleteOutlined /></template>删除</a-button>
                      </div>
                    </div>
                    <a-empty v-if="!templateRules.length" description="当前模板尚未配置规则" />
                  </div>
                </a-card>

                <a-card title="模板术语库" size="small">
                  <template #extra>
                    <a-button type="link" @click="addTerm"><template #icon><PlusOutlined /></template>新增术语</a-button>
                  </template>
                  <div class="space-y-4">
                    <div v-for="(term, index) in templateTerms" :key="`term-${index}`" class="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <a-input v-model:value="term.standardName" placeholder="标准术语" />
                        <a-input v-model:value="term.aliases" placeholder="别名，可选" />
                        <a-input v-model:value="term.forbiddenTerms" placeholder="禁用词，逗号分隔" class="md:col-span-2" />
                        <a-textarea v-model:value="term.description" :rows="2" placeholder="术语说明或替换策略" class="md:col-span-2" />
                      </div>
                      <div class="flex justify-end mt-3">
                        <a-button danger type="link" @click="removeTerm(index)"><template #icon><DeleteOutlined /></template>删除</a-button>
                      </div>
                    </div>
                    <a-empty v-if="!templateTerms.length" description="当前模板尚未配置术语约束" />
                  </div>
                </a-card>
              </div>
            </div>
          </a-tab-pane>
          
          <a-tab-pane key="issues" tab="审查问题">
            <a-table :columns="[
              { title: '问题', dataIndex: 'title', key: 'title' },
              { title: '级别', dataIndex: 'severity', key: 'severity', width: 100 },
              { title: '建议', dataIndex: 'suggestion', key: 'suggestion' }
            ]" :data-source="getIssues()" pagination="false" row-key="id">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'severity'">
                  <a-tag :color="record.severity === 'high' ? 'error' : 'warning'">{{ record.severity }}</a-tag>
                </template>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>

    <a-modal
      v-model:open="generationModalVisible"
      title="基于模板生成文档"
      width="760px"
      :confirm-loading="actionLoading"
      @ok="handleGenerateSubmit"
    >
      <div class="space-y-4">
        <a-alert
          type="info"
          show-icon
          message="请输入本次编制要求，并上传技术要求、代码、接口说明、已有文档等参考资料。系统会基于模板、知识库和这些材料共同生成正式文档。"
        />
        <a-form layout="vertical">
          <a-form-item label="本次生成要求">
            <a-textarea
              v-model:value="generationForm.prompt"
              :rows="6"
              placeholder="例如：请根据上传的技术要求与代码，生成《软件需求规格说明书》，重点覆盖系统目标、功能需求、接口需求、性能需求、约束条件和验收要求。"
            />
          </a-form-item>
          <a-form-item label="参考材料">
            <a-upload
              :multiple="true"
              :before-upload="() => false"
              :file-list="generationFileList"
              @change="handleGenerationFileChange"
            >
              <a-button>
                <template #icon><UploadOutlined /></template>
                上传技术要求 / 代码 / 说明文档
              </a-button>
            </a-upload>
            <div class="text-xs text-gray-500 mt-2">
              支持上传 `.docx`、`.pdf`、`.md`、`.txt`、常见代码文件以及 `.zip` 代码包，系统会自动抽取文本作为生成依据。
            </div>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
  <a-skeleton v-else active />
</template>
