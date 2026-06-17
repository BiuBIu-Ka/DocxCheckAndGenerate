<template>
  <div class="tools-container">
    <h2>开放工具与插件管理</h2>
    
    <el-card class="box-card mb-4">
      <template #header>
        <div class="card-header">
          <span>内置工具配置</span>
        </div>
      </template>
      <el-form label-position="top">
        <el-form-item label="知识库检索工具 (search_knowledge_base) 提示词">
          <el-input
            v-model="builtinKbDescription"
            type="textarea"
            :rows="3"
            placeholder="告诉大模型什么时候该调用知识库检索工具。默认：'用于从本地知识库中根据关键字搜索相关的文本片段。'"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveToolsConfig">保存内置配置</el-button>
        </el-form-item>
      </el-form>
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
          
          <el-form label-width="100px">
            <el-form-item label="服务名称">
              <el-input v-model="server.name" placeholder="例如：网页截图服务" @change="saveToolsConfig" />
            </el-form-item>
            <el-form-item label="执行命令">
              <el-input v-model="server.command" placeholder="例如：npx" @change="saveToolsConfig" />
            </el-form-item>
            <el-form-item label="参数 (换行分隔)">
              <el-input v-model="server.argsText" type="textarea" :rows="3" placeholder="-y&#10;@modelcontextprotocol/server-puppeteer" @change="syncArgs(server)" />
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
import { ElMessage } from 'element-plus'

const builtinKbDescription = ref('用于从本地知识库中根据关键字搜索相关的文本片段。当你不确定具体的系统模块或功能细节时，必须首先调用此工具。')
const mcpServers = ref<any[]>([])
const activeServerNames = ref<string[]>([])

onMounted(async () => {
  try {
    const settings = await getSettings()
    if (settings.builtinKbDescription) {
      builtinKbDescription.value = settings.builtinKbDescription
    }
    if (settings.mcpServers) {
      mcpServers.value = settings.mcpServers.map((s: any) => ({
        ...s,
        argsText: s.args ? s.args.join('\n') : '',
        status: 'disconnected',
        connecting: false,
        tools: []
      }))
    }
  } catch (error) {
    console.error('Failed to load tools config', error)
  }
})

onUnmounted(async () => {
  // Disconnect all on leave? Maybe not, keep them running in backend.
  // We'll leave them running so Generation.vue can use them.
})

const saveToolsConfig = async () => {
  try {
    const settings = await getSettings()
    settings.builtinKbDescription = builtinKbDescription.value
    settings.mcpServers = mcpServers.value.map(s => ({
      id: s.id,
      name: s.name,
      command: s.command,
      args: s.args
    }))
    await saveSettings(settings)
    ElMessage.success('配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const syncArgs = (server: any) => {
  server.args = server.argsText.split('\n').map((s: string) => s.trim()).filter((s: string) => s)
  saveToolsConfig()
}

const addMcpServer = () => {
  const newId = 'mcp_' + Date.now()
  mcpServers.value.push({
    id: newId,
    name: '新建 MCP 服务',
    command: '',
    args: [],
    argsText: '',
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
    const connected = await connectMcpServer(server.id, server.command, server.args || [])
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
