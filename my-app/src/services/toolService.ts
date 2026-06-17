import type { InternalToolRecord, McpServerConfig } from '../types/app'
import { loadAppSettings, updateAppSettings } from './settingsService'
import { InternalToolManager } from '../utils/internalTools'

export function validateJsonInput(value: string) {
  if (!value.trim()) return { ok: true, value: undefined }
  try {
    return { ok: true, value: JSON.parse(value) }
  } catch (error: any) {
    return { ok: false, message: error.message }
  }
}

export async function listInternalTools() {
  return InternalToolManager.getAllTools()
}

export async function saveInternalTools(tools: InternalToolRecord[]) {
  await InternalToolManager.saveTools(tools as any)
  return listInternalTools()
}

export async function listMcpServers() {
  const settings = await loadAppSettings()
  return settings.mcpServers
}

export async function saveMcpServers(mcpServers: McpServerConfig[]) {
  const settings = await updateAppSettings({ mcpServers })
  return settings.mcpServers
}

export function summarizeToolUsage(toolName: string, recentRuns: Array<{ events: Array<{ sourceName?: string }> }>) {
  let count = 0
  for (const run of recentRuns) {
    for (const event of run.events) {
      if (event.sourceName === toolName) count += 1
    }
  }
  return `${toolName} 最近被调用 ${count} 次`
}
