import OpenAI from 'openai'
import { callMcpTool, connectMcpServer, getMcpTools } from '../../utils/bridge'
import { InternalToolManager } from '../../utils/internalTools'
import type {
  GenerationMetrics,
  GenerationTimelineEvent,
  InternalToolRecord,
  McpServerConfig,
  ModelConfig,
} from '../../types/app'
import {
  applyPatchOperation,
  compactMessages,
  stableStringify,
  summarizeDocumentData,
  trimMessageContent,
  yieldToUi,
} from './canonicalData'
import {
  createCoreToolSpecs,
  createInternalToolSpecs,
  createMcpToolSpecs,
  sanitizeToolName,
  type RegisteredMcpTool,
} from './toolRegistry'

interface AgentRunnerOptions {
  modelConfig: ModelConfig
  prompt: string
  knowledgeBaseContent: string
  internalTools: InternalToolRecord[]
  mcpServers: McpServerConfig[]
}

interface AgentRunnerCallbacks {
  onEvent?: (event: Omit<GenerationTimelineEvent, 'id' | 'timestamp'> & Partial<Pick<GenerationTimelineEvent, 'id' | 'timestamp'>>) => void
  onMetrics?: (partial: Partial<GenerationMetrics>) => void
  onCanonicalDataChange?: (canonicalData: Record<string, any>) => void
}

