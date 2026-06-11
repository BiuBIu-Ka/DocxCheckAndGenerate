<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { generateDocument } from '@/services/api'
import type { GenerationResponse } from '@/types/platform'

const loading = ref(false)
const result = ref<GenerationResponse | null>(null)
const formState = reactive({
  documentType: 'requirements',
  projectName: '某型指控软件升级项目',
  templateName: 'GJB-软件需求规格说明书模板',
  prompt: '围绕任务规划、数据链路、异常告警与权限管理生成功能性需求。',
})

async function handleGenerate() {
  loading.value = true
  try {
    result.value = await generateDocument(formState)
    message.success('文档初稿已生成，并自动完成首轮审查。')
  } catch (error) {
    console.error(error)
    message.error('生成失败，请确认后端服务是否已经启动。')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <a-alert
      type="info"
      show-icon
      message="当前生成内容为演示编排结果，便于验证前后端流程；接入真实模型后，可替换为实际知识检索与模型输出。"
    />

    <div class="grid grid-cols-1 gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
    <a-card class="platform-card" title="生成指令">
      <a-form layout="vertical">
        <a-form-item label="文档类型">
          <a-select v-model:value="formState.documentType">
            <a-select-option value="requirements">需求规格说明书</a-select-option>
            <a-select-option value="design">设计说明书</a-select-option>
            <a-select-option value="testing">测试说明书</a-select-option>
            <a-select-option value="manual">电子交互手册</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="项目名称">
          <a-input v-model:value="formState.projectName" />
        </a-form-item>
        <a-form-item label="模板名称">
          <a-input v-model:value="formState.templateName" />
        </a-form-item>
        <a-form-item label="生成意图">
          <a-textarea v-model:value="formState.prompt" :rows="6" />
        </a-form-item>
        <a-button type="primary" block size="large" :loading="loading" @click="handleGenerate">
          生成并自动审查
        </a-button>
      </a-form>
    </a-card>

    <a-card class="platform-card" title="输出预览">
      <template v-if="result">
        <div class="mb-5 flex flex-wrap items-center gap-3">
          <a-tag color="processing">{{ result.documentType }}</a-tag>
          <a-tag color="success">综合评分 {{ result.review.score }}</a-tag>
          <span class="text-sm text-slate-400">{{ result.title }}</span>
        </div>
        <a-alert type="info" show-icon :message="result.review.summary" class="mb-5" />
        <div class="space-y-4">
          <div v-for="section in result.sections" :key="section.title" class="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div class="mb-3 text-base font-medium text-white">{{ section.title }}</div>
            <p class="text-sm leading-7 text-slate-300">{{ section.body }}</p>
          </div>
        </div>
      </template>
      <a-empty v-else description="填写左侧生成参数后，这里会展示章节草稿与首轮审查摘要。" />
    </a-card>
    </div>
  </div>
</template>
