<template>
  <div class="tools-container">
    <h2>开放工具与插件管理</h2>
    
    <el-card class="box-card mb-4">
      <template #header>
        <div class="card-header">
          <span>内部系统工具 (Internal Tools)</span>
          <el-button type="success" size="small" @click="addHttpTool">添加 HTTP 工具</el-button>
        </div>
      </template>
      
      <el-collapse v-if="internalTools.length > 0" v-model="activeInternalToolNames">
        <el-collapse-item v-for="(tool, index) in internalTools" :key="tool.id" :name="tool.id">
          <template #title>
            <span style="font-weight: 500;">{{ tool.name }}</span>
            <el-tag :type="tool.type === 'system' ? 'primary' : 'warning'" size="small" style="margin-left: 10px;">
              {{ tool.type === 'system' ? '内置系统工具' : 'HTTP 工具' }}
            </el-tag>
            <el-switch v-model="tool.enabled" @change="saveInternalTools" style="margin-left: 15px;" />
          </template>
          
          <el-form label-width="120px">
            <el-form-item label="工具名称" v-if="tool.type === 'http'">
              <el-input v-model="tool.name" placeholder="例如：get_weather" @change="saveInternalTools" />
            </el-form-item>
            <el-form-item label="触发提示词">
              <el-input
                v-model="tool.description"
                type="textarea"
                :rows="2"
                placeholder="告诉大模型什么时候该调用这个工具"
                @change="saveInternalTools"
              />
            </el-form-item>
            <el-form-item label="入参定义 (JSON)" v-if="tool.type === 'http'">
              <el-input
                v-model="tool.parametersStr"
                type="textarea"
                :rows="4"
                placeholder='{"type":"object","properties":{"city":{"type":"string"}},"required":["city"]}'
                @change="syncInternalToolParams(tool)"
              />
            </el-form-item>
            
            <!-- HTTP Tool Specific Config -->
            <template v-if="tool.type === 'http'">
              <el-form-item label="请求 URL">
                <el-input v-model="tool.config.url" placeholder="https://api.example.com/data" @change="saveInternalTools" />
              </el-form-item>
              <el-form-item label="请求方法">
                <el-select v-model="tool.config.method" @change="saveInternalTools">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="danger" size="small" @click="removeInternalTool(index)">删除 HTTP 工具</el-button>
              </el-form-item>
            </template>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>MCP 外部服务 (Model Context Protocol)</span>
          <el-button type="success" size="small" @click="addMcpServer">添加服务</el-button>
        </div>
      </template>
      
      <el-collapse v-if="mcpServers.length > 0" v-model="activeServerNames">
        <el-collapse-item v-for="(server, index) in mcpServers" :key="server.id" :name="server.id">
          <template #title>
            <span style="font-weight: 500;">{{ server.name || '未命名服务' }}</span>
            <el-tag :type="server.status === 'connected' ? 'success' : 'info'" size="small" style="margin-left: 10px;">
              {{ server.status === 'connected' ? '已连接' : '未连接' }}
            </el-tag>
          </template>
          
          <el-form label-width="120px">
            <el-form-item label="服务名称">
              <el-input v-model="server.name" placeholder="例如：网页截图服务" @change="saveToolsConfig" />
            </el-form-item>
            <el-form-item label="执行命令">
              <el-input v-model="server.command" placeholder="例如：npx" @change="saveToolsConfig" />
            </el-form-item>
            <el-form-item label="参数 (换行分隔)">
              <el-input v-model="server.argsText" type="textarea" :rows="3" placeholder="-y&#10;@modelcontextprotocol/server-puppeteer" @change="syncArgs(server)" />
            </el-form-item>
            <el-form-item label="环境变量 (JSON)">
              <el-input v-model="server.envText" type="textarea" :rows="3" placeholder='{"GITHUB_TOKEN": "your-token"}' @change="syncEnv(server)" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="connectServer(server)" :loading="server.connecting">
                {{ server.status === 'connected' ? '重新连接' : '连接并获取工具' }}
              </el-button>
              <el-button type="danger" @click="removeMcpServer(index)">删除配置</el-button>
            </el-form-item>
          </el-form>

          <div v-if="server.tools && server.tools.length > 0" class="mt-4">
            <h4 style="margin-bottom: 10px;">已加载的工具列表：</h4>
            <el-table :data="server.tools" border size="small">
              <el-table-column prop="name" label="工具名称" width="150" />
              <el-table-column prop="description" label="功能描述" />
            </el-table>
          </div>
        </el-collapse-item>
      </el-collapse>
      <el-empty v-else description="暂未配置 MCP 服务，点击右上角添加" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getSettings, saveSettings, connectMcpServer, getMcpTools, disconnectMcpServer } from '../utils/bridge'
