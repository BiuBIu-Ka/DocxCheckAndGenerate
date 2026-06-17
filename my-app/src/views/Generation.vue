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
            <el-form-item label="引用知识库 (可选，可多选)">
              <el-select v-model="selectedKbIds" multiple placeholder="请选择要作为核心参考资料的知识库" clearable style="width: 100%;">
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
            <span class="label">当前模板：</span>
            <el-tag :type="hasTemplate ? 'success' : 'danger'">{{ hasTemplate ? currentTemplateName : '未选择' }}</el-tag>
          </div>
          <div class="status-item">
            <span class="label">模板变量：</span>
            <span class="value" v-if="templateVariables.length > 0">{{ templateVariables.map(v => v.name).join(', ') }}</span>
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
            <el-step title="AI Agent 思考与采集中" description="正在分批搜索并生成结构化数据..." />
            <el-step title="渲染文档" description="将数据注入 DOCX 模板" />
            <el-step title="完成" description="导出文件" />
          </el-steps>
          
          <div v-if="currentStep === 2" style="margin-top: 20px;">
            <div style="font-size: 13px; color: #666; margin-bottom: 8px;">增量生成状态：</div>
            <div style="background: #f5f7fa; padding: 10px; font-size: 12px; border-radius: 4px; margin-bottom: 8px; white-space: pre-wrap;">{{ documentSummary }}</div>
            <div style="font-size: 12px; color: #909399; margin-bottom: 6px;">累计提交次数：{{ submitCount }}</div>
            <pre style="background: #f5f7fa; padding: 10px; font-size: 12px; border-radius: 4px; max-height: 180px; overflow: auto; margin: 0;">{{ generationLogs.join('\n') }}</pre>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import OpenAI from 'openai'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { getSettings, getTemplateBuffer, saveGeneratedDocument, connectMcpServer, getMcpTools, callMcpTool } from '../utils/bridge'
import { InternalToolManager } from '../utils/internalTools'

const route = useRoute()

const globalContext = ref('')
const referenceMaterials = ref('')
const notes = ref('')
const generating = ref(false)
const currentStep = ref(0)
const documentSummary = ref('尚未开始')
const generationLogs = ref<string[]>([])
const submitCount = ref(0)

const hasApiConfig = ref(false)
const hasTemplate = ref(false)
const currentTemplateName = ref('')
const currentTemplatePath = ref('')
const currentStandardText = ref('')
const templateVariables = ref<{name: string, description: string}[]>([])
const knowledgeBases = ref<any[]>([])
const selectedKbIds = ref<string[]>([])
let appSettings: any = null
let rawDocumentData: Record<string, any> = {}

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  try {
    appSettings = await getSettings()
    if (appSettings) {
      hasApiConfig.value = !!(appSettings.apiUrl && appSettings.apiKey && appSettings.modelName)
      knowledgeBases.value = appSettings.knowledgeBases || []
      
      const templateId = route.query.templateId as string
      if (templateId && appSettings.templates) {
        const tpl = appSettings.templates.find((t: any) => t.id === templateId)
        if (tpl) {
          hasTemplate.value = true
          currentTemplateName.value = tpl.name
          currentTemplatePath.value = tpl.path
          currentStandardText.value = tpl.standardText || ''
          templateVariables.value = tpl.variables || []
        }
      } else {
        // Fallback for old data or no template passed
        if (appSettings.templatePath) {
           hasTemplate.value = true
           currentTemplatePath.value = appSettings.templatePath
           currentTemplateName.value = appSettings.templateName || '默认模板'
           currentStandardText.value = appSettings.standardText || ''
           templateVariables.value = (appSettings.templateVariables || []).map((v: any) => typeof v === 'string' ? { name: v, description: '' } : v)
        }
      }
    }
  } catch (error) {
    console.error('Failed to load settings', error)
  }
}

function appendGenerationLog(message: string) {
  generationLogs.value = [...generationLogs.value.slice(-11), message]
}

function yieldToUi() {
  return new Promise(resolve => setTimeout(resolve, 10))
}

function summarizeDocumentData(data: Record<string, any>) {
  const parts: string[] = []
  const keys = Object.keys(data)
  parts.push(`顶层字段数: ${keys.length}`)

  for (const key of keys.slice(0, 12)) {
    const value = data[key]
    if (Array.isArray(value)) {
      parts.push(`${key}: 数组(${value.length})`)
    } else if (value && typeof value === 'object') {
      parts.push(`${key}: 对象(${Object.keys(value).length})`)
    } else if (typeof value === 'string') {
      parts.push(`${key}: 文本(${value.length}字)`)
    } else {
      parts.push(`${key}: ${typeof value}`)
    }
  }

  if (keys.length > 12) {
    parts.push(`其余字段: ${keys.length - 12}`)
  }

  return parts.join('\n')
}

