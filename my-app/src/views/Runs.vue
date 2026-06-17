<template>
  <div class="page-shell">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Runs</div>
        <h2>任务记录</h2>
        <p>回看最近生成任务的时间线、错误和结构化结果摘要。</p>
      </div>
      <el-button @click="refreshRuns">刷新记录</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="9">
        <el-card class="panel-card">
          <template #header>
            <div class="card-header">
              <span>最近任务</span>
              <el-tag effect="plain">{{ runs.length }}</el-tag>
            </div>
          </template>

          <el-empty v-if="runs.length === 0" description="暂无任务记录" />
          <div v-else class="run-list">
            <button
              v-for="run in runs"
              :key="run.id"
              class="run-item"
              :class="{ active: selectedRun?.id === run.id }"
              @click="selectedRunId = run.id"
            >
              <div class="run-item-top">
                <strong>{{ run.templateName || '未命名模板' }}</strong>
                <el-tag size="small" :type="run.status === 'success' ? 'success' : run.status === 'error' ? 'danger' : 'info'">
                  {{ run.status }}
                </el-tag>
              </div>
              <div class="run-item-meta">
                <span>{{ formatTime(run.createdAt) }}</span>
                <span>{{ run.metrics.totalDurationMs }} ms</span>
              </div>
              <div class="run-item-summary">{{ run.previewSummary || run.errorMessage || '暂无摘要' }}</div>
            </button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="15">
        <el-card class="panel-card" v-if="selectedRun">
          <template #header>
            <div class="card-header">
              <span>{{ selectedRun.templateName || '未命名模板' }}</span>
              <el-space wrap>
                <el-tag effect="plain">轮次 {{ selectedRun.metrics.rounds }}</el-tag>
                <el-tag effect="plain">工具 {{ selectedRun.metrics.toolCalls }}</el-tag>
                <el-tag effect="plain">Patch {{ selectedRun.metrics.patches }}</el-tag>
                <el-tag effect="plain">MCP {{ selectedRun.metrics.mcpCalls }}</el-tag>
              </el-space>
            </div>
          </template>

          <div class="detail-grid">
            <div class="detail-block">
              <div class="block-title">知识库</div>
              <div class="block-content">{{ selectedRun.knowledgeBaseNames.join('、') || '未选择' }}</div>
            </div>
            <div class="detail-block">
              <div class="block-title">结果摘要</div>
              <div class="block-content">{{ selectedRun.previewSummary || selectedRun.errorMessage || '暂无结果摘要' }}</div>
            </div>
          </div>

          <div class="timeline-title">时间线</div>
          <el-timeline>
            <el-timeline-item
              v-for="event in selectedRun.events"
              :key="event.id"
              :timestamp="formatTime(event.timestamp)"
              :type="event.status === 'error' ? 'danger' : event.status === 'warning' ? 'warning' : 'primary'"
            >
              <div class="timeline-item">
                <div class="timeline-item-head">
                  <strong>{{ event.title }}</strong>
                  <span class="timeline-type">{{ event.type }}</span>
                </div>
                <div class="timeline-summary">{{ event.summary }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <el-empty v-else description="请选择左侧任务查看详情" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGenerationWorkbenchStore } from '../stores/generationWorkbench'

const workbench = useGenerationWorkbenchStore()
const selectedRunId = ref('')

const runs = computed(() => workbench.recentRuns)
const selectedRun = computed(() => runs.value.find((item) => item.id === selectedRunId.value) || runs.value[0])

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString()
}

async function refreshRuns() {
  await workbench.loadRecentRuns()
  if (!selectedRunId.value && workbench.recentRuns[0]) {
    selectedRunId.value = workbench.recentRuns[0].id
  }
}

onMounted(async () => {
  await refreshRuns()
})
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.page-header h2 {
  margin: 6px 0 6px;
  color: var(--text-primary);
}

.page-header p,
.page-eyebrow {
  color: var(--text-secondary);
  margin: 0;
}

.panel-card {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.run-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.run-item {
  width: 100%;
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  padding: 14px;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.run-item.active {
  border-color: rgba(95, 168, 255, 0.6);
  background: rgba(95, 168, 255, 0.08);
}

.run-item-top,
.run-item-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.run-item-meta,
.run-item-summary,
.timeline-type,
.timeline-summary,
.block-title {
  color: var(--text-secondary);
}

.run-item-summary {
  margin-top: 8px;
  line-height: 1.6;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.detail-block {
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
}

.block-content {
  margin-top: 8px;
  color: var(--text-primary);
  line-height: 1.6;
}

.timeline-title {
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.timeline-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
