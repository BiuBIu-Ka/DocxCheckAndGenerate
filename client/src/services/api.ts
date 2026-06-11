import axios from 'axios'
import type {
  GenerationResponse,
  KnowledgeSummary,
  ModelProvider,
  ReviewResponse,
  StatusSummary,
} from '@/types/platform'

type GeneratePayload = {
  documentType: string
  projectName: string
  templateName: string
  prompt: string
}

let cachedBaseUrl: string | null = null

async function resolveBaseUrl() {
  if (cachedBaseUrl) {
    return cachedBaseUrl
  }

  if (window.desktopApi) {
    const runtime = await window.desktopApi.getRuntime()
    cachedBaseUrl = runtime.apiBaseUrl
    return cachedBaseUrl
  }

  cachedBaseUrl = '/api'
  return cachedBaseUrl
}

async function request<T>(config: { method: 'get' | 'post'; url: string; data?: unknown }) {
  const baseURL = await resolveBaseUrl()
  const { data } = await axios.request<T>({
    baseURL,
    timeout: 15000,
    method: config.method,
    url: config.url,
    data: config.data,
  })
  return data
}

export async function generateDocument(payload: GeneratePayload) {
  return request<GenerationResponse>({ method: 'post', url: '/generation', data: payload })
}

export async function reviewDocument(payload: { documentType: string; content: string }) {
  return request<ReviewResponse>({ method: 'post', url: '/review', data: payload })
}

export async function fetchKnowledgeSummary() {
  return request<KnowledgeSummary>({ method: 'get', url: '/knowledge/summary' })
}

export async function fetchModelProviders() {
  return request<ModelProvider[]>({ method: 'get', url: '/model-providers' })
}

export async function fetchStatusSummary() {
  return request<StatusSummary>({ method: 'get', url: '/status/summary' })
}

export async function buildManualDraft(payload: { screenshots: string[]; targetAudience: string; targetModule: string }) {
  return request<{ title: string; paragraphs: string[] }>({
    method: 'post',
    url: '/manuals/draft',
    data: payload,
  })
}