function trimMessageContent(content: string, maxLength = 4000) {
  if (!content) return content
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength)}\n...[truncated ${content.length - maxLength} chars]`
}

function compactMessages(messages: any[]) {
  // 保持消息完整性，只对内容过长的消息进行截断，而不删除任何消息，以防止破坏 tool_calls 协议
  return messages.map((msg) => {
    // assistant 消息如果包含 tool_calls，其 content 通常为 null 或很短，不建议截断
    if (msg.role === 'assistant' && msg.tool_calls) {
      return msg
    }
    if (typeof msg?.content === 'string' && msg.content.length > 2000) {
      return { ...msg, content: trimMessageContent(msg.content, 2000) }
    }
    return msg
  })
}

const MAX_ARRAY_ITEMS = 300
const ARRAY_PUSH_CHUNK_SIZE = 200
const MAX_STRING_LENGTH = 8000
const MAX_TOTAL_STRING_CHARS = 120000
const MAX_RENDER_NODES = 2000

function stableStringify(value: any): string {
  if (value === null || value === undefined) return String(value)
  if (typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
}

function getArrayItemKey(item: any, index: number) {
  if (item === null || item === undefined) return `null:${index}`
  if (typeof item === 'string') return `str:${item.slice(0, 200)}`
  if (typeof item !== 'object') return `primitive:${String(item)}`

  const preferredKeys = ['id', 'key', 'name', 'title', 'code', '编号', '标识', '名称']
  for (const key of preferredKeys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) {
      return `${key}:${value.trim()}`
    }
  }
  return `obj:${stableStringify(item).slice(0, 500)}`
}

function safeAppendArray(target: any[], source: any[], path = 'root') {
  if (!Array.isArray(target) || !Array.isArray(source)) return target
  if (target === source) {
    throw new Error(`检测到数组自引用追加: ${path}`)
  }

  if (source.length === 0) return target

  const remaining = Math.max(0, MAX_ARRAY_ITEMS - target.length)
  if (remaining === 0) {
    return target
  }

  const existingKeys = new Set(target.map((item, index) => getArrayItemKey(item, index)))
  const dedupedSource = source.filter((item, index) => {
    const key = getArrayItemKey(item, index)
    if (existingKeys.has(key)) return false
    existingKeys.add(key)
    return true
  })

  const toAppend = dedupedSource.slice(0, remaining)
  for (let i = 0; i < toAppend.length; i += ARRAY_PUSH_CHUNK_SIZE) {
    const chunk = toAppend.slice(i, i + ARRAY_PUSH_CHUNK_SIZE)
    target.push(...chunk)
  }
  return target
}

function sanitizeForDocx(value: any, path = 'root'): any {
  if (value === null || value === undefined) return ''

  if (typeof value === 'string') {
    const normalized = value.replace(/\n{4,}/g, '\n\n\n').trim()
    if (normalized.length <= MAX_STRING_LENGTH) return normalized
    return `${normalized.slice(0, MAX_STRING_LENGTH)}\n...[内容过长已截断]`
  }

  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    const sanitizedItems: any[] = []
    const seen = new Set<string>()
    for (let i = 0; i < value.length && sanitizedItems.length < MAX_ARRAY_ITEMS; i++) {
      const item = sanitizeForDocx(value[i], `${path}[${i}]`)
      const key = getArrayItemKey(item, i)
      if (seen.has(key)) continue
      seen.add(key)
      sanitizedItems.push(item)
    }
    return sanitizedItems
  }

  const result: Record<string, any> = {}
  for (const [key, child] of Object.entries(value)) {
    const sanitizedChild = sanitizeForDocx(child, `${path}.${key}`)
    const isEmptyObject = sanitizedChild && typeof sanitizedChild === 'object' && !Array.isArray(sanitizedChild) && Object.keys(sanitizedChild).length === 0
    const isEmptyArray = Array.isArray(sanitizedChild) && sanitizedChild.length === 0
    if (sanitizedChild === '' || sanitizedChild === null || sanitizedChild === undefined || isEmptyObject || isEmptyArray) {
      continue
    }
    result[key] = sanitizedChild
  }
  return result
}

function inspectRenderData(value: any) {
  const stats = {
    totalStringChars: 0,
    maxStringLength: 0,
    totalArrayItems: 0,
    totalNodes: 0,
  }

  const walk = (node: any) => {
    stats.totalNodes += 1
    if (node === null || node === undefined) return
    if (typeof node === 'string') {
      stats.totalStringChars += node.length
      stats.maxStringLength = Math.max(stats.maxStringLength, node.length)
      return
    }
    if (typeof node !== 'object') return
    if (Array.isArray(node)) {
      stats.totalArrayItems += node.length
      node.forEach(walk)
      return
    }
    Object.values(node).forEach(walk)
  }

  walk(value)
  return stats
}

// 深合并函数：将 partialData 合并进 rawDocumentData 中。如果遇到数组，则将新项追加到原数组中。
function mergePartialData(target: any, source: any, path = 'root') {
  if (typeof target !== 'object' || target === null) return source
  if (typeof source !== 'object' || source === null) return source

  if (Array.isArray(target) && Array.isArray(source)) {
    return safeAppendArray(target, source, path)
  }

  if (Array.isArray(target) !== Array.isArray(source)) {
    return source
  }

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue

    const sourceVal = source[key]
    const targetVal = target[key]
    const nextPath = `${path}.${key}`

    if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
      safeAppendArray(targetVal, sourceVal, nextPath)
    } else if (
      typeof targetVal === 'object' && targetVal !== null && !Array.isArray(targetVal) &&
      typeof sourceVal === 'object' && sourceVal !== null && !Array.isArray(sourceVal)
    ) {
      target[key] = mergePartialData(targetVal, sourceVal, nextPath)
    } else {
      target[key] = sourceVal
    }
  }
  return target
}

const generateDoc = async () => {
  await loadSettings()
  if (!hasApiConfig.value) {
    return ElMessage.warning('请先在"模型配置"页面配置 AI API')
  }
  if (!hasTemplate.value) {
    return ElMessage.warning('请先在"模板与规则"页面配置 DOCX 模板')
  }
  if (selectedKbIds.value.length === 0 && !referenceMaterials.value.trim()) {
    return ElMessage.warning('请选择知识库或手动输入补充参考资料')
  }

  generating.value = true
  currentStep.value = 0
  rawDocumentData = {}
  documentSummary.value = '正在准备生成...'
  generationLogs.value = []
  submitCount.value = 0

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

    const selectedKbs = knowledgeBases.value.filter(k => selectedKbIds.value.includes(k.id))
    const kbContent = selectedKbs.map(k => `【知识库：${k.name}】\n${k.content}`).join('\n\n')

    const prompt = `
