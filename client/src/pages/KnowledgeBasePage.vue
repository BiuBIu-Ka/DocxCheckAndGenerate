<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { fetchKnowledgeSummary } from '@/services/api'
import type { KnowledgeSummary } from '@/types/platform'

const data = ref<KnowledgeSummary | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await fetchKnowledgeSummary()
  } catch (error) {
    console.error(error)
    message.error('知识资产统计拉取失败，请确认后端服务是否已启动。')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <a-alert
      type="info"
      show-icon
      message="当前数量来自仓库实时统计：规则文件、项目文档、页面实现与测试文件都会随代码变化实时更新。"
    />

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <a-card class="platform-card" title="知识资产概览" :loading="loading">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div v-for="asset in data?.assets || []" :key="asset.category" class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div class="text-sm text-slate-400">{{ asset.category }}</div>
            <div class="mt-3 text-3xl font-semibold text-white">{{ asset.count }}</div>
            <div class="mt-2 text-sm leading-6 text-slate-300">{{ asset.description }}</div>
          </div>
        </div>
      </a-card>
      <a-card class="platform-card" title="术语基线样例">
        <div class="flex flex-wrap gap-3">
          <a-tag v-for="term in data?.hotTerms || []" :key="term" color="blue">{{ term }}</a-tag>
        </div>
      </a-card>
    </div>
  </div>
</template>
