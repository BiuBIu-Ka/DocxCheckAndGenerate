<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>MCP 服务</span>
        <el-space>
          <el-button @click="$emit('add')">新增服务</el-button>
          <el-button type="primary" :loading="saving" @click="$emit('save')">保存 MCP 配置</el-button>
        </el-space>
      </div>
    </template>

    <el-empty v-if="servers.length === 0" description="暂无 MCP 服务" />
    <el-collapse v-else>
      <el-collapse-item v-for="server in servers" :key="server.id" :name="server.id">
        <template #title>
          <div class="item-title">
            <span>{{ server.name || '未命名服务' }}</span>
            <el-tag size="small" :type="server.status === 'connected' ? 'success' : 'info'">
              {{ server.status === 'connected' ? '已连接' : '未连接' }}
            </el-tag>
          </div>
        </template>

        <el-form label-position="top">
          <el-form-item label="服务名称">
            <el-input :model-value="server.name" @update:model-value="$emit('update-server', { ...server, name: $event })" />
          </el-form-item>
          <el-form-item label="命令">
            <el-input :model-value="server.command" @update:model-value="$emit('update-server', { ...server, command: $event })" />
          </el-form-item>
          <el-form-item label="参数">
            <el-input :model-value="server.argsText" type="textarea" :rows="3" @update:model-value="$emit('update-server-raw', server.id, 'argsText', $event)" />
          </el-form-item>
          <el-form-item label="环境变量 JSON">
            <el-input :model-value="server.envText" type="textarea" :rows="3" @update:model-value="$emit('update-server-raw', server.id, 'envText', $event)" />
            <div class="error-text" v-if="server.envError">{{ server.envError }}</div>
          </el-form-item>

          <el-space wrap>
            <el-button type="primary" :loading="server.connecting" @click="$emit('connect', server.id)">连接并加载工具</el-button>
            <el-button type="danger" @click="$emit('remove', server.id)">删除服务</el-button>
          </el-space>

          <McpToolList :tools="server.tools || []" />
        </el-form>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script setup lang="ts">
import McpToolList from './McpToolList.vue'

defineProps<{
  servers: any[]
  saving: boolean
}>()

defineEmits<{
  (event: 'add'): void
  (event: 'save'): void
  (event: 'remove', id: string): void
  (event: 'connect', id: string): void
  (event: 'update-server', value: any): void
  (event: 'update-server-raw', id: string, key: string, value: string): void
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
