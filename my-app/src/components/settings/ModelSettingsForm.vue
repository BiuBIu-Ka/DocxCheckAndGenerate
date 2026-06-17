<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>模型配置</span>
        <el-space>
          <el-button @click="$emit('test')" :loading="testing">测试连接</el-button>
          <el-button type="primary" @click="$emit('save')" :loading="saving">保存配置</el-button>
        </el-space>
      </div>
    </template>

    <el-form label-position="top">
      <el-form-item label="API URL">
        <el-input :model-value="model.apiUrl" placeholder="https://api.openai.com/v1" @update:model-value="emitUpdate('apiUrl', $event)" />
      </el-form-item>
      <el-form-item label="API Key">
        <el-input :model-value="model.apiKey" type="password" show-password @update:model-value="emitUpdate('apiKey', $event)" />
      </el-form-item>
      <el-form-item label="模型名称">
        <el-input :model-value="model.modelName" placeholder="gpt-4o / deepseek-chat" @update:model-value="emitUpdate('modelName', $event)" />
      </el-form-item>
      <el-form-item label="温度">
        <el-slider :model-value="model.temperature" :min="0" :max="1.2" :step="0.1" @update:model-value="emitUpdate('temperature', $event)" />
      </el-form-item>
      <el-form-item label="最大轮次">
        <el-input-number :model-value="model.maxRounds" :min="5" :max="80" @update:model-value="emitUpdate('maxRounds', $event)" />
      </el-form-item>
      <el-form-item label="默认开启调试">
        <el-switch :model-value="model.debugEnabled" @update:model-value="emitUpdate('debugEnabled', $event)" />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import type { ModelConfig } from '../../types/app'

const props = defineProps<{
  model: ModelConfig
  saving: boolean
  testing: boolean
}>()

const emit = defineEmits<{
  (event: 'update:model', value: ModelConfig): void
  (event: 'save'): void
  (event: 'test'): void
}>()

function emitUpdate(key: keyof ModelConfig, value: any) {
  emit('update:model', {
    ...props.model,
    [key]: value,
  })
}
</script>

<style scoped>
.panel-card {
  max-width: 860px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
