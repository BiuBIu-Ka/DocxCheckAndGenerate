import localforage from 'localforage'
import type { GenerationRunRecord } from '../types/app'

const runHistoryStore = localforage.createInstance({
  name: 'doc-gen-workbench',
  storeName: 'generation_runs',
})

const RUN_HISTORY_KEY = 'recent_runs'
const MAX_RUNS = 20

function toSerializable(value: any, seen = new WeakSet()): any {
  if (value === null || value === undefined) return value

  const valueType = typeof value
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return value
  }
  if (valueType === 'bigint') {
    return value.toString()
  }
  if (valueType === 'function' || valueType === 'symbol') {
    return `[${valueType}]`
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value instanceof ArrayBuffer) {
    return `[ArrayBuffer ${value.byteLength} bytes]`
  }

  if (ArrayBuffer.isView(value)) {
    const typedArray = value as unknown as ArrayBufferView
    const previewArray = Array.from(
      new Uint8Array(typedArray.buffer, typedArray.byteOffset, Math.min(typedArray.byteLength, 32)),
    )
    return {
      type: value.constructor?.name || 'TypedArray',
      byteLength: typedArray.byteLength || 0,
      preview: previewArray,
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item, seen))
  }

  if (value instanceof Set) {
    return Array.from(value, (item) => toSerializable(item, seen))
  }

  if (value instanceof Map) {
    return Array.from(value.entries()).map(([key, item]) => [
      toSerializable(key, seen),
      toSerializable(item, seen),
    ])
  }

  if (valueType === 'object') {
    if (seen.has(value)) {
      return '[Circular]'
    }
    seen.add(value)

    const result: Record<string, any> = {}
    for (const key of Object.keys(value)) {
      try {
        result[key] = toSerializable(value[key], seen)
      } catch (error: any) {
        result[key] = `[Unserializable: ${error.message}]`
      }
    }
    return result
  }

  return String(value)
}

function normalizeRunRecord(record: GenerationRunRecord): GenerationRunRecord {
  return toSerializable(record) as GenerationRunRecord
}

export async function listRunHistory(): Promise<GenerationRunRecord[]> {
  const value = await runHistoryStore.getItem<GenerationRunRecord[]>(RUN_HISTORY_KEY)
  return Array.isArray(value) ? value : []
}

export async function saveRunHistory(record: GenerationRunRecord) {
  const existing = await listRunHistory()
  const normalizedRecord = normalizeRunRecord(record)
  const next = [normalizedRecord, ...existing.filter((item) => item.id !== normalizedRecord.id)].slice(0, MAX_RUNS)
  await runHistoryStore.setItem(RUN_HISTORY_KEY, next)
  return next
}

export async function clearRunHistory() {
  await runHistoryStore.removeItem(RUN_HISTORY_KEY)
}
