<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>模板结构预览</span>
        <el-tag effect="plain">{{ rootFields.length }} 顶层字段</el-tag>
      </div>
    </template>

    <el-empty v-if="!schema" description="上传并解析模板后，这里会展示顶层字段和循环结构" />

    <div v-else class="schema-content">
      <div class="schema-block">
        <div class="schema-title">顶层字段</div>
        <div class="tags">
          <el-tag v-for="field in rootFields" :key="field" effect="plain">{{ field }}</el-tag>
        </div>
      </div>

      <div class="schema-block">
        <div class="schema-title">循环结构</div>
        <div v-if="loops.length === 0" class="schema-empty">当前模板未解析到循环结构</div>
        <div v-else class="loop-list">
          <div v-for="loop in loops" :key="loop" class="loop-line">{{ loop }}</div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TemplateSchema } from '../../features/generation/templateSchema'
import { describeTemplateLoops } from '../../features/generation/templateSchema'

const props = defineProps<{
  schema?: TemplateSchema | null
}>()

const rootFields = computed(() => props.schema?.rootFields || [])
const loops = computed(() => props.schema ? describeTemplateLoops(props.schema.loops) : [])
</script>

<style scoped>
.panel-card {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.schema-content,
.schema-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schema-title {
  color: var(--text-primary);
  font-weight: 600;
}

.schema-empty,
.loop-line {
  color: var(--text-secondary);
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loop-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
