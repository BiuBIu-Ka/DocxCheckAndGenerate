import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  GenerationMetrics,
  GenerationRunRecord,
  GenerationTimelineEvent,
  TemplateProfile,
} from '../types/app'
import { listRunHistory, saveRunHistory } from '../services/runHistoryService'

function createMetrics(): GenerationMetrics {
  return {
    rounds: 0,
    toolCalls: 0,
    patches: 0,
    mcpCalls: 0,
    startedAt: null,
    finishedAt: null,
    totalDurationMs: 0,
    totalStringChars: 0,
    totalArrayItems: 0,
    totalNodes: 0,
    maxStringLength: 0,
  }
}

function createEventId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useGenerationWorkbenchStore = defineStore('generationWorkbench', () => {
  const templateId = ref('')
  const selectedKnowledgeBaseIds = ref<string[]>([])
  const globalContext = ref('')
  const referenceMaterials = ref('')
  const notes = ref('')
  const generating = ref(false)
  const currentStep = ref(0)
  const events = ref<GenerationTimelineEvent[]>([])
  const metrics = ref<GenerationMetrics>(createMetrics())
  const previewJson = ref('')
  const previewData = ref<Record<string, any> | null>(null)
  const previewSummary = ref('')
  const errorMessage = ref('')
  const currentRunId = ref('')
  const recentRuns = ref<GenerationRunRecord[]>([])
  const selectedEventId = ref('')

  const selectedEvent = computed(() =>
    events.value.find((item) => item.id === selectedEventId.value),
  )

  function resetWorkbench() {
    generating.value = false
    currentStep.value = 0
    events.value = []
    metrics.value = createMetrics()
    previewJson.value = ''
    previewData.value = null
    previewSummary.value = ''
    errorMessage.value = ''
    currentRunId.value = ''
    selectedEventId.value = ''
  }

  function setTemplate(template?: TemplateProfile) {
    templateId.value = template?.id || ''
  }

  function appendEvent(event: Omit<GenerationTimelineEvent, 'id' | 'timestamp'> & Partial<Pick<GenerationTimelineEvent, 'id' | 'timestamp'>>) {
    const nextEvent: GenerationTimelineEvent = {
      id: event.id || createEventId(),
      timestamp: event.timestamp || Date.now(),
      type: event.type,
      title: event.title,
      summary: event.summary,
      status: event.status,
      durationMs: event.durationMs,
      sourceName: event.sourceName,
      payload: event.payload,
    }
    events.value = [...events.value, nextEvent]
    return nextEvent
  }

  function startRun() {
    resetWorkbench()
    generating.value = true
    currentStep.value = 1
    currentRunId.value = `run_${Date.now()}`
    metrics.value.startedAt = Date.now()
  }

  function finishRun(status: 'success' | 'error') {
    generating.value = false
    currentStep.value = 0
    metrics.value.finishedAt = Date.now()
    metrics.value.totalDurationMs = Math.max(
      0,
      (metrics.value.finishedAt || 0) - (metrics.value.startedAt || 0),
    )
    if (status === 'error' && !errorMessage.value) {
      errorMessage.value = '生成失败'
    }
  }

  function updateMetrics(partial: Partial<GenerationMetrics>) {
    metrics.value = {
      ...metrics.value,
      ...partial,
    }
  }

  function setPreview(payload: { json: string; data: Record<string, any>; summary: string }) {
    previewJson.value = payload.json
    previewData.value = payload.data
    previewSummary.value = payload.summary
  }

  function setError(message: string) {
    errorMessage.value = message
  }

  async function loadRecentRuns() {
    recentRuns.value = await listRunHistory()
    return recentRuns.value
  }

  async function persistCurrentRun(input: {
    status: 'success' | 'error'
    templateName?: string
    knowledgeBaseIds: string[]
    knowledgeBaseNames: string[]
  }) {
    const record: GenerationRunRecord = {
      id: currentRunId.value || `run_${Date.now()}`,
      createdAt: metrics.value.startedAt || Date.now(),
      status: input.status,
      templateId: templateId.value || undefined,
      templateName: input.templateName,
      knowledgeBaseIds: input.knowledgeBaseIds,
      knowledgeBaseNames: input.knowledgeBaseNames,
      metrics: metrics.value,
      events: events.value,
      previewJson: previewJson.value || undefined,
      previewSummary: previewSummary.value || undefined,
      errorMessage: errorMessage.value || undefined,
    }
    recentRuns.value = await saveRunHistory(record)
    return record
  }

  return {
    templateId,
    selectedKnowledgeBaseIds,
    globalContext,
    referenceMaterials,
    notes,
    generating,
    currentStep,
    events,
    metrics,
    previewJson,
    previewData,
    previewSummary,
    errorMessage,
    currentRunId,
    recentRuns,
    selectedEventId,
    selectedEvent,
    resetWorkbench,
    setTemplate,
    appendEvent,
    startRun,
    finishRun,
    updateMetrics,
    setPreview,
    setError,
    loadRecentRuns,
    persistCurrentRun,
  }
})
