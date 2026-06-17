import { getSettings, saveSettings } from './bridge'

export interface InternalTool {
  id: string
  name: string
  description: string
  parameters: object
  type: 'system' | 'http'
  enabled: boolean
  config?: any
}

// 系统预设的内置工具，如果不被覆盖则默认启用
export const defaultSystemTools: InternalTool[] = [
  {
    id: 'sys_search_kb',
    name: 'search_knowledge_base',
    description: '用于从本地知识库中根据关键字搜索相关的文本片段。当你不确定具体的系统模块或功能细节时，必须首先调用此工具。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: "搜索关键字，如'通用管理系统包含哪些功能'" }
      },
      required: ['query']
    },
    type: 'system',
    enabled: true
  }
]

export class InternalToolManager {
  static async getAllTools(): Promise<InternalTool[]> {
    const settings = await getSettings()
    let tools: InternalTool[] = settings.internalTools || []
    
    // 合并默认的系统工具（如果配置文件中没有）
    for (const sysTool of defaultSystemTools) {
      if (!tools.find(t => t.id === sysTool.id)) {
        tools.push({ ...sysTool })
      }
    }
    return tools
  }

  static async saveTools(tools: InternalTool[]): Promise<boolean> {
    const settings = await getSettings()
    settings.internalTools = tools
    return await saveSettings(settings)
  }

  static async getActiveTools(): Promise<InternalTool[]> {
    const tools = await this.getAllTools()
    return tools.filter(t => t.enabled)
  }

  // 具体的执行逻辑
  static async execute(tool: InternalTool, args: any, context: { kbContent: string }): Promise<string> {
    if (tool.type === 'system') {
      if (tool.name === 'search_knowledge_base') {
        return this.localKbSearch(context.kbContent, args.query)
      }
      return `Error: System tool ${tool.name} not implemented.`
    } else if (tool.type === 'http') {
      return await this.executeHttpTool(tool, args)
    }
    return `Error: Unknown tool type ${tool.type}.`
  }

  private static localKbSearch(content: string, query: string): string {
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

  private static async executeHttpTool(tool: InternalTool, args: any): Promise<string> {
    try {
      const url = tool.config?.url
      const method = (tool.config?.method || 'GET').toUpperCase()
      const headers = tool.config?.headers || {}

      let fetchUrl = url
      let fetchOptions: RequestInit = { method, headers: { 'Content-Type': 'application/json', ...headers } }

      if (method === 'GET') {
        const params = new URLSearchParams(args)
        fetchUrl = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`
      } else {
        fetchOptions.body = JSON.stringify(args)
      }

      const response = await fetch(fetchUrl, fetchOptions)
      const data = await response.text()
      return data
    } catch (e: any) {
      return `HTTP Tool Execution Error: ${e.message}`
    }
  }
}
