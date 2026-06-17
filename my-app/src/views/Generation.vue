<template>
  <div class="generation-container">
    <h2>文档生成</h2>
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>输入内容</span>
            </div>
          </template>
          <el-form label-position="top">
            <el-form-item label="引用知识库 (可选)">
              <el-select v-model="selectedKbId" placeholder="请选择要作为核心参考资料的知识库" clearable style="width: 100%;">
                <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="全局系统背景 (提升内容相关度)">
              <el-input
                v-model="globalContext"
                type="textarea"
                :rows="3"
                placeholder="请输入当前文档所属系统的全局介绍、项目背景、总体目标等。这能帮助 AI 将局部功能点与全局业务结合起来。"
              />
            </el-form-item>
            <el-form-item label="补充参考资料 (手动输入)">
                <el-input
                  v-model="referenceMaterials"
                  type="textarea"
                  :rows="10"
                  placeholder="请输入用于生成文档的补充参考资料。如果已选择知识库，此内容将与知识库合并发送给 AI。"
                />
              </el-form-item>
            <el-form-item label="注意事项">
              <el-input
                v-model="notes"
                type="textarea"
                :rows="4"
                placeholder="本次生成的特殊要求，例如：侧重于技术细节，或者精简字数..."
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" @click="generateDoc" :loading="generating" style="width: 100%;">
                <el-icon class="mr-1"><Document /></el-icon> 开始生成文档
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="box-card mb-4">
          <template #header>
            <div class="card-header">
              <span>当前状态</span>
            </div>
          </template>
          <div class="status-item">
            <span class="label">API 配置：</span>
            <el-tag :type="hasApiConfig ? 'success' : 'danger'">{{ hasApiConfig ? '已配置' : '未配置' }}</el-tag>
          </div>
          <div class="status-item">
            <span class="label">模板文件：</span>
            <el-tag :type="hasTemplate ? 'success' : 'danger'">{{ hasTemplate ? '已选择' : '未选择' }}</el-tag>
          </div>
          <div class="status-item">
            <span class="label">模板变量：</span>
            <span class="value" v-if="templateVariables.length > 0">{{ templateVariables.join(', ') }}</span>
            <span class="value text-gray" v-else>无</span>
          </div>
        </el-card>

        <el-card class="box-card" v-if="generating">
          <template #header>
            <div class="card-header">
              <span>生成进度</span>
            </div>
          </template>
          <el-steps :active="currentStep" direction="vertical">
            <el-step title="准备数据" description="收集参考资料与规则" />
            <el-step title="AI 思考中" description="请求大模型生成结构化内容" />
            <el-step title="渲染文档" description="将内容注入 DOCX 模板" />
            <el-step title="完成" description="导出文件" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import OpenAI from 'openai'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { getSettings, getTemplateBuffer, saveGeneratedDocument, connectMcpServer, getMcpTools, callMcpTool } from '../utils/bridge'

const globalContext = ref('')
const referenceMaterials = ref('')
const notes = ref('')
const generating = ref(false)
const currentStep = ref(0)

const hasApiConfig = ref(false)
const hasTemplate = ref(false)
const templateVariables = ref<{name: string, description: string}[]>([])
const knowledgeBases = ref<any[]>([])
const selectedKbId = ref('')
let appSettings: any = null

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    appSettings = await getSettings()
    if (appSettings) {
      hasApiConfig.value = !!(appSettings.apiUrl && appSettings.apiKey && appSettings.modelName)
      hasTemplate.value = !!appSettings.templatePath
      templateVariables.value = (appSettings.templateVariables || []).map((v: any) => typeof v === 'string' ? { name: v, description: '' } : v)
      knowledgeBases.value = appSettings.knowledgeBases || []
    }
  } catch (error) {
    console.error('Failed to load settings', error)
  }
}

