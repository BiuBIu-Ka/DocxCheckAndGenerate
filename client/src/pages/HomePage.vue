<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import MetricCard from '@/components/MetricCard.vue'
import { fetchStatusSummary } from '@/services/api'
import type { StatusSummary } from '@/types/platform'

const loading = ref(false)
const summary = ref<StatusSummary | null>(null)

const metrics = computed(() => {
  if (!summary.value) return []

  const onlineProviders = summary.value.modelProviders.filter((item) => item.status === 'online').length
  return [
    {
      title: '代码工作区',
      value: summary.value.code.dirty ? '存在变更' : '干净',
      description: `分支 ${summary.value.code.branch} · 提交 ${summary.value.code.commit}`,
      accent: '#22d3ee',
    },
    {
      title: '运行环境',
      value: `${summary.value.environment.versions.node} / ${summary.value.environment.versions.python}`,
      description: `Node 与 Python 版本由后端实时探测，工作区为 ${summary.value.environment.workspace}`,
      accent: '#a78bfa',
    },
    {
      title: '模型在线数',
      value: String(onlineProviders),
      description: onlineProviders > 0 ? '至少存在一个可直接调用的模型供应方。' : '当前未探测到在线模型服务。',
      accent: '#34d399',
    },
  ]
})

const serviceStatusText = {
  ready: '已就绪',
  missing: '缺失',
  online: '在线',
  installed: '已安装未就绪',
  configured: '已配置',
  not_configured: '未配置',
}

const serviceStatusColor = {
  ready: 'success',
  missing: 'error',
  online: 'success',
  installed: 'processing',
  configured: 'processing',
  not_configured: 'default',
}

onMounted(async () => {
  loading.value = true
  try {
    summary.value = await fetchStatusSummary()
  } catch (error) {
    console.error(error)
    message.error('状态拉取失败，请确认后端服务是否已启动。')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <section class="hero-panel">
      <div>
        <div class="badge-line">军工软件 · 文档工程 · 真实状态面板</div>
        <h1 class="hero-title">当前界面展示的是实际环境、代码仓库与模型接入状态，不再使用首页演示指标。</h1>
        <p class="hero-copy">
          系统实时读取当前工作区分支、提交、文件统计、运行时版本和本机模型接入可用性，便于你直接判断当前代码是否可测、环境是否可用。
        </p>
      </div>
      <div class="hero-grid">
        <div class="hero-chip">分支与提交</div>
        <div class="hero-chip">Node / Python 版本</div>
        <div class="hero-chip">模型接入探测</div>
        <div class="hero-chip">规则与测试资产</div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <MetricCard v-for="item in metrics" :key="item.title" v-bind="item" />
    </section>

    <section class="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <a-card class="platform-card" title="环境状态" :loading="loading">
        <template v-if="summary">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div class="text-sm text-slate-400">平台</div>
              <div class="mt-2 text-base font-medium text-white">{{ summary.environment.platform }}</div>
              <div class="mt-3 text-sm text-slate-400">工作区</div>
              <div class="mt-1 break-all text-sm text-slate-200">{{ summary.environment.workspace }}</div>
            </div>
            <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div class="text-sm text-slate-400">版本信息</div>
              <div class="mt-3 space-y-2 text-sm text-slate-200">
                <div>Node：{{ summary.environment.versions.node }}</div>
                <div>NPM：{{ summary.environment.versions.npm }}</div>
                <div>Python：{{ summary.environment.versions.python }}</div>
                <div>Git：{{ summary.environment.versions.git }}</div>
              </div>
            </div>
          </div>
          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div v-for="service in summary.environment.services" :key="service.name" class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm text-slate-300">{{ service.name }}</div>
                <a-tag :color="serviceStatusColor[service.status as keyof typeof serviceStatusColor] || 'default'">
                  {{ serviceStatusText[service.status as keyof typeof serviceStatusText] || service.status }}
                </a-tag>
              </div>
              <div class="mt-3 break-all text-xs leading-6 text-slate-500">{{ service.detail }}</div>
            </div>
          </div>
        </template>
      </a-card>

      <a-card class="platform-card" title="代码状态" :loading="loading">
        <template v-if="summary">
          <div class="space-y-4">
            <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div class="text-sm text-slate-400">工作树状态</div>
              <div class="mt-2 text-2xl font-semibold text-white">{{ summary.code.dirty ? '存在未提交改动' : '工作树干净' }}</div>
              <div class="mt-2 text-sm text-slate-300">变更文件 {{ summary.code.changedFiles }} 个，未跟踪文件 {{ summary.code.untrackedFiles }} 个</div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div class="text-sm text-slate-400">前端页面</div>
                <div class="mt-2 text-2xl font-semibold text-white">{{ summary.code.clientPages }}</div>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div class="text-sm text-slate-400">前端组件</div>
                <div class="mt-2 text-2xl font-semibold text-white">{{ summary.code.clientComponents }}</div>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div class="text-sm text-slate-400">后端路由</div>
                <div class="mt-2 text-2xl font-semibold text-white">{{ summary.code.serverRoutes }}</div>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div class="text-sm text-slate-400">自动化测试</div>
                <div class="mt-2 text-2xl font-semibold text-white">{{ summary.code.serverTests }}</div>
              </div>
            </div>
          </div>
        </template>
      </a-card>
    </section>
  </div>
</template>
