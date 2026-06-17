import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AppSettings, McpServerConfig, TemplateProfile } from '../types/app'
import {
  createDefaultSettings,
  loadAppSettings,
  replaceAppSettings,
  updateAppSettings,
} from '../services/settingsService'

export const useAppConfigStore = defineStore('appConfig', () => {
  const loading = ref(false)
  const ready = ref(false)
  const settings = ref<AppSettings>(createDefaultSettings())

  const hasModelConfig = computed(() =>
    Boolean(settings.value.apiUrl && settings.value.apiKey && settings.value.modelName),
  )

  const environmentLabel = computed(() =>
    typeof window !== 'undefined' && (window as any).ipcRenderer ? 'Electron' : 'Web',
  )

  const templateCount = computed(() => settings.value.templates.length)
  const knowledgeCount = computed(() => settings.value.knowledgeBases.length)
  const toolCount = computed(() => settings.value.internalTools.filter((item) => item.enabled).length)

  async function load() {
    loading.value = true
    try {
      settings.value = await loadAppSettings()
      ready.value = true
      return settings.value
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    return load()
  }

  async function update(partial: Partial<AppSettings>) {
    settings.value = await updateAppSettings(partial)
    return settings.value
  }

  async function replace(next: AppSettings) {
    settings.value = await replaceAppSettings(next)
    return settings.value
  }

  function findTemplateById(id?: string | null): TemplateProfile | undefined {
    if (!id) return undefined
    return settings.value.templates.find((item) => item.id === id)
  }

  function findMcpServerById(id: string): McpServerConfig | undefined {
    return settings.value.mcpServers.find((item) => item.id === id)
  }

  return {
    loading,
    ready,
    settings,
    hasModelConfig,
    environmentLabel,
    templateCount,
    knowledgeCount,
    toolCount,
    load,
    refresh,
    update,
    replace,
    findTemplateById,
    findMcpServerById,
  }
})
