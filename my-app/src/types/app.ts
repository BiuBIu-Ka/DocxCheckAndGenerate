export interface TemplateVariableConfig {
  name: string
  description: string
}

export interface TemplateProfile {
  id: string
  name: string
  path: string
  fileName: string
  standardText: string
  variables: TemplateVariableConfig[]
  updatedAt: string
}

export interface KnowledgeBaseRecord {
  id: string
  name: string
  content: string
  files: string[]
  updatedAt: string
}

export interface InternalToolConfig {
  url?: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
}

export interface InternalToolRecord {
  id: string
  name: string
  description: string
  parameters: Record<string, any>
  type: 'system' | 'http'
  enabled: boolean
  config?: InternalToolConfig
}

export interface McpToolRecord {
  name: string
  description?: string
  inputSchema?: Record<string, any>
}

export interface McpServerConfig {
  id: string
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  status?: 'connected' | 'disconnected'
  tools?: McpToolRecord[]
  lastError?: string
}

export interface ModelConfig {
  apiUrl: string
  apiKey: string
  modelName: string
  temperature: number
  maxRounds: number
  debugEnabled: boolean
}

export interface AppSettings extends ModelConfig {
  templates: TemplateProfile[]
  knowledgeBases: KnowledgeBaseRecord[]
  internalTools: InternalToolRecord[]
  mcpServers: McpServerConfig[]
}

export type GenerationEventType =
  | 'system'
  | 'model_request'
  | 'assistant'
  | 'tool_call'
  | 'tool_result'
  | 'patch'
  | 'finish'
  | 'warning'
  | 'error'

export interface GenerationTimelineEvent {
  id: string
  type: GenerationEventType
  title: string
  summary: string
  timestamp: number
  status?: 'info' | 'success' | 'warning' | 'error'
  durationMs?: number
  sourceName?: string
  payload?: any
}

export interface GenerationMetrics {
  rounds: number
  toolCalls: number
  patches: number
  mcpCalls: number
  startedAt: number | null
  finishedAt: number | null
  totalDurationMs: number
  totalStringChars: number
  totalArrayItems: number
  totalNodes: number
  maxStringLength: number
}

export interface GenerationRunRecord {
  id: string
  createdAt: number
  status: 'running' | 'success' | 'error'
  templateId?: string
  templateName?: string
  knowledgeBaseIds: string[]
  knowledgeBaseNames: string[]
  metrics: GenerationMetrics
  events: GenerationTimelineEvent[]
  previewJson?: string
  previewSummary?: string
  errorMessage?: string
}
