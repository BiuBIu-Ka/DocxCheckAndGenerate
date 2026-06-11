<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchModelProviders } from '@/services/api'
import type { ModelProvider } from '@/types/platform'

const providers = ref<ModelProvider[]>([])
const loading = ref(false)

const columns = [
  { title: '提供方', dataIndex: 'provider', key: 'provider' },
  { title: '模型', dataIndex: 'model', key: 'model' },
  { title: '接入地址', dataIndex: 'endpoint', key: 'endpoint' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '默认', dataIndex: 'default', key: 'default', width: 100 },
]

onMounted(async () => {
  loading.value = true
  try {
    providers.value = await fetchModelProviders()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <a-card class="platform-card" title="模型供应商配置" :loading="loading">
    <a-alert type="info" show-icon message="模型网关支持本地 32B 主模型与兼容式提供方切换，便于适配 Ollama、DeepSeek 或 OpenAI 兼容接口。" class="mb-5" />
    <a-table :columns="columns" :data-source="providers" :pagination="false" row-key="provider" class="platform-table">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'online' ? 'success' : 'warning'">{{ record.status }}</a-tag>
        </template>
        <template v-else-if="column.key === 'default'">
          <a-badge :status="record.default ? 'success' : 'default'" :text="record.default ? '是' : '否'" />
        </template>
      </template>
    </a-table>
  </a-card>
</template>
