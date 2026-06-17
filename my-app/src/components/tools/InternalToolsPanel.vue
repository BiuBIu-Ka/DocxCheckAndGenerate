<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>内部工具</span>
        <el-space>
          <el-button @click="$emit('add')">新增 HTTP 工具</el-button>
          <el-button type="primary" :loading="saving" @click="$emit('save')">保存工具</el-button>
        </el-space>
      </div>
    </template>

    <el-empty v-if="tools.length === 0" description="暂无内部工具" />
    <el-collapse v-else>
      <el-collapse-item v-for="tool in tools" :key="tool.id" :name="tool.id">
        <template #title>
          <div class="item-title">
            <span>{{ tool.name }}</span>
            <el-tag size="small" :type="tool.type === 'system' ? 'primary' : 'warning'">{{ tool.type }}</el-tag>
          </div>
        </template>

        <el-form label-position="top">
          <el-form-item label="工具名称" v-if="tool.type === 'http'">
            <el-input :model-value="tool.name" @update:model-value="$emit('update-tool', { ...tool, name: $event })" />
          </el-form-item>

          <el-form-item label="描述">
            <el-input :model-value="tool.description" type="textarea" :rows="2" @update:model-value="$emit('update-tool', { ...tool, description: $event })" />
          </el-form-item>

          <el-form-item label="启用状态">
            <el-switch :model-value="tool.enabled" @update:model-value="$emit('update-tool', { ...tool, enabled: $event })" />
          </el-form-item>

          <template v-if="tool.type === 'http'">
            <el-form-item label="参数 JSON Schema">
              <el-input :model-value="tool.parametersText" type="textarea" :rows="4" @update:model-value="$emit('update-tool-raw', tool.id, 'parametersText', $event)" />
              <div class="error-text" v-if="tool.parametersError">{{ tool.parametersError }}</div>
            </el-form-item>
            <el-form-item label="URL">
              <el-input :model-value="tool.config?.url" @update:model-value="$emit('update-tool-config', tool.id, 'url', $event)" />
            </el-form-item>
            <el-form-item label="Method">
              <el-select :model-value="tool.config?.method || 'GET'" @update:model-value="$emit('update-tool-config', tool.id, 'method', $event)">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
              </el-select>
            </el-form-item>
            <el-button type="danger" @click="$emit('remove', tool.id)">删除工具</el-button>
          </template>
        </el-form>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  tools: any[]
  saving: boolean
}>()

defineEmits<{
  (event: 'add'): void
  (event: 'save'): void
  (event: 'remove', id: string): void
  (event: 'update-tool', value: any): void
  (event: 'update-tool-raw', id: string, key: string, value: string): void
  (event: 'update-tool-config', id: string, key: string, value: string): void
}>()
</script>

<style scoped>
.panel-card {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

.card-header,
.item-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-text {
  margin-top: 6px;
  color: #f56c6c;
  font-size: 12px;
}
</style>
