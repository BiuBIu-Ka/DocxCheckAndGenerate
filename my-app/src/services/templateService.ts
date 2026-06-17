import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { getTemplateBuffer, saveTemplateBuffer, selectTemplateFile } from '../utils/bridge'
import type { TemplateProfile, TemplateVariableConfig } from '../types/app'
import { loadAppSettings, updateAppSettings } from './settingsService'
import { parseTemplateSchema } from '../features/generation/templateSchema'

function nowIso() {
  return new Date().toISOString()
}

export async function listTemplates() {
  const settings = await loadAppSettings()
  return settings.templates
}

export async function saveTemplates(templates: TemplateProfile[]) {
  const next = templates.map((item) => ({
    ...item,
    updatedAt: item.updatedAt || nowIso(),
  }))
  const settings = await updateAppSettings({ templates: next })
  return settings.templates
}

export async function deleteTemplateById(templateId: string) {
  const templates = await listTemplates()
  return saveTemplates(templates.filter((item) => item.id !== templateId))
}

export async function upsertTemplate(template: TemplateProfile) {
  const templates = await listTemplates()
  const next = [...templates]
  const index = next.findIndex((item) => item.id === template.id)
  const normalized = {
    ...template,
    updatedAt: nowIso(),
  }

  if (index >= 0) {
    next[index] = normalized
  } else {
    next.push(normalized)
  }

  return saveTemplates(next)
}

export async function pickTemplateFile() {
  return selectTemplateFile()
}

export async function persistTemplateBuffer(templateId: string, buffer: ArrayBuffer) {
  await saveTemplateBuffer(buffer, templateId)
}

export async function loadTemplateBuffer(template: TemplateProfile) {
  return (await getTemplateBuffer(template.id)) || (await getTemplateBuffer(template.path))
}

export function extractTemplateVariables(buffer: ArrayBuffer): TemplateVariableConfig[] {
  const zip = new PizZip(buffer)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })
  const text = doc.getFullText()
  const regex = /\{([a-zA-Z0-9_#\/]+)\}/g
  const matches = new Set<string>()
  let match
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1])
  }
  return Array.from(matches).map((name) => ({ name, description: '' }))
}

export function inspectTemplateStructure(buffer: ArrayBuffer) {
  const zip = new PizZip(buffer)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })
  const text = doc.getFullText()
  return parseTemplateSchema(text)
}
