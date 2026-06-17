<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>来源与统计</span>
        <el-tag effect="plain">{{ knowledgeBase?.files.length || 0 }} 文件</el-tag>
      </div>
    </template>

    <el-empty v-if="!knowledgeBase" description="选择知识库后可查看来源文件和统计信息" />

    <div v-else class="stats-content">
      <div class="stats-grid">
        <div class="stat-card">
          <span>字符数</span>
          <strong>{{ stats.charCount }}</strong>
        </div>
        <div class="stat-card">
          <span>分段数</span>
          <strong>{{ stats.blockCount }}</strong>
        </div>
      </div>

      <div class="stats-hint">{{ stats.recommendedQueryHint }}</div>

      <div class="file-list">
        <div class="section-title">来源文件</div>
        <el-empty v-if="knowledgeBase.files.length === 0" description="暂无来源文件" />
        <div v-else class="file-tags">
          <el-tag
            v-for="item in knowledgeBase.files"
            :key="item"
            closable
            @close="$emit('remove-file', item)"
          >
            {{ item }}
          </el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeBaseRecord } from '../../types/app'
import { buildKnowledgeStats } from '../../services/knowledgeService'

const props = defineProps<{
  knowledgeBase?: KnowledgeBaseRecord
}>()

defineEmits<{
  (event: 'remove-file', filename: string): void
}>()

const stats = computed(() => buildKnowledgeStats(props.knowledgeBase?.content || ''))
</script>

<style scoped>
.panel-card {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header,
.stats-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stat-card {
  flex: 1;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
}

.stat-card span,
.stats-hint,
.section-title {
  color: var(--text-secondary);
}

.stats-hint {
  padding: 12px;
  border-radius: 14px;
  background: rgba(230, 162, 60, 0.1);
}

.file-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
