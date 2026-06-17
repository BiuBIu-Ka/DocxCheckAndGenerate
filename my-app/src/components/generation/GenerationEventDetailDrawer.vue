<template>
  <el-drawer
    :model-value="modelValue"
    size="42%"
    title="事件详情"
    @close="$emit('update:modelValue', false)"
  >
    <template v-if="event">
      <div class="detail-head">
        <div>
          <div class="detail-title">{{ event.title }}</div>
          <div class="detail-meta">
            <span>{{ event.type }}</span>
            <span>{{ formatTime(event.timestamp) }}</span>
            <span v-if="event.durationMs">耗时 {{ event.durationMs }} ms</span>
          </div>
        </div>
        <el-tag :type="tagType">{{ statusLabel }}</el-tag>
      </div>

      <div class="detail-section">
        <div class="section-title">摘要</div>
        <div class="section-content">{{ event.summary }}</div>
      </div>

      <div class="detail-section">
        <div class="section-title">原始载荷</div>
        <pre class="payload-box">{{ payloadText }}</pre>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationTimelineEvent } from '../../types/app'

const props = defineProps<{
  modelValue: boolean
  event?: GenerationTimelineEvent
}>()

defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString()
}

const tagType = computed(() =>
  props.event?.status === 'error' ? 'danger'
  : props.event?.status === 'warning' ? 'warning'
  : props.event?.status === 'success' ? 'success'
  : 'info',
)

const statusLabel = computed(() =>
  props.event?.status === 'error' ? '错误'
  : props.event?.status === 'warning' ? '警告'
  : props.event?.status === 'success' ? '完成'
  : '信息',
)

const payloadText = computed(() => {
  if (!props.event?.payload) return '暂无原始载荷'
  try {
    return JSON.stringify(props.event.payload, null, 2)
  } catch {
    return String(props.event.payload)
  }
})
</script>

<style scoped>
.detail-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.detail-title {
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.detail-section {
  margin-top: 18px;
}

.section-title {
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 600;
}

.section-content {
  color: var(--text-secondary);
  line-height: 1.7;
}

.payload-box {
  margin: 0;
  padding: 14px;
  border-radius: 14px;
  background: rgba(5, 8, 13, 0.85);
  color: #d7e0ea;
  max-height: calc(100vh - 240px);
  overflow: auto;
  white-space: pre-wrap;
}
</style>
