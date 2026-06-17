<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>模板编辑</span>
        <el-space>
          <el-button @click="$emit('pick-file')">上传 DOCX</el-button>
          <el-button type="primary" :loading="saving" @click="$emit('save')">保存模板</el-button>
        </el-space>
      </div>
    </template>

    <el-empty v-if="!template" description="请选择左侧模板，或新建一个模板" />

    <el-form v-else label-position="top">
      <el-form-item label="模板名称">
        <el-input :model-value="template.name" @update:model-value="emitUpdate('name', $event)" />
      </el-form-item>

      <el-form-item label="DOCX 文件">
        <el-input :model-value="template.fileName || template.path" disabled />
      </el-form-item>

      <el-form-item label="生成规则">
        <el-input
          :model-value="template.standardText"
          type="textarea"
          :rows="5"
          placeholder="填写该模板的整体规则、风格和约束。"
          @update:model-value="emitUpdate('standardText', $event)"
        />
      </el-form-item>

      <el-form-item label="变量说明与示例">
        <el-table :data="template.variables" border size="small">
          <el-table-column prop="name" label="变量名" width="220" />
          <el-table-column label="说明">
            <template #default="{ row, $index }">
              <el-input
                :model-value="row.description"
                @update:model-value="emitVariableUpdate($index, $event)"
                placeholder="补充变量含义或示例"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import type { TemplateProfile } from '../../types/app'

const props = defineProps<{
  template?: TemplateProfile
  saving: boolean
}>()

const emit = defineEmits<{
  (event: 'update:template', value: TemplateProfile): void
  (event: 'pick-file'): void
  (event: 'save'): void
}>()

function emitUpdate(key: keyof TemplateProfile, value: any) {
  if (!props.template) return
  emit('update:template', {
    ...props.template,
    [key]: value,
  })
}

function emitVariableUpdate(index: number, value: string) {
  if (!props.template) return
  const nextVariables = [...props.template.variables]
  nextVariables[index] = {
    ...nextVariables[index],
    description: value,
  }
  emit('update:template', {
    ...props.template,
    variables: nextVariables,
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
  gap: 12px;
}
</style>
