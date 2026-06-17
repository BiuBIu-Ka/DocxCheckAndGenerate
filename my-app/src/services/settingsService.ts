import { getSettings, saveSettings } from '../utils/bridge'
import type {
  AppSettings,
  InternalToolRecord,
  KnowledgeBaseRecord,
  McpServerConfig,
  ModelConfig,
  TemplateProfile,
  TemplateVariableConfig,
} from '../types/app'

const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: '',
  apiKey: '',
  modelName: '',
  temperature: 0.7,
  maxRounds: 40,
  debugEnabled: true,
  templates: [],
  knowledgeBases: [],
  internalTools: [],
  mcpServers: [],
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeVariable(input: any): TemplateVariableConfig {
  if (typeof input === 'string') {
    return { name: input, description: '' }
  }
  return {
    name: String(input?.name || ''),
    description: String(input?.description || ''),
  }
}

function normalizeTemplate(input: any): TemplateProfile {
  const path = String(input?.path || '')
  const fileName = String(input?.fileName || path.split('\\').pop()?.split('/').pop() || '')
  return {
    id: String(input?.id || `tpl_${Date.now()}`),
    name: String(input?.name || '未命名模板'),
    path,
    fileName,
    standardText: String(input?.standardText || ''),
    variables: Array.isArray(input?.variables)
      ? input.variables
          .map(normalizeVariable)
          .filter((item: TemplateVariableConfig) => item.name)
      : [],
    updatedAt: String(input?.updatedAt || nowIso()),
  }
}

function normalizeKnowledgeBase(input: any): KnowledgeBaseRecord {
  return {
    id: String(input?.id || Date.now().toString()),
    name: String(input?.name || '未命名知识库'),
    content: String(input?.content || ''),
    files: Array.isArray(input?.files) ? input.files.map((item: any) => String(item)) : [],
    updatedAt: String(input?.updatedAt || nowIso()),
  }
}

function normalizeInternalTool(input: any): InternalToolRecord {
  return {
    id: String(input?.id || `tool_${Date.now()}`),
    name: String(input?.name || 'unnamed_tool'),
    description: String(input?.description || ''),
    parameters: (input?.parameters && typeof input.parameters === 'object') ? input.parameters : { type: 'object', properties: {}, required: [] },
    type: input?.type === 'http' ? 'http' : 'system',
    enabled: input?.enabled !== false,
    config: input?.config && typeof input.config === 'object'
      ? {
          url: input.config.url ? String(input.config.url) : undefined,
          method: input.config.method === 'POST' ? 'POST' : 'GET',
          headers: input.config.headers && typeof input.config.headers === 'object' ? input.config.headers : undefined,
        }
      : undefined,
  }
}

function normalizeMcpServer(input: any): McpServerConfig {
  return {
    id: String(input?.id || `mcp_${Date.now()}`),
    name: String(input?.name || '未命名 MCP 服务'),
    command: String(input?.command || ''),
    args: Array.isArray(input?.args) ? input.args.map((item: any) => String(item)) : [],
    env: input?.env && typeof input.env === 'object' ? input.env : undefined,
    status: input?.status === 'connected' ? 'connected' : 'disconnected',
    tools: Array.isArray(input?.tools) ? input.tools : [],
    lastError: input?.lastError ? String(input.lastError) : undefined,
  }
}

export function normalizeAppSettings(input: any): AppSettings {
  const migratedTemplates = Array.isArray(input?.templates) ? input.templates : []
  const legacyTemplates = input?.templatePath || input?.templateName
    ? [
        {
          id: `tpl_legacy_${Date.now()}`,
          name: input.templateName || '默认模板',
          path: input.templatePath || '',
          fileName: input.templatePath ? String(input.templatePath).split('\\').pop()?.split('/').pop() || '' : '',
          standardText: input.standardText || '',
          variables: Array.isArray(input?.templateVariables) ? input.templateVariables : [],
          updatedAt: nowIso(),
        },
      ]
    : []

  return {
    apiUrl: String(input?.apiUrl || DEFAULT_SETTINGS.apiUrl),
    apiKey: String(input?.apiKey || DEFAULT_SETTINGS.apiKey),
    modelName: String(input?.modelName || DEFAULT_SETTINGS.modelName),
    temperature: typeof input?.temperature === 'number' ? input.temperature : DEFAULT_SETTINGS.temperature,
    maxRounds: typeof input?.maxRounds === 'number' ? input.maxRounds : DEFAULT_SETTINGS.maxRounds,
    debugEnabled: typeof input?.debugEnabled === 'boolean' ? input.debugEnabled : DEFAULT_SETTINGS.debugEnabled,
    templates: [...migratedTemplates, ...legacyTemplates].map(normalizeTemplate),
    knowledgeBases: Array.isArray(input?.knowledgeBases) ? input.knowledgeBases.map(normalizeKnowledgeBase) : [],
    internalTools: Array.isArray(input?.internalTools) ? input.internalTools.map(normalizeInternalTool) : [],
    mcpServers: Array.isArray(input?.mcpServers) ? input.mcpServers.map(normalizeMcpServer) : [],
  }
}

function settingsChanged(raw: any, normalized: AppSettings) {
  return JSON.stringify(raw || {}) !== JSON.stringify(normalized)
}

export function createDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS }
}

export async function loadAppSettings(): Promise<AppSettings> {
  const raw = (await getSettings()) || {}
  const normalized = normalizeAppSettings(raw)
  if (settingsChanged(raw, normalized)) {
    await saveSettings(normalized)
  }
  return normalized
}

export async function replaceAppSettings(nextSettings: AppSettings) {
  const normalized = normalizeAppSettings(nextSettings)
  await saveSettings(normalized)
  return normalized
}

export async function updateAppSettings(partial: Partial<AppSettings>) {
  const current = await loadAppSettings()
  const merged = normalizeAppSettings({
    ...current,
    ...partial,
  })
  await saveSettings(merged)
  return merged
}

export async function updateModelConfig(partial: Partial<ModelConfig>) {
  const current = await loadAppSettings()
  const next: AppSettings = {
    ...current,
    ...partial,
  }
  await saveSettings(next)
  return next
}
