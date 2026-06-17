import localforage from 'localforage'
import type { GenerationRunRecord } from '../types/app'

const runHistoryStore = localforage.createInstance({
  name: 'doc-gen-workbench',
  storeName: 'generation_runs',
})

const RUN_HISTORY_KEY = 'recent_runs'
const MAX_RUNS = 20

export async function listRunHistory(): Promise<GenerationRunRecord[]> {
  const value = await runHistoryStore.getItem<GenerationRunRecord[]>(RUN_HISTORY_KEY)
  return Array.isArray(value) ? value : []
}

export async function saveRunHistory(record: GenerationRunRecord) {
  const existing = await listRunHistory()
  const next = [record, ...existing.filter((item) => item.id !== record.id)].slice(0, MAX_RUNS)
  await runHistoryStore.setItem(RUN_HISTORY_KEY, next)
  return next
}

export async function clearRunHistory() {
  await runHistoryStore.removeItem(RUN_HISTORY_KEY)
}
