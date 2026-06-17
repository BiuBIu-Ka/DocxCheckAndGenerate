<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>结果预览与导出</span>
        <el-space wrap>
          <el-button size="small" @click="$emit('copy')" :disabled="!previewJson">复制 JSON</el-button>
          <el-button type="success" size="small" @click="$emit('export')" :disabled="!canExport">导出 DOCX</el-button>
        </el-space>
      </div>
    </template>

    <div class="summary-card">
      <div class="summary-title">结构化摘要</div>
      <div class="summary-text">{{ previewSummary || '尚未生成结构化结果' }}</div>
    </div>

    <div class="summary-grid">
      <div class="summary-metric">
        <span>文本总量</span>
        <strong>{{ metrics.totalStringChars }}</strong>
      </div>
      <div class="summary-metric">
        <span>数组项</span>
        <strong>{{ metrics.totalArrayItems }}</strong>
      </div>
      <div class="summary-metric">
        <span>节点数</span>
        <strong>{{ metrics.totalNodes }}</strong>
      </div>
      <div class="summary-metric">
        <span>最大字段</span>
        <strong>{{ metrics.maxStringLength }}</strong>
      </div>
    </div>

    <el-tabs class="preview-tabs">
      <el-tab-pane label="原始 JSON">
        <pre class="preview-box">{{ previewJson || '暂无预览数据' }}</pre>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import type { GenerationMetrics } from '../../types/app'

defineProps<{
  previewJson: string
  previewSummary: string
  metrics: GenerationMetrics
  canExport: boolean
}>()

defineEmits<{
  (event: 'copy'): void
  (event: 'export'): void
}>()
</script>

<style scoped>
.panel-card {
  height: 100%;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary-card,
.summary-metric {
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.02);
}

.summary-card {
  padding: 14px;
}

.summary-title {
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 600;
}

.summary-text {
  color: var(--text-secondary);
  white-space: pre-wrap;
  line-height: 1.6;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0;
}

.summary-metric {
  padding: 12px;
}

.summary-metric span {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 12px;
}

.summary-metric strong {
  color: var(--text-primary);
}

.preview-tabs {
  margin-top: 8px;
}

.preview-box {
  margin: 0;
  max-height: calc(100vh - 420px);
  overflow: auto;
  padding: 14px;
  border-radius: 14px;
  background: rgba(5, 8, 13, 0.72);
  color: #d7e0ea;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
