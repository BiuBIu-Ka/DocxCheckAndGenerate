<template>
  <div class="metrics-grid">
    <div class="metric-card">
      <span class="metric-label">轮次</span>
      <strong>{{ metrics.rounds }}</strong>
    </div>
    <div class="metric-card">
      <span class="metric-label">工具调用</span>
      <strong>{{ metrics.toolCalls }}</strong>
    </div>
    <div class="metric-card">
      <span class="metric-label">Patch</span>
      <strong>{{ metrics.patches }}</strong>
    </div>
    <div class="metric-card">
      <span class="metric-label">MCP</span>
      <strong>{{ metrics.mcpCalls }}</strong>
    </div>
    <div class="metric-card">
      <span class="metric-label">耗时</span>
      <strong>{{ metrics.totalDurationMs }} ms</strong>
    </div>
    <div class="metric-card">
      <span class="metric-label">状态</span>
      <strong>{{ generating ? `步骤 ${currentStep}` : '待机' }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GenerationMetrics } from '../../types/app'

defineProps<{
  metrics: GenerationMetrics
  generating: boolean
  currentStep: number
}>()
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
}

.metric-label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 12px;
}

strong {
  color: var(--text-primary);
}
</style>
