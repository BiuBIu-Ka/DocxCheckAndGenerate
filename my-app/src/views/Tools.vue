<template>
  <div class="page-shell">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Tools</div>
        <h2>工具与 MCP</h2>
        <p>统一维护内部工具、HTTP 工具和 MCP 服务，同时查看最近运行中的工具使用情况。</p>
      </div>
    </div>

    <div class="summary-grid">
      <ToolCallPreviewCard
        title="内部工具"
        :summary="`${internalTools.length} 个工具，其中 ${internalTools.filter(item => item.enabled).length} 个已启用`"
      />
      <ToolCallPreviewCard
        title="MCP 服务"
        :summary="`${mcpServers.length} 个服务，${mcpServers.filter(item => item.status === 'connected').length} 个已连接`"
      />
      <ToolCallPreviewCard
        title="最近调用"
        :summary="recentToolSummary"
      />
    </div>

    <el-tabs>
      <el-tab-pane label="内部工具">
        <InternalToolsPanel
          :tools="internalTools"
          :saving="savingInternalTools"
          @add="addInternalTool"
          @save="saveInternalTools"
          @remove="removeInternalTool"
          @update-tool="updateInternalTool"
          @update-tool-raw="updateInternalToolRaw"
          @update-tool-config="updateInternalToolConfig"
        />
      </el-tab-pane>

      <el-tab-pane label="MCP 服务">
        <McpServersPanel
          :servers="mcpServers"
          :saving="savingMcpServers"
          @add="addMcpServer"
          @save="saveMcpServers"
          @remove="removeMcpServer"
          @connect="connectServer"
          @update-server="updateServer"
          @update-server-raw="updateServerRaw"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import InternalToolsPanel from '../components/tools/InternalToolsPanel.vue'
import McpServersPanel from '../components/tools/McpServersPanel.vue'
import ToolCallPreviewCard from '../components/tools/ToolCallPreviewCard.vue'
import { connectMcpServer, disconnectMcpServer, getMcpTools } from '../utils/bridge'
import { listInternalTools, listMcpServers, saveInternalTools as persistInternalTools, saveMcpServers as persistMcpServers, summarizeToolUsage, validateJsonInput } from '../services/toolService'
import { useGenerationWorkbenchStore } from '../stores/generationWorkbench'
import { useAppConfigStore } from '../stores/appConfig'

const workbench = useGenerationWorkbenchStore()
const appConfig = useAppConfigStore()
const internalTools = ref<any[]>([])
const mcpServers = ref<any[]>([])
const savingInternalTools = ref(false)
const savingMcpServers = ref(false)

const recentToolSummary = computed(() => {
  const toolName = internalTools.value[0]?.name
  if (!toolName) return '暂无可统计的工具调用'
  return summarizeToolUsage(toolName, workbench.recentRuns)
})

function normalizeInternalTool(tool: any) {
  return {
    ...tool,
    parametersText: tool.type === 'http' ? JSON.stringify(tool.parameters, null, 2) : '',
    parametersError: '',
  }
}

function normalizeMcpServer(server: any) {
  return {
    ...server,
    argsText: Array.isArray(server.args) ? server.args.join('\n') : '',
    envText: server.env ? JSON.stringify(server.env, null, 2) : '',
    envError: '',
    status: server.status || 'disconnected',
    connecting: false,
    tools: server.tools || [],
  }
}

async function refreshTools() {
  internalTools.value = (await listInternalTools()).map(normalizeInternalTool)
  mcpServers.value = (await listMcpServers()).map(normalizeMcpServer)
  await workbench.loadRecentRuns()
}

function updateInternalTool(nextTool: any) {
  internalTools.value = internalTools.value.map((item) => item.id === nextTool.id ? nextTool : item)
}

function updateInternalToolRaw(id: string, key: string, value: string) {
  internalTools.value = internalTools.value.map((item) => {
    if (item.id !== id) return item
    const parsed = validateJsonInput(value)
    return {
      ...item,
      [key]: value,
      parameters: parsed.ok ? (parsed.value || item.parameters) : item.parameters,
      parametersError: parsed.ok ? '' : parsed.message,
    }
  })
}

