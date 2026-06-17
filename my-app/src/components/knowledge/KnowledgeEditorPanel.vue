<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>知识内容</span>
        <el-space>
          <el-button @click="$emit('upload')">上传文件</el-button>
          <el-button type="primary" :loading="saving" @click="$emit('save')">保存知识库</el-button>
        </el-space>
      </div>
    </template>

    <el-empty v-if="!knowledgeBase" description="请选择左侧知识库" />
    <el-form v-else label-position="top">
      <el-form-item label="知识库名称">
        <el-input :model-value="knowledgeBase.name" @update:model-value="emitUpdate('name', $event)" />
      </el-form-item>
      <el-form-item label="正文内容">
        <el-input
          :model-value="knowledgeBase.content"
          type="textarea"
          :rows="18"
          placeholder="可以手动维护知识内容，或通过上传 txt / md / docx 自动提取。"
          @update:model-value="emitUpdate('content', $event)"
        />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import type { KnowledgeBaseRecord } from '../../types/app'

const props = defineProps<{
  knowledgeBase?: KnowledgeBaseRecord
  saving: boolean
}>()

const emit = defineEmits<{
  (event: 'update:knowledgeBase', value: KnowledgeBaseRecord): void
  (event: 'upload'): void
  (event: 'save'): void
}>()

function emitUpdate(key: keyof KnowledgeBaseRecord, value: any) {
  if (!props.knowledgeBase) return
  emit('update:knowledgeBase', {
    ...props.knowledgeBase,
    [key]: value,
  })
}
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
</style>
