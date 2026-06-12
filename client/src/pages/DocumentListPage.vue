
<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  SearchOutlined,
  FileTextOutlined,
  ProjectOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const documents = ref([])
const loading = ref(false)
const modalVisible = ref(false)
const searchText = ref('')

const formState = reactive({
  title: '',
  projectName: '',
  docType: 'SRS'
})

const filteredDocuments = computed(() => {
  if (!searchText.value) return documents.value
  const lowSearch = searchText.value.toLowerCase()
  return documents.value.filter(doc => 
    doc.title.toLowerCase().includes(lowSearch) || 
    doc.projectName.toLowerCase().includes(lowSearch)
  )
})

async function loadDocuments() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/documents')
    documents.value = data
  } catch (e) {
    message.error('加载文档列表失败')
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!formState.title || !formState.projectName) {
    return message.warning('请填写完整信息')
  }
  try {
    const { data } = await axios.post('/api/documents', formState)
    message.success('文档创建成功')
    modalVisible.value = false
    router.push(`/documents/${data.id}`)
  } catch (e) {
    message.error('创建失败')
  }
}

async function handleDelete(id: number) {
  Modal.confirm({
    title: '确定删除此文档吗？',
    content: '此操作将永久删除文档及其所有编制、审查记录。',
    okType: 'danger',
    onOk: async () => {
      try {
        await axios.delete(`/api/documents/${id}`)
        message.success('已安全删除')
        loadDocuments()
      } catch (e) {
        message.error('删除失败')
      }
    }
  })
}

function getStatusColor(status: string) {
  const map: any = {
    draft: 'default',
    generating: 'processing',
    reviewing: 'warning',
    completed: 'success',
    error: 'error'
  }
  return map[status] || 'default'
}

function getStatusLabel(status: string) {
  const map: any = {
    draft: '草稿',
    generating: '编制中',
    reviewing: '审查中',
    completed: '已归档',
    error: '异常'
  }
  return map[status] || status
}

onMounted(loadDocuments)
</script>

<template>
  <div class="space-y-6">
    <!-- 头部区域 -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileTextOutlined class="text-blue-500" />
          文档管理中心
        </h2>
        <p class="text-gray-500 mt-1">管理并维护您的 GJB 438B 软件研制文档，支持全生命周期跟踪。</p>
      </div>
      <a-button type="primary" size="large" @click="modalVisible = true" class="shadow-md">
        <template #icon><PlusOutlined /></template>
        新建研制文档
      </a-button>
    </div>

    <!-- 过滤器区域 -->
    <div class="bg-white p-4 rounded-lg border border-gray-100 flex gap-4 items-center shadow-sm">
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索文档名称或项目名称..."
        style="width: 300px"
        @search="loadDocuments"
      />
      <div class="h-4 w-px bg-gray-200"></div>
      <div class="flex gap-2">
        <a-tag v-for="type in ['SRS', 'SDD', 'STP']" :key="type" class="cursor-pointer">
          {{ type }}
        </a-tag>
      </div>
    </div>

    <!-- 表格区域 -->
    <a-table 
      :columns="[
        { title: '文档名称', key: 'title', width: '30%' },
        { title: '项目/型号', key: 'projectName', width: '20%' },
        { title: '类型', dataIndex: 'docType', key: 'docType', width: 100 },
        { title: '当前状态', key: 'status', width: 120 },
        { title: '质量评分', key: 'reviewScore', width: 100 },
        { title: '更新时间', key: 'updatedAt', width: 180 },
        { title: '操作', key: 'action', width: 180, fixed: 'right' }
      ]" 
      :data-source="filteredDocuments" 
      :loading="loading" 
      row-key="id"
      class="bg-white rounded-lg shadow-sm border border-gray-100"
    >
      <template #bodyCell="{ column, record }">
        <!-- 文档名称列 -->
        <template v-if="column.key === 'title'">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <FileTextOutlined />
            </div>
            <div class="font-medium text-gray-800">{{ record.title }}</div>
          </div>
        </template>

        <!-- 项目名称列 -->
        <template v-if="column.key === 'projectName'">
          <div class="flex items-center gap-2 text-gray-600">
            <ProjectOutlined />
            {{ record.projectName }}
          </div>
        </template>

        <!-- 状态列 -->
        <template v-if="column.key === 'status'">
          <a-badge :status="getStatusColor(record.status)" :text="getStatusLabel(record.status)" />
        </template>

        <!-- 评分列 -->
        <template v-if="column.key === 'reviewScore'">
          <span v-if="record.reviewScore" :class="record.reviewScore >= 80 ? 'text-green-500' : 'text-orange-500'" class="font-bold">
            {{ record.reviewScore }}分
          </span>
          <span v-else class="text-gray-400">未审查</span>
        </template>

        <!-- 时间列 -->
        <template v-if="column.key === 'updatedAt'">
          <div class="flex items-center gap-2 text-gray-500 text-sm">
            <ClockCircleOutlined />
            {{ new Date(record.updatedAt).toLocaleString() }}
          </div>
        </template>

        <!-- 操作列 -->
        <template v-if="column.key === 'action'">
          <div class="flex gap-1">
            <a-button type="primary" size="small" ghost @click="router.push(`/documents/${record.id}`)">
              <template #icon><EditOutlined /></template>
              工作台
            </a-button>
            <a-button type="link" danger size="small" @click="handleDelete(record.id)">
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </div>
        </template>
      </template>
    </a-table>

    <!-- 新建 Modal -->
    <a-modal v-model:open="modalVisible" title="新建研制文档" @ok="handleCreate" :confirm-loading="loading">
      <a-form layout="vertical">
        <a-form-item label="文档名称" required help="例如：某分系统软件需求规格说明书">
          <a-input v-model:value="formState.title" placeholder="请输入完整文档标题" />
        </a-form-item>
        <a-form-item label="所属项目/型号" required>
          <a-input v-model:value="formState.projectName" placeholder="请输入关联的项目或型号名称" />
        </a-form-item>
        <a-form-item label="文档标准/类型" required>
          <a-radio-group v-model:value="formState.docType" button-style="solid">
            <a-radio-button value="SRS">需求 (SRS)</a-radio-button>
            <a-radio-button value="SDD">设计 (SDD)</a-radio-button>
            <a-radio-button value="STP">测试 (STP)</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  @apply bg-gray-50 font-bold text-gray-600;
}
</style>

