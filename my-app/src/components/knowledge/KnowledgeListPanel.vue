<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>知识库列表</span>
        <el-button type="primary" size="small" @click="$emit('create')">新建</el-button>
      </div>
    </template>

    <div class="kb-list">
      <el-empty v-if="knowledgeBases.length === 0" description="暂无知识库" />
      <button
        v-for="item in knowledgeBases"
        :key="item.id"
        class="kb-item"
        :class="{ active: selectedId === item.id }"
        @click="$emit('select', item.id)"
      >
        <div class="kb-item-top">
          <strong>{{ item.name }}</strong>
          <el-tag size="small" effect="plain">{{ item.files.length }} 文件</el-tag>
        </div>
        <div class="kb-meta">{{ item.content.length }} 字</div>
        <div class="kb-actions">
          <el-button size="small" type="danger" @click.stop="$emit('delete', item.id)">删除</el-button>
        </div>
      </button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { KnowledgeBaseRecord } from '../../types/app'

defineProps<{
  knowledgeBases: KnowledgeBaseRecord[]
  selectedId: string
}>()

defineEmits<{
  (event: 'create'): void
  (event: 'select', id: string): void
  (event: 'delete', id: string): void
}>()
</script>

<style scoped>
.panel-card {
  height: 100%;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header,
.kb-item-top,
.kb-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.kb-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kb-item {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.02);
  text-align: left;
  cursor: pointer;
}

.kb-item.active {
  border-color: rgba(95, 168, 255, 0.6);
  background: rgba(95, 168, 255, 0.08);
}

.kb-meta {
  margin: 8px 0 12px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
