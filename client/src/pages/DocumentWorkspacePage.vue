
<script setup lang="ts">
import { onMounted, ref, reactive, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  RocketOutlined, 
  SafetyCertificateOutlined, 
  SaveOutlined, 
  UploadOutlined,
  LoadingOutlined,
  DownOutlined
} from '@ant-design/icons-vue'
import axios from 'axios'

const route = useRoute()
const docId = route.params.id
const document = ref<any>(null)
const loading = ref(false)
const actionLoading = ref(false)
const parsedStructure = ref([])
const activeTab = ref('content')

let pollTimer: any = null

async function loadDocument() {
  loading.value = true
  try {
    const { data } = await axios.get(`/api/documents/${docId}`)
    document.value = data
    if (data.structureJson) {
      parsedStructure.value = JSON.parse(data.structureJson)
    }
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
    const { data } = await axios.get(`/api/documents/${docId}`)
    document.value = data
    if (!['generating', 'reviewing'].includes(data.status)) {
      stopPolling()
      message.success('后台任务已完成')
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
  const formData = new FormData()
  formData.append('file', info.file)
  try {
    const { data } = await axios.post('/api/documents/parse-template', formData)
    parsedStructure.value = data.structure
    // Auto save the structure
    await axios.put(`/api/documents/${docId}`, {
      structure_json: JSON.stringify(data.structure)
    })
    message.success('模板解析成功，章节结构已同步')
  } catch (e) {
    message.error('模板解析失败')
  }
}

async function handleGenerate() {
  if (!parsedStructure.value.length) {
    message.warning('请先上传模板以识别章节结构')
    return
  }
  actionLoading.value = true
  try {
    await axios.post('/api/generation/trigger', {
      document_id: Number(docId),
      prompt: '基于GJB要求编制',
      structure: parsedStructure.value
    })
    message.info('AI 生成任务已启动，请稍候...')
    loadDocument()
  } catch (e) {
    message.error('任务启动失败')
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

async function handleSave() {
  try {
    await axios.put(`/api/documents/${docId}`, {
      content_json: document.value.contentJson,
      structure_json: JSON.stringify(parsedStructure.value)
    })
    message.success('模板已成功保存')
  } catch (e) {
    message.error('保存失败')
  }
}

const getContent = () => {
  if (!document.value?.contentJson) return {}
  try {
    return JSON.parse(document.value.contentJson)
  } catch {
    return {}
  }
}

const getIssues = () => {
  if (!document.value?.issuesJson) return []
  try {
    return JSON.parse(document.value.issuesJson)
  } catch {
    return []
  }
}

function getStatusLabel(status: string) {
  const map: any = {
    draft: '编辑中',
    generating: '解析中',
    reviewing: '验证中',
    completed: '已就绪',
    error: '异常'
  }
  return map[status] || status
}

onMounted(loadDocument)
onUnmounted(stopPolling)
</script>

<template>
  <div v-if="document" class="space-y-6">
    <div class="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold m-0">{{ document.title }} <span class="text-gray-400 font-normal">(模板)</span></h2>
          <a-tag :color="document.status === 'completed' ? 'success' : 'processing'">
            {{ getStatusLabel(document.status) }}
          </a-tag>
        </div>
        <div class="text-gray-500 mt-1">适用项目：{{ document.projectName }} · 类型：{{ document.docType }}</div>
      </div>
      <div class="flex gap-3">
        <a-button @click="handleSave"><template #icon><SaveOutlined /></template>保存模板</a-button>
        <a-dropdown>
          <template #overlay>
            <a-menu>
              <a-menu-item key="gen" @click="handleGenerate">
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
          <a-upload-dragger :multiple="false" :customRequest="handleUploadTemplate" class="mb-4">
            <template #icon><UploadOutlined /></template>
            <p class="ant-upload-text">点击或拖拽 Word 模板到此处</p>
            <p class="ant-upload-hint text-xs">系统将自动解析 Heading 样式并提取章节树</p>
          </a-upload-dragger>
          <div v-if="parsedStructure.length" class="space-y-1">
            <div class="text-xs font-bold mb-2 text-gray-500">解析出的章节预览：</div>
            <div v-for="s in parsedStructure" :key="s.title" class="text-xs p-2 bg-blue-50 rounded text-blue-700 border border-blue-100 truncate">
              {{ s.title }}
            </div>
          </div>
          <a-empty v-else description="请上传 .docx 模板文件" />
        </a-card>

        <a-card v-if="document.reviewScore !== null" title="质量概览" size="small">
          <a-statistic title="审查评分" :value="document.reviewScore" suffix="/ 100" />
          <div class="mt-4 text-xs text-gray-500">{{ document.reviewSummary }}</div>
        </a-card>
      </div>

      <div class="lg:col-span-3">
        <a-tabs v-model:activeKey="activeTab" type="card" class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <a-tab-pane key="content" tab="文档正文">
            <div v-if="document.status === 'generating'" class="flex flex-col items-center py-20">
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
  </div>
  <a-skeleton v-else active />
</template>
