<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>模板列表</span>
        <el-button type="primary" size="small" @click="$emit('create')">新增模板</el-button>
      </div>
    </template>

    <div class="template-list">
      <el-empty v-if="templates.length === 0" description="暂无模板" />
      <button
        v-for="item in templates"
        :key="item.id"
        class="template-item"
        :class="{ active: selectedId === item.id }"
        @click="$emit('select', item.id)"
      >
        <div class="template-item-top">
          <strong>{{ item.name }}</strong>
          <el-tag size="small" effect="plain">{{ item.variables.length }} 变量</el-tag>
        </div>
        <div class="template-item-meta">{{ item.fileName || item.path || '未上传 DOCX' }}</div>
        <div class="template-actions">
          <el-button size="small" @click.stop="$emit('generate', item.id)">去生成</el-button>
          <el-button size="small" type="danger" @click.stop="$emit('delete', item.id)">删除</el-button>
        </div>
      </button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { TemplateProfile } from '../../types/app'

defineProps<{
  templates: TemplateProfile[]
  selectedId: string
}>()

defineEmits<{
  (event: 'create'): void
  (event: 'select', id: string): void
  (event: 'delete', id: string): void
  (event: 'generate', id: string): void
}>()
</script>

<style scoped>
.panel-card {
  height: 100%;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header,
.template-item-top,
.template-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-item {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.02);
  text-align: left;
  cursor: pointer;
}

.template-item.active {
  border-color: rgba(95, 168, 255, 0.6);
  background: rgba(95, 168, 255, 0.08);
}

.template-item-meta {
  margin: 8px 0 12px;
  color: var(--text-secondary);
  font-size: 13px;
  word-break: break-all;
}
</style>
