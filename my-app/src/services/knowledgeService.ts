import { selectAndExtractTextFiles } from '../utils/bridge'
import type { KnowledgeBaseRecord } from '../types/app'
import { loadAppSettings, updateAppSettings } from './settingsService'

function nowIso() {
  return new Date().toISOString()
}

export async function listKnowledgeBases() {
  const settings = await loadAppSettings()
  return settings.knowledgeBases
}

export async function saveKnowledgeBases(knowledgeBases: KnowledgeBaseRecord[]) {
  const settings = await updateAppSettings({
    knowledgeBases: knowledgeBases.map((item) => ({
      ...item,
      updatedAt: item.updatedAt || nowIso(),
    })),
  })
  return settings.knowledgeBases
}

export async function uploadKnowledgeFiles() {
  return selectAndExtractTextFiles()
}

export function buildKnowledgeStats(content: string) {
  const blocks = content.split('\n\n').filter((item) => item.trim())
  return {
    charCount: content.length,
    blockCount: blocks.length,
    recommendedQueryHint: blocks.length > 30 ? '建议先缩小检索范围或拆分知识库' : '当前知识库适合直接引用和搜索',
  }
}