function updateInternalToolConfig(id: string, key: string, value: string) {
  internalTools.value = internalTools.value.map((item) =>
    item.id === id
      ? {
          ...item,
          config: {
            ...(item.config || {}),
            [key]: value,
          },
        }
      : item,
  )
}

function addInternalTool() {
  internalTools.value.push(normalizeInternalTool({
    id: `http_${Date.now()}`,
    name: 'custom_http_tool',
    description: '这是一个自定义 HTTP 工具',
    parameters: { type: 'object', properties: {}, required: [] },
    type: 'http',
    enabled: true,
    config: { url: '', method: 'GET' },
  }))
}

function removeInternalTool(id: string) {
  internalTools.value = internalTools.value.filter((item) => item.id !== id)
}

async function saveInternalTools() {
  savingInternalTools.value = true
  try {
    const invalid = internalTools.value.find((item) => item.parametersError)
    if (invalid) {
      throw new Error(`工具 ${invalid.name} 的参数 JSON 不合法`)
    }
    const payload = internalTools.value.map(({ parametersText, parametersError, ...rest }) => rest)
    internalTools.value = (await persistInternalTools(payload)).map(normalizeInternalTool)
    await appConfig.load()
    ElMessage.success('内部工具已保存')
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    savingInternalTools.value = false
  }
}

function updateServer(nextServer: any) {
  mcpServers.value = mcpServers.value.map((item) => item.id === nextServer.id ? nextServer : item)
}

function updateServerRaw(id: string, key: string, value: string) {
  mcpServers.value = mcpServers.value.map((item) => {
    if (item.id !== id) return item
    if (key === 'argsText') {
      return {
        ...item,
        argsText: value,
        args: value.split('\n').map((part: string) => part.trim()).filter(Boolean),
      }
    }
    const parsed = validateJsonInput(value)
    return {
      ...item,
      envText: value,
      env: parsed.ok ? parsed.value : item.env,
      envError: parsed.ok ? '' : parsed.message,
    }
  })
}

function addMcpServer() {
  mcpServers.value.push(normalizeMcpServer({
    id: `mcp_${Date.now()}`,
    name: '新建 MCP 服务',
    command: '',
    args: [],
    env: undefined,
  }))
}

async function saveMcpServers() {
  savingMcpServers.value = true
  try {
    const invalid = mcpServers.value.find((item) => item.envError)
    if (invalid) {
      throw new Error(`服务 ${invalid.name} 的环境变量 JSON 不合法`)
    }
    const payload = mcpServers.value.map(({ argsText, envText, envError, connecting, tools, ...rest }) => rest)
    mcpServers.value = (await persistMcpServers(payload)).map(normalizeMcpServer)
    await appConfig.load()
    ElMessage.success('MCP 配置已保存')
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    savingMcpServers.value = false
  }
}

async function removeMcpServer(id: string) {
  try {
    await disconnectMcpServer(id)
  } catch {
    // ignore
  }
  mcpServers.value = mcpServers.value.filter((item) => item.id !== id)
}

async function connectServer(id: string) {
  const server = mcpServers.value.find((item) => item.id === id)
  if (!server) return
  if (!server.command) {
    return ElMessage.warning('请输入执行命令')
  }

  server.connecting = true
  try {
    const connected = await connectMcpServer(server.id, server.command, server.args || [], server.env)
    if (!connected) {
      throw new Error('当前环境不支持连接 MCP 服务')
    }
    server.tools = await getMcpTools(server.id)
    server.status = 'connected'
    server.envError = ''
    ElMessage.success(`[${server.name}] 已连接并加载 ${server.tools.length} 个工具`)
  } catch (error: any) {
    server.status = 'disconnected'
    server.lastError = error.message
    ElMessage.error(`[${server.name}] 连接失败: ${error.message}`)
  } finally {
    server.connecting = false
  }
}

onMounted(async () => {
  await refreshTools()
})
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-eyebrow,
.page-header p {
  color: var(--text-secondary);
  margin: 0;
}

.page-header h2 {
  margin: 6px 0;
  color: var(--text-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
