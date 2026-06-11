<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { fetchModelProviders } from '@/services/api'
import type { ModelProvider } from '@/types/platform'

const providers = ref<ModelProvider[]>([])
const loading = ref(false)

const columns = [
  { title: '提供方', dataIndex: 'provider', key: 'provider' },
  { title: '模型', dataIndex: 'model', key: 'model' },
  { title: '接入地址 / 配置位置', dataIndex: 'endpoint', key: 'endpoint' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 160 },
  { title: '默认', dataIndex: 'default', key: 'default', width: 100 },
]

const summaryCards = computed(() => ({
  online: providers.value.filter((item) => item.status === 'online').length,
  configured: providers.value.filter((item) => ['configured', 'installed'].includes(item.status)).length,
  unavailable: providers.value.filter((item) => ['missing', 'not_configured'].includes(item.status)).length,
}))

function getStatusColor(status: string) {
  if (status === 'online') return 'success'
  if (status === 'installed' || status === 'configured') return 'processing'
  if (status === 'missing') return 'error'
  return 'default'
}

function getStatusLabel(status: string) {
  if (status === 'online') return '已连通'
  if (status === 'installed') return '已安装未就绪'
  if (status === 'configured') return '已配置待验证'
  if (status === 'missing') return '未安装'
  if (status === 'not_configured') return '未配置'
  return status
}

async function loadProviders() {
  loading.value = true
  try {
    providers.value = await fetchModelProviders()
  } catch (error) {
    console.error(error)
    message.error('模型状态拉取失败，请确认后端服务是否已启动。')
  } finally {
    loading.value = false
  }
}

onMounted(loadProviders)
</script>

<template>
  <div class="space-y-6">
    <a-card class="platform-card" title="模型供应商真实状态" :loading="loading">
      <a-alert
        :type="summaryCards.online > 0 ? 'success' : 'warning'"
        show-icon
        :message="summaryCards.online > 0 ? '已探测到可直接调用的模型供应方。' : '当前未探测到在线模型服务，可安装 Ollama 或补充兼容接口配置。 '"
        class="mb-5"
      />
      <div class="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div class="text-sm text-slate-400">已连通</div>
          <div class="mt-3 text-3xl font-semibold text-white">{{ summaryCards.online }}</div>
          <div class="mt-2 text-sm leading-6 text-slate-300">可直接被平台调用的模型供应方数量。</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div class="text-sm text-slate-400">已配置 / 已安装</div>
          <div class="mt-3 text-3xl font-semibold text-white">{{ summaryCards.configured }}</div>
          <div class="mt-2 text-sm leading-6 text-slate-300">具备接入基础条件，但仍需实际连通性验证。</div>
        </div>
        <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div class="text-sm text-slate-400">未就绪</div>
          <div class="mt-3 text-3xl font-semibold text-white">{{ summaryCards.unavailable }}</div>
          <div class="mt-2 text-sm leading-6 text-slate-300">尚未安装或尚未配置的模型供应方数量。</div>
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
