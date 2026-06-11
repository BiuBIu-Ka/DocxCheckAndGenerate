
<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import axios from 'axios'

const providers = ref([])
const loading = ref(false)
const modalVisible = ref(false)
const testLoading = ref(false)

const formState = reactive({
  name: '',
  provider: 'openai',
  base_url: 'https://api.deepseek.com',
  api_key: '',
  model_name: 'deepseek-chat',
  is_default: false
})

async function loadConfigs() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/model-providers')
    providers.value = data
  } catch (e) {
    message.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  try {
    await axios.post('/api/model-providers', formState)
    message.success('添加成功')
    modalVisible.value = false
    loadConfigs()
  } catch (e) {
    message.error('保存失败')
  }
}

async function handleTest(id: number) {
  testLoading.value = true
  try {
    const { data } = await axios.post(`/api/model-providers/test/${id}`)
    if (data.success) {
      message.success('连接成功！')
    } else {
      message.error('连接失败：' + data.error)
    }
  } catch (e) {
    message.error('测试请求失败')
  } finally {
    testLoading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await axios.delete(`/api/model-providers/${id}`)
    message.success('已删除')
    loadConfigs()
  } catch (e) {
    message.error('删除失败')
  }
}

onMounted(loadConfigs)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold">模型配置中心</h2>
      <a-button type="primary" @click="modalVisible = true">
        <template #icon><PlusOutlined /></template>
        添加新模型
      </a-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <a-card v-for="item in providers" :key="item.id" class="shadow-sm hover:shadow-md transition-shadow">
        <template #title>
          <div class="flex items-center gap-2">
            <span class="font-bold">{{ item.name }}</span>
            <a-tag v-if="item.is_default" color="blue">默认</a-tag>
          </div>
        </template>
        <template #extra>
          <a-button type="link" danger @click="handleDelete(item.id)">
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </template>

        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-500">供应商:</span>
            <span>{{ item.provider }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">模型:</span>
            <span>{{ item.model_name }}</span>
          </div>
          <div class="flex justify-between truncate">
            <span class="text-gray-500">端点:</span>
            <span class="truncate ml-4">{{ item.base_url }}</span>
          </div>
          
          <div class="pt-4 border-t flex justify-between items-center">
            <div class="flex items-center gap-1">
               <CheckCircleOutlined v-if="item.last_status === 'online'" class="text-green-500" />
               <ExclamationCircleOutlined v-else class="text-gray-300" />
               <span class="text-xs text-gray-400">最后检测: 刚才</span>
            </div>
            <a-button size="small" :loading="testLoading" @click="handleTest(item.id)">测试连接</a-button>
          </div>
        </div>
      </a-card>
    </div>

    <a-modal v-model:open="modalVisible" title="添加模型供应方" @ok="handleAdd">
      <a-form layout="vertical">
        <a-form-item label="配置名称">
          <a-input v-model:value="formState.name" placeholder="例如：DeepSeek官方" />
        </a-form-item>
        <a-form-item label="供应商">
          <a-select v-model:value="formState.provider">
            <a-select-option value="openai">OpenAI</a-select-option>
            <a-select-option value="deepseek">DeepSeek</a-select-option>
            <a-select-option value="ollama">Ollama</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Base URL">
          <a-input v-model:value="formState.base_url" placeholder="https://api.openai.com/v1" />
        </a-form-item>
        <a-form-item label="API Key">
          <a-input-password v-model:value="formState.api_key" placeholder="sk-..." />
        </a-form-item>
        <a-form-item label="模型名称">
          <a-input v-model:value="formState.model_name" placeholder="gpt-4o / deepseek-chat" />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="formState.is_default">设为默认模型</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