export async function runGenerationAgent(
  options: AgentRunnerOptions,
  callbacks: AgentRunnerCallbacks = {},
) {
  const onEvent = callbacks.onEvent || (() => {})
  const onMetrics = callbacks.onMetrics || (() => {})
  const onCanonicalDataChange = callbacks.onCanonicalDataChange || (() => {})

  const rawDocumentData: Record<string, any> = { root: {}, entities: {} }
  const seenPatchSignatures = new Set<string>()
  const activeMcpTools: RegisteredMcpTool[] = []
  const metrics: GenerationMetrics = {
    rounds: 0,
    toolCalls: 0,
    patches: 0,
    mcpCalls: 0,
    startedAt: Date.now(),
    finishedAt: null,
    totalDurationMs: 0,
    totalStringChars: 0,
    totalArrayItems: 0,
    totalNodes: 0,
    maxStringLength: 0,
  }

  for (const server of options.mcpServers) {
    try {
      await connectMcpServer(server.id, server.command, server.args, server.env)
      const tools = await getMcpTools(server.id)
      for (const tool of tools) {
        activeMcpTools.push({
          serverId: server.id,
          tool,
          sanitizedName: sanitizeToolName(tool.name),
        })
      }
      onEvent({
        type: 'system',
        title: `MCP 服务已连接：${server.name}`,
        summary: `已加载 ${tools.length} 个工具`,
        status: 'success',
        payload: { server, tools },
      })
    } catch (error: any) {
      onEvent({
        type: 'warning',
        title: `MCP 服务连接失败：${server.name}`,
        summary: error?.message || '连接失败',
        status: 'warning',
        payload: { server },
      })
    }
  }

  const openai = new OpenAI({
    baseURL: options.modelConfig.apiUrl,
    apiKey: options.modelConfig.apiKey,
    dangerouslyAllowBrowser: true,
  })

  const openAiTools = [
    ...createInternalToolSpecs(options.internalTools),
    ...createCoreToolSpecs(),
    ...createMcpToolSpecs(activeMcpTools),
  ]

  let messages: any[] = [{ role: 'user', content: options.prompt }]
  let loopCount = 0
  let isFinished = false

  while (loopCount < options.modelConfig.maxRounds && !isFinished) {
    loopCount++
    metrics.rounds = loopCount
    onMetrics({ rounds: metrics.rounds })

    const reqPayload: any = {
      messages: compactMessages(messages),
      model: options.modelConfig.modelName,
      temperature: options.modelConfig.temperature,
      tools: openAiTools,
    }

    onEvent({
      type: 'model_request',
      title: `第 ${loopCount} 轮模型请求`,
      summary: `向 ${options.modelConfig.modelName} 发起对话请求`,
      status: 'info',
      payload: reqPayload,
    })

    const requestStartedAt = Date.now()
    const completion = await openai.chat.completions.create(reqPayload)
    const msg = completion.choices[0].message
    const requestDuration = Date.now() - requestStartedAt
    messages.push(msg)

    onEvent({
      type: 'assistant',
      title: `第 ${loopCount} 轮模型响应`,
      summary: msg.tool_calls?.length
        ? `模型返回 ${msg.tool_calls.length} 个工具调用`
        : trimMessageContent(String(msg.content || '模型未返回可见文本'), 240),
      status: 'info',
      durationMs: requestDuration,
      payload: msg,
    })

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const toolCall of msg.tool_calls as any[]) {
        await yieldToUi()
        metrics.toolCalls += 1
        onMetrics({ toolCalls: metrics.toolCalls })

        onEvent({
          type: 'tool_call',
          title: `工具调用：${toolCall.function.name}`,
          summary: trimMessageContent(toolCall.function.arguments || '{}', 220),
          status: 'info',
          payload: toolCall,
        })

        let toolResult = ''
        let toolStatus: 'info' | 'success' | 'warning' | 'error' = 'success'
        const toolStartedAt = Date.now()

        try {
          if (toolCall.function.name === 'submit_partial_data') {
            const args = JSON.parse(toolCall.function.arguments)
            const operation = (args.operation || 'replace') as 'replace' | 'merge' | 'append'
            const path = String(args.path || '').trim()
            const patchValue = args.value
            const payload = stableStringify({ operation, path, value: patchValue })

            if (payload.length > 500000) {
              toolResult = '错误：单次 patch 数据过大（超过 500KB），请继续拆分。'
              toolStatus = 'warning'
            } else if (seenPatchSignatures.has(payload)) {
              toolResult = '检测到重复 patch，已忽略。请不要重复提交同一路径的相同内容。'
              toolStatus = 'warning'
            } else {
              seenPatchSignatures.add(payload)
              applyPatchOperation(rawDocumentData, operation, path, patchValue)
              metrics.patches += 1
              onMetrics({ patches: metrics.patches })
              onCanonicalDataChange(rawDocumentData)
              toolResult = `Patch 已应用成功。operation=${operation}; path=${path || 'root'}; 当前数据摘要：${summarizeDocumentData(rawDocumentData)}`

              onEvent({
                type: 'patch',
                title: `Patch ${operation} ${path || 'root'}`,
                summary: args.progress || '已写入局部结构化数据',
                status: 'success',
                payload: args,
              })
            }
          } else if (toolCall.function.name === 'finish_generation') {
            isFinished = true
            toolResult = '生成流程结束指令已确认。'
            onEvent({
              type: 'finish',
              title: '生成结束',
              summary: '模型主动结束结构化生成流程',
              status: 'success',
            })
          } else {
            const internalTool = options.internalTools.find((item) => item.name === toolCall.function.name)
            if (internalTool) {
              const args = JSON.parse(toolCall.function.arguments)
              toolResult = await InternalToolManager.execute(internalTool as any, args, {
                kbContent: options.knowledgeBaseContent,
              })
            } else {
              const mcpItem = activeMcpTools.find((item) => item.sanitizedName === toolCall.function.name)
              if (mcpItem) {
                const res = await callMcpTool(
                  mcpItem.serverId,
                  mcpItem.tool.name,
                  JSON.parse(toolCall.function.arguments),
                )
                metrics.mcpCalls += 1
                onMetrics({ mcpCalls: metrics.mcpCalls })
                toolResult = trimMessageContent(JSON.stringify(res), 3000)
              } else {
                toolResult = 'Tool not found'
                toolStatus = 'error'
              }
            }
          }
        } catch (error: any) {
          toolResult = `工具执行出错: ${error.message}`
          toolStatus = 'error'
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: toolResult,
        })

        onEvent({
          type: 'tool_result',
          title: `工具结果：${toolCall.function.name}`,
          summary: trimMessageContent(toolResult, 260),
          status: toolStatus,
          durationMs: Date.now() - toolStartedAt,
          sourceName: toolCall.function.name,
          payload: { toolCall, toolResult },
        })
      }
    } else {
      isFinished = true
      onEvent({
        type: 'finish',
        title: '模型结束调用',
        summary: '模型停止继续调用工具，准备进入文档预览阶段。',
        status: 'success',
      })
    }
  }

  metrics.finishedAt = Date.now()
  metrics.totalDurationMs = metrics.finishedAt - (metrics.startedAt || metrics.finishedAt)
  onMetrics({
    finishedAt: metrics.finishedAt,
    totalDurationMs: metrics.totalDurationMs,
  })

  return {
    canonicalData: rawDocumentData,
    metrics,
  }
}