你是一个专业的文档生成助手。你需要根据【全局系统背景】、【补充参考资料】和【整体规则】，生成一段符合【数据结构要求】的 JSON 格式数据。

【🚨 终极核心指令（解决长文本生成的关键）】：
由于最终的文档可能非常巨大，你 **绝对不要** 在最后一次性输出完整的 JSON 数据！
请采取“边搜索，边提交”的策略：
1. 先搜索并整理某个模块的数据。
2. 每次提交时，尽量提交“一个完整模块”或“一批完整功能点”，不要拆得过碎。
3. 调用 \`submit_partial_data\` 工具时，只提交“新增数据增量”，绝对不要重复提交之前已经提交过的数据。
4. 如果字段是数组，新提交的数据会自动追加到末尾，所以不要把历史完整数组反复重发。
5. 单次提交不要过大，请控制在一个模块或一批功能点，不要一次提交整份文档。
6. 每个文本字段请尽量精炼，通常不要超过 2000 字，严禁把原始资料整段照搬进单个字段。
7. 当你确信所有模块和所有所需数据都已经提交完毕后，请调用 \`finish_generation\` 工具结束流程。

【数据结构要求（即模板中的变量，请根据这些变量名生成对应的键值对）】：
如果变量名有 "#" 前缀，表示这是一个数组（例如列表或多个功能点）。每次提交局部数据时，请保持这个结构，只填充当前搜集到的部分。
${schemaHint}

【变量含义与示例说明（非常重要，请严格遵守）】：
${varDefinitions}

【全局系统背景】：
${globalContext.value || '无'}

【整体规则】：
${currentStandardText.value || '无'}

【本次注意事项】：
${notes.value || '无'}

【补充参考资料】：
${referenceMaterials.value || '无'}
${kbContent ? '\n【关联的知识库内容】（通过 search_knowledge_base 获取更多）：\n' + kbContent.substring(0, 1000) + '... (内容较长已截断，请使用工具继续搜索)' : ''}
`

    // Step 2: Request AI (Agent Loop)
    currentStep.value = 2
    
    // 准备工具列表
    const openAiTools: any[] = []
    
    // Load Internal Tools
    const activeInternalTools = await InternalToolManager.getActiveTools()
    for (const tool of activeInternalTools) {
      openAiTools.push({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      })
    }

    // Add Incremental Core Tools
    openAiTools.push({
      type: "function",
      function: {
        name: "submit_partial_data",
        description: "提交局部生成的 JSON 数据。只提交新增增量，不要重复提交历史数据。如果字段是数组，新提交的数据会自动追加到现有数组末尾。",
        parameters: {
          type: "object",
          properties: {
            data: { type: "string", description: "局部的 JSON 数据字符串，务必保证其格式符合【数据结构要求】" },
            progress: { type: "string", description: "当前进度说明，如'已完成通信模块的生成'" }
          },
          required: ["data"]
        }
      }
    })
    openAiTools.push({
      type: "function",
      function: {
        name: "finish_generation",
        description: "当你认为所有需要生成的数据都已经全部通过 submit_partial_data 提交完毕后，调用此工具结束整个生成流程。",
        parameters: { type: "object", properties: {} }
      }
    })

    const activeMcpTools: any[] = []
    if (appSettings.mcpServers) {
      for (const server of appSettings.mcpServers) {
        try {
          await connectMcpServer(server.id, server.command, server.args, server.env)
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
    let loopCount = 0
    let isFinished = false
    const seenPartialPayloads = new Set<string>()

    while (loopCount < 40 && !isFinished) {
      loopCount++
      const reqPayload: any = {
        messages: compactMessages(messages),
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
        // 先把 assistant 消息推入，确保后面紧跟 tool 消息
        for (const toolCall of msg.tool_calls as any[]) {
          await yieldToUi() // 每个工具处理前都释放一次 UI
          let toolResult = ""
          
          try {
            if (toolCall.function.name === 'submit_partial_data') {
              const args = JSON.parse(toolCall.function.arguments)
              const payload = String(args.data || '')
              if (payload.length > 500000) {
                toolResult = '错误：单次提交数据过大（超过 500KB），请分批提交。'
              } else if (seenPartialPayloads.has(payload)) {
                toolResult = '检测到重复提交的局部数据，已忽略。请只提交新增增量。'
              } else {
                seenPartialPayloads.add(payload)
                const partialData = JSON.parse(payload)
                mergePartialData(rawDocumentData, partialData)
                submitCount.value += 1
                // 降低摘要更新频率，每 2 次提交更新一次摘要
                if (submitCount.value % 2 === 0) {
                  documentSummary.value = summarizeDocumentData(rawDocumentData)
                }
                appendGenerationLog(args.progress || `已完成第 ${submitCount.value} 次局部提交`)
                toolResult = `成功接收增量数据。累计提交 ${submitCount.value} 次。`
              }
            } else if (toolCall.function.name === 'finish_generation') {
              isFinished = true
              toolResult = "生成流程结束指令已确认。"
            } else {
              // Check Internal Tools first
              const internalTool = activeInternalTools.find(t => t.name === toolCall.function.name)
              if (internalTool) {
                const args = JSON.parse(toolCall.function.arguments)
                toolResult = await InternalToolManager.execute(internalTool, args, { kbContent })
              } else {
                // Check MCP tools
                const mcpItem = activeMcpTools.find(t => t.tool.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64) === toolCall.function.name)
                if (mcpItem) {
                  const res = await callMcpTool(mcpItem.serverId, mcpItem.tool.name, JSON.parse(toolCall.function.arguments))
                  toolResult = trimMessageContent(JSON.stringify(res), 3000)
                } else {
                  toolResult = "Tool not found"
                }
              }
            }
          } catch (e: any) {
            console.error('Tool execution error:', e)
            toolResult = "工具执行出错: " + e.message
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: toolResult
          })
        }
      } else {
        appendGenerationLog('模型停止继续调用工具，准备进入文档渲染。')
        isFinished = true
        break
      }
    }
    
    // Step 3: Render Document
    currentStep.value = 3
    documentSummary.value = summarizeDocumentData(rawDocumentData)
    await nextTick()
    await yieldToUi() // 渲染前最后释放一次 UI，确保进度文字能显示出来

    const buffer = await getTemplateBuffer(currentTemplatePath.value)
    if (!buffer) {
      throw new Error('无法读取模板文件内容，请重新上传模板')
    }
    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    const finalData = sanitizeForDocx(rawDocumentData)
    const renderStats = inspectRenderData(finalData)
    documentSummary.value = `${summarizeDocumentData(finalData)}\n总文本字符: ${renderStats.totalStringChars}\n数组项总数: ${renderStats.totalArrayItems}\n最大字段长度: ${renderStats.maxStringLength}`

    if (renderStats.totalArrayItems > MAX_RENDER_NODES) {
      throw new Error(`数组项总数过大 (${renderStats.totalArrayItems})，已拦截渲染，请缩小生成范围。`)
    }
    if (renderStats.totalStringChars > MAX_TOTAL_STRING_CHARS) {
      throw new Error(`文本总量过大 (${renderStats.totalStringChars} 字)，已拦截渲染，请缩小范围或减少单字段长度。`)
    }
    if (renderStats.maxStringLength > MAX_STRING_LENGTH) {
      throw new Error(`存在超长字段 (${renderStats.maxStringLength} 字)，已拦截渲染。`)
    }

    doc.render(finalData)

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
