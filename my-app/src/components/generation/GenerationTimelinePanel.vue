<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>AI 运行时间线</span>
        <el-tag effect="plain">{{ events.length }} 条事件</el-tag>
      </div>
    </template>

    <GenerationMetricsBar :metrics="metrics" :generating="generating" :current-step="currentStep" />

    <div class="timeline-list">
      <el-empty v-if="events.length === 0" description="开始生成后，这里会完整展示每轮 AI 与工具细节" />

      <button
        v-for="event in normalizedEvents"
        :key="event.id"
        class="timeline-card"
        :class="[event.tone, { active: selectedEventId === event.id }]"
        @click="$emit('select-event', event.id)"
      >
        <div class="timeline-card-head">
          <div>
            <div class="timeline-title">{{ event.title }}</div>
            <div class="timeline-meta">
              <span>{{ event.type }}</span>
              <span>{{ formatTime(event.timestamp) }}</span>
            </div>
          </div>
          <el-tag size="small" :type="event.tagType">{{ event.statusLabel }}</el-tag>
        </div>
        <div class="timeline-summary">{{ event.summary }}</div>
        <div class="timeline-footer" v-if="event.durationMs || event.sourceName">
          <span v-if="event.durationMs">耗时 {{ event.durationMs }} ms</span>
          <span v-if="event.sourceName">{{ event.sourceName }}</span>
        </div>
      </button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationMetrics, GenerationTimelineEvent } from '../../types/app'
import GenerationMetricsBar from './GenerationMetricsBar.vue'

const props = defineProps<{
  events: GenerationTimelineEvent[]
  metrics: GenerationMetrics
  generating: boolean
  currentStep: number
  selectedEventId: string
}>()

defineEmits<{
  (event: 'select-event', value: string): void
}>()

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString()
}

const normalizedEvents = computed(() =>
  props.events.map((event) => {
    const tagType =
      event.status === 'error' ? 'danger'
      : event.status === 'warning' ? 'warning'
      : event.status === 'success' ? 'success'
      : 'info'

    return {
      ...event,
      tone: event.status || 'info',
      tagType,
      statusLabel:
        event.status === 'error' ? '错误'
        : event.status === 'warning' ? '警告'
        : event.status === 'success' ? '完成'
        : '进行中',
    }
  }),
)
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

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  max-height: calc(100vh - 280px);
  overflow: auto;
}

.timeline-card {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--panel-border);
  text-align: left;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
}

.timeline-card.active {
  border-color: rgba(95, 168, 255, 0.6);
  background: rgba(95, 168, 255, 0.08);
}

.timeline-card.warning {
  border-color: rgba(230, 162, 60, 0.45);
}

.timeline-card.error {
  border-color: rgba(245, 108, 108, 0.45);
}

.timeline-card-head,
.timeline-meta,
.timeline-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.timeline-title {
  color: var(--text-primary);
  font-weight: 600;
}

.timeline-meta,
.timeline-summary,
.timeline-footer {
  color: var(--text-secondary);
  font-size: 13px;
}

.timeline-summary {
  margin-top: 10px;
  line-height: 1.6;
}

.timeline-footer {
  justify-content: flex-start;
  margin-top: 10px;
}
</style>
