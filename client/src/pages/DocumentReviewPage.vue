<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import IssueTable from '@/components/IssueTable.vue'
import { reviewDocument } from '@/services/api'
import type { ReviewIssue, ReviewResponse } from '@/types/platform'

const loading = ref(false)
const review = ref<ReviewResponse | null>(null)
const formState = reactive({
  documentType: 'design',
  content: `1. 系统概述
本文档描述平台功能。
2. 模块设计
需要说明接口和异常处理。
术语中仍使用“数据库表单”这一禁用表达。`,
})

async function handleReview() {
  loading.value = true
  try {
    review.value = await reviewDocument(formState)
    message.success('审查完成，问题清单已生成。')
  } catch (error) {
    console.error(error)
    message.error('审查失败，请检查后端服务。')
  } finally {
    loading.value = false
  }
}

function updateIssueStatus(payload: { id: string; status: ReviewIssue['status'] }) {
  if (!review.value) return
  review.value = {
    ...review.value,
    issues: review.value.issues.map((item) => (item.id === payload.id ? { ...item, status: payload.status } : item)),
  }
}
</script>

<template>
  <div class="space-y-6">
    <a-card class="platform-card" title="审查输入">
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-[220px_1fr_180px]">
        <a-select v-model:value="formState.documentType">
          <a-select-option value="requirements">需求规格说明书</a-select-option>
          <a-select-option value="design">设计说明书</a-select-option>
          <a-select-option value="testing">测试说明书</a-select-option>
          <a-select-option value="manual">电子交互手册</a-select-option>
        </a-select>
        <a-textarea v-model:value="formState.content" :rows="7" />
        <a-button type="primary" size="large" :loading="loading" @click="handleReview">发起审查</a-button>
      </div>
    </a-card>

    <a-card class="platform-card" title="问题清单">
      <template v-if="review">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <a-statistic title="综合评分" :value="review.score" />
          <a-alert type="warning" show-icon :message="review.summary" class="flex-1 min-w-[260px]" />
        </div>
        <IssueTable :issues="review.issues" :loading="loading" @update-status="updateIssueStatus" />
      </template>
      <a-empty v-else description="输入待审内容后，这里会返回规则命中结果与整改建议。" />
    </a-card>
  </div>
</template>