import { InternalToolManager } from '../utils/internalTools'
import type { InternalTool } from '../utils/internalTools'
import { ElMessage } from 'element-plus'

const internalTools = ref<(InternalTool & { parametersStr?: string })[]>([])
const activeInternalToolNames = ref<string[]>([])

const mcpServers = ref<any[]>([])
const activeServerNames = ref<string[]>([])

onMounted(async () => {
  try {
    // Load Internal Tools
    const tools = await InternalToolManager.getAllTools()
    internalTools.value = tools.map(t => ({
      ...t,
      parametersStr: t.type === 'http' ? JSON.stringify(t.parameters, null, 2) : ''
    }))
    activeInternalToolNames.value = tools.map(t => t.id)

    // Load MCP Servers
    const settings = await getSettings()
    if (settings.mcpServers) {
      mcpServers.value = settings.mcpServers.map((s: any) => ({
        ...s,
        argsText: s.args ? s.args.join('\n') : '',
        envText: s.env ? JSON.stringify(s.env, null, 2) : '',
        status: 'disconnected',
        connecting: false,
        tools: []
      }))
    }
  } catch (error) {
    console.error('Failed to load tools config', error)
  }
})

onUnmounted(async () => {})

// --- Internal Tools Logic ---
const saveInternalTools = async () => {
  try {
    const toolsToSave = internalTools.value.map(t => {
      const { parametersStr, ...rest } = t
      return rest
    })
    await InternalToolManager.saveTools(toolsToSave)
    ElMessage.success('内部工具配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const syncInternalToolParams = (tool: any) => {
  try {
    tool.parameters = JSON.parse(tool.parametersStr)
    saveInternalTools()
  } catch (e) {
    // Ignore invalid JSON while typing
  }
}

const addHttpTool = () => {
  const newId = 'http_' + Date.now()
  internalTools.value.push({
    id: newId,
    name: 'custom_http_tool',
    description: '这是一个自定义HTTP工具',
    parameters: { type: 'object', properties: {}, required: [] },
    parametersStr: '{"type":"object","properties":{},"required":[]}',
    type: 'http',
    enabled: true,
    config: { url: '', method: 'GET' }
  })
  activeInternalToolNames.value.push(newId)
  saveInternalTools()
}

const removeInternalTool = (index: number) => {
  internalTools.value.splice(index, 1)
  saveInternalTools()
}

// --- MCP Servers Logic ---
const saveToolsConfig = async () => {
  try {
    const settings = await getSettings()
    settings.mcpServers = mcpServers.value.map(s => ({
      id: s.id,
      name: s.name,
      command: s.command,
      args: s.args,
      env: s.env
    }))
    await saveSettings(settings)
    ElMessage.success('MCP 配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const syncArgs = (server: any) => {
  server.args = server.argsText.split('\n').map((s: string) => s.trim()).filter((s: string) => s)
  saveToolsConfig()
}

const syncEnv = (server: any) => {
  try {
    server.env = server.envText ? JSON.parse(server.envText) : undefined
    saveToolsConfig()
  } catch (e) {
    // ignore
  }
}

const addMcpServer = () => {
  const newId = 'mcp_' + Date.now()
  mcpServers.value.push({
    id: newId,
    name: '新建 MCP 服务',
    command: '',
    args: [],
    argsText: '',
    env: undefined,
    envText: '',
    status: 'disconnected',
    connecting: false,
    tools: []
  })
  activeServerNames.value.push(newId)
  saveToolsConfig()
}

const removeMcpServer = async (index: number) => {
  const server = mcpServers.value[index]
  try {
    await disconnectMcpServer(server.id)
  } catch(e) {}
  mcpServers.value.splice(index, 1)
  saveToolsConfig()
}

const connectServer = async (server: any) => {
  if (!server.command) return ElMessage.warning('请输入执行命令')
  server.connecting = true
  try {
    const connected = await connectMcpServer(server.id, server.command, server.args || [], server.env)
    if (connected) {
      server.status = 'connected'
      server.tools = await getMcpTools(server.id)
      ElMessage.success(`[${server.name}] 连接成功，加载了 ${server.tools.length} 个工具`)
    }
  } catch (error: any) {
    server.status = 'disconnected'
    ElMessage.error(`[${server.name}] 连接失败: ` + error.message)
  } finally {
    server.connecting = false
  }
}
</script>

<style scoped>
.tools-container {
  max-width: 900px;
  margin: 0 auto;
}
.mb-4 {
  margin-bottom: 16px;
}
.mt-4 {
  margin-top: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