function localKbSearch(content: string, query: string) {
  if (!content) return "知识库为空"
  const chunks = content.split('\n\n').filter(c => c.trim().length > 0)
  const keywords = query.split(/\s+/).filter(k => k.trim())
  if (keywords.length === 0) return "请输入搜索关键字"
  
  const scored = chunks.map(chunk => {
    let score = 0
    for (const kw of keywords) {
      if (chunk.toLowerCase().includes(kw.toLowerCase())) score++
    }
    return { chunk, score }
  })
  
  scored.sort((a, b) => b.score - a.score)
  const best = scored.filter(s => s.score > 0).slice(0, 5).map(s => s.chunk)
  if (best.length === 0) return "未在知识库中找到相关内容"
  return best.join('\n\n---\n\n')
}

const generateDoc = async () => {
  await loadSettings()
  if (!hasApiConfig.value) {
    return ElMessage.warning('请先在"模型配置"页面配置 AI API')
  }
  if (!hasTemplate.value) {
    return ElMessage.warning('请先在"模板与规则"页面配置 DOCX 模板')
  }
  if (!selectedKbId.value && !referenceMaterials.value.trim()) {
    return ElMessage.warning('请选择知识库或手动输入补充参考资料')
  }

  generating.value = true
  currentStep.value = 0

  try {
    // Step 1: Prepare data
    currentStep.value = 1

    // Build JSON Schema hint based on docxtemplater tags
    const loops = templateVariables.value.filter(t => t.name.startsWith('#')).map(t => t.name.substring(1))
    const simpleVars = templateVariables.value.filter(t => !t.name.startsWith('#') && !t.name.startsWith('/'))

    let schemaHint = "请严格按照以下 JSON 格式输出数据：\n{\n"
    simpleVars.forEach(v => {
      schemaHint += `  "${v.name}": "【请参考下方的说明进行填写】",\n`
    })
    loops.forEach(l => {
      schemaHint += `  "${l}": [\n    {\n      // 数组项的字段请根据参考资料和变量含义推断并填充\n    }\n  ],\n`
    })
    schemaHint += "}"

    const varDefinitions = templateVariables.value
      .map(v => `- 【${v.name}】: ${v.description || '无具体说明，请根据上下文推断'}`)
      .join('\n')

    const selectedKb = knowledgeBases.value.find(k => k.id === selectedKbId.value)
    const kbContent = selectedKb ? selectedKb.content : ''

    const prompt = `
你是一个专业的文档生成助手。你需要根据【全局系统背景】、【补充参考资料】和【整体规则】，生成一段符合【数据结构要求】的纯 JSON 格式数据。
请不要输出任何 markdown 标记（如 \`\`\`json ），仅输出合法的 JSON 字符串本身！

【🚨 核心指令（非常重要）】：
你目前还没有获得知识库的全部内容。请务必使用工具（如 search_knowledge_base）去多次搜索和探索！
1. 先搜索总体的模块列表。
2. 然后针对每个模块，搜索其包含的详细功能点。
3. 如果还有 MCP 外部工具，也可以视需要调用。
4. 请【全面、详尽】地提取所有功能点，绝对不要只提取一个或进行简单摘要。
只有当你认为已经收集齐所有信息时，才输出最终的 JSON 字符串。

【数据结构要求（即模板中的变量，请根据这些变量名生成对应的键值对）】：
如果变量名有 "#" 前缀，表示这是一个数组（例如列表或多个功能点）。
${schemaHint}

【变量含义与示例说明（非常重要，请严格遵守）】：
${varDefinitions}

【全局系统背景】：
${globalContext.value || '无'}

【整体规则】：
${appSettings.standardText || '无'}

【本次注意事项】：
${notes.value || '无'}

【补充参考资料（用户手动输入）】：
${referenceMaterials.value || '无'}
`

    // Step 2: Request AI (Agent Loop)
    currentStep.value = 2
    
    // 准备工具列表
    const openAiTools: any[] = []
    if (kbContent) {
      openAiTools.push({
        type: "function",
        function: {
          name: "search_knowledge_base",
          description: appSettings.builtinKbDescription || "用于从本地知识库中根据关键字搜索相关的文本片段。当你需要获取系统功能细节时，必须调用此工具。",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "搜索关键字，如'通用管理系统包含哪些功能'" }
            },
            required: ["query"]
          }
        }
      })
    }

    const activeMcpTools: any[] = []
    if (appSettings.mcpServers) {
      for (const server of appSettings.mcpServers) {
        try {
          await connectMcpServer(server.id, server.command, server.args)
          const tools = await getMcpTools(server.id)
          for (const tool of tools) {
            activeMcpTools.push({ serverId: server.id, tool })
            openAiTools.push({
              type: "function",
              function: {
                name: tool.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64),
                description: tool.description,
                parameters: tool.inputSchema
              }
            })
          }
        } catch (e) {
          console.warn('Failed to setup MCP server', server.name)
        }
      }
    }

    const openai = new OpenAI({
      baseURL: appSettings.apiUrl,
      apiKey: appSettings.apiKey,
      dangerouslyAllowBrowser: true // Web 端兼容必须开启
    })

    let messages: any[] = [{ role: "user", content: prompt }]
    let jsonStr = ''
    let loopCount = 0

    while (loopCount < 20) {
      loopCount++
      const reqPayload: any = {
        messages,
        model: appSettings.modelName,
        temperature: 0.7,
      }
      if (openAiTools.length > 0) {
        reqPayload.tools = openAiTools
      }

      const completion = await openai.chat.completions.create(reqPayload)
      const msg = completion.choices[0].message
      messages.push(msg)

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const toolCall of msg.tool_calls as any[]) {
          let toolResult = ""
          if (toolCall.function.name === 'search_knowledge_base') {
            const args = JSON.parse(toolCall.function.arguments)
            toolResult = localKbSearch(kbContent, args.query)
          } else {
            // Find MCP server
            const mcpItem = activeMcpTools.find(t => t.tool.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64) === toolCall.function.name)
            if (mcpItem) {
               try {
                   const res = await callMcpTool(mcpItem.serverId, mcpItem.tool.name, JSON.parse(toolCall.function.arguments))
                   toolResult = JSON.stringify(res)
               } catch(e: any) { toolResult = "Error: " + e.message }
            } else {
               toolResult = "Tool not found"
            }
          }
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: toolResult
          })
        }
      } else {
        jsonStr = msg.content || '{}'
        break
      }
    }
    // Clean up potential markdown formatting
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim()
    
    let aiData: any
    try {
      aiData = JSON.parse(jsonStr)
    } catch (err) {
      console.error('AI output is not valid JSON:', jsonStr)
      throw new Error('AI 未能生成合法的 JSON 数据')
    }

    // Step 3: Render Document
    currentStep.value = 3
    const buffer = await getTemplateBuffer(appSettings.templatePath)
    if (!buffer) {
      throw new Error('无法读取模板文件内容，请重新上传模板')
    }
    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    doc.render(aiData)

    const outZip = doc.getZip().generate({
      type: 'uint8array',
      compression: 'DEFLATE',
    })

    // Step 4: Save Document
    currentStep.value = 4
    const success = await saveGeneratedDocument(outZip, 'generated_document.docx')

    if (success) {
      ElMessage.success('文档生成并保存成功！')
    } else {
      ElMessage.info('取消保存或保存失败')
    }

  } catch (error: any) {
    console.error(error)
    ElMessage.error('生成出错: ' + error.message)
  } finally {
    generating.value = false
    currentStep.value = 0
  }
}
</script>

<style scoped>
.generation-container {
  max-width: 1000px;
  margin: 0 auto;
}
h2 {
  margin-bottom: 20px;
}
.mr-1 {
  margin-right: 4px;
}
.mb-4 {
  margin-bottom: 16px;
}
.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.status-item:last-child {
  margin-bottom: 0;
}
.label {
  width: 90px;
  color: #606266;
}
.value {
  font-weight: 500;
}
.text-gray {
  color: #909399;
}
</style>
