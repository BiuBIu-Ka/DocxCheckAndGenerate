import type { InternalToolRecord, McpToolRecord } from '../../types/app'

export interface RegisteredMcpTool {
  serverId: string
  tool: McpToolRecord
  sanitizedName: string
}

export function sanitizeToolName(name: string) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64)
}

export function createInternalToolSpecs(tools: InternalToolRecord[]) {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))
}

export function createCoreToolSpecs() {
  return [
    {
      type: 'function',
      function: {
        name: 'submit_partial_data',
        description: '按 patch 协议提交局部数据。必须提供 operation、path、value。默认优先使用 replace；只有明确新增数组项时才使用 append。',
        parameters: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              enum: ['replace', 'merge', 'append'],
              description: '写入方式。默认优先 replace。',
            },
            path: {
              type: 'string',
              description: '要写入的数据路径，例如 root、entities.apps、entities.models',
            },
            value: {
              type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
              description: '写入到 path 的 JSON 值。',
            },
            progress: { type: 'string', description: '当前进度说明，如 已完成通信模块生成' },
          },
          required: ['operation', 'path', 'value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'finish_generation',
        description: '当所有需要生成的数据都已经全部通过 submit_partial_data 提交完毕后，调用此工具结束整个生成流程。',
        parameters: { type: 'object', properties: {} },
      },
    },
  ]
}

export function createMcpToolSpecs(tools: RegisteredMcpTool[]) {
  return tools.map((item) => ({
    type: 'function',
    function: {
      name: item.sanitizedName,
      description: item.tool.description || '',
      parameters: item.tool.inputSchema || { type: 'object', properties: {} },
    },
  }))
}
