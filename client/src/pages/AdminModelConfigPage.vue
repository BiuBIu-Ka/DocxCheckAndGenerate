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

function getStatusColor(status: string) {
  if (status === 'online') return 'success'
  if (status === 'mock') return 'processing'
  return 'warning'
}

function getStatusLabel(status: string) {
  if (status === 'online') return '已连通'
  if (status === 'mock') return '示例配置'
  return '待接入'
}

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
  <div class="space-y-6">
    <a-card class="platform-card" title="模型供应商配置" :loading="loading">
      <a-alert
        type="warning"
        show-icon
        message="当前列表来自后端示例配置，用于展示平台支持的模型接入形态；这不代表本机已经实际连通 Ollama 或其他模型服务。"
        class="mb-5"
      />
      <div class="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div class="text-sm text-slate-400">当前模式</div>
          <div class="mt-3 text-2xl font-semibold text-white">示例配置展示</div>
          <div class="mt-2 text-sm leading-6 text-slate-300">用于说明模型网关支持的接入协议和后续扩展方式。</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div class="text-sm text-slate-400">推荐接入路径</div>
          <div class="mt-3 text-2xl font-semibold text-white">统一模型网关</div>
          <div class="mt-2 text-sm leading-6 text-slate-300">通过一层 Provider 抽象切换本地主模型、Ollama 和兼容 API。</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div class="text-sm text-slate-400">下一步</div>
          <div class="mt-3 text-2xl font-semibold text-white">接入真实探测</div>
          <div class="mt-2 text-sm leading-6 text-slate-300">后续可增加健康检查、鉴权校验、延迟测试和默认模型切换。</div>
        </div>
      </div>
      <a-table :columns="columns" :data-source="providers" :pagination="false" row-key="provider" class="platform-table">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusLabel(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'default'">
          <a-badge :status="record.default ? 'success' : 'default'" :text="record.default ? '是' : '否'" />
        </template>
      </template>
    </a-table>
    </a-card>
  </div>
</template>
