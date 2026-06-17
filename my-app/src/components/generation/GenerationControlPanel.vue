<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>生成控制</span>
        <el-tag effect="plain">{{ generating ? '运行中' : '待机' }}</el-tag>
      </div>
    </template>

    <el-form label-position="top">
      <el-form-item label="模板">
        <el-select
          :model-value="selectedTemplateId"
          placeholder="请选择模板"
          style="width: 100%"
          @update:model-value="$emit('update:selectedTemplateId', $event)"
        >
          <el-option
            v-for="item in templates"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <div v-if="selectedTemplate" class="meta-box">
        <div class="meta-line"><span>文件：</span>{{ selectedTemplate.fileName || '未命名 DOCX' }}</div>
        <div class="meta-line"><span>变量：</span>{{ selectedTemplate.variables.length }}</div>
        <div class="meta-line"><span>规则：</span>{{ selectedTemplate.standardText ? '已配置' : '未配置' }}</div>
      </div>

      <el-form-item label="引用知识库">
        <el-select
          :model-value="selectedKnowledgeBaseIds"
          multiple
          clearable
          placeholder="选择本次生成要引用的知识库"
          style="width: 100%"
          @update:model-value="$emit('update:selectedKnowledgeBaseIds', $event)"
        >
          <el-option
            v-for="item in knowledgeBases"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="全局系统背景">
        <el-input
          :model-value="globalContext"
          type="textarea"
          :rows="4"
          placeholder="补充系统背景、总体目标、业务边界，提升整体相关度。"
          @update:model-value="$emit('update:globalContext', $event)"
        />
      </el-form-item>

      <el-form-item label="补充参考资料">
        <el-input
          :model-value="referenceMaterials"
          type="textarea"
          :rows="8"
          placeholder="手动补充本次生成必须参考的材料。"
          @update:model-value="$emit('update:referenceMaterials', $event)"
        />
      </el-form-item>

      <el-form-item label="注意事项">
        <el-input
          :model-value="notes"
          type="textarea"
          :rows="4"
          placeholder="填写本次生成的重点要求、约束或特殊说明。"
          @update:model-value="$emit('update:notes', $event)"
        />
      </el-form-item>

      <div class="checks">
        <div class="check-item">
          <span>模型</span>
          <el-tag size="small" :type="hasModelConfig ? 'success' : 'danger'">
            {{ hasModelConfig ? '已配置' : '未配置' }}
          </el-tag>
        </div>
        <div class="check-item">
          <span>模板</span>
          <el-tag size="small" :type="selectedTemplate ? 'success' : 'danger'">
            {{ selectedTemplate ? '已选择' : '未选择' }}
          </el-tag>
        </div>
        <div class="check-item">
          <span>知识库</span>
          <el-tag size="small" :type="selectedKnowledgeBaseIds.length > 0 || referenceMaterials.trim() ? 'success' : 'warning'">
            {{ selectedKnowledgeBaseIds.length > 0 || referenceMaterials.trim() ? '可生成' : '建议补充' }}
          </el-tag>
        </div>
      </div>

      <div class="actions">
        <el-button type="primary" :loading="generating" @click="$emit('run')">开始生成</el-button>
        <el-button @click="$emit('reset')">重置输入</el-button>
      </div>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import type { KnowledgeBaseRecord, TemplateProfile } from '../../types/app'

defineProps<{
  templates: TemplateProfile[]
  knowledgeBases: KnowledgeBaseRecord[]
  selectedTemplateId: string
  selectedTemplate?: TemplateProfile
  selectedKnowledgeBaseIds: string[]
  globalContext: string
  referenceMaterials: string
  notes: string
  hasModelConfig: boolean
  generating: boolean
}>()

defineEmits<{
  (event: 'update:selectedTemplateId', value: string): void
  (event: 'update:selectedKnowledgeBaseIds', value: string[]): void
  (event: 'update:globalContext', value: string): void
  (event: 'update:referenceMaterials', value: string): void
  (event: 'update:notes', value: string): void
  (event: 'run'): void
  (event: 'reset'): void
}>()
</script>

<style scoped>
.panel-card {
  height: 100%;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header,
.check-item,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.meta-box,
.checks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  margin-bottom: 18px;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.02);
}

.meta-line {
  color: var(--text-secondary);
  font-size: 13px;
}

.meta-line span {
  color: var(--text-primary);
  margin-right: 6px;
}

.actions {
  justify-content: flex-start;
}
</style>
