import type { TemplateSchema } from './templateSchema'

const MAX_ARRAY_ITEMS = 300
const ARRAY_PUSH_CHUNK_SIZE = 200
const MAX_STRING_LENGTH = 8000
const MAX_TOTAL_STRING_CHARS = 120000
const MAX_RENDER_NODES = 2000

export interface RenderStats {
  totalStringChars: number
  maxStringLength: number
  totalArrayItems: number
  totalNodes: number
}

export function yieldToUi() {
  return new Promise((resolve) => setTimeout(resolve, 10))
}

export function trimMessageContent(content: string, maxLength = 4000) {
  if (!content) return content
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength)}\n...[truncated ${content.length - maxLength} chars]`
}

export function compactMessages(messages: any[]) {
  return messages.map((msg) => {
    if (msg.role === 'assistant' && msg.tool_calls) {
      return msg
    }
    if (typeof msg?.content === 'string' && msg.content.length > 2000) {
      return { ...msg, content: trimMessageContent(msg.content, 2000) }
    }
    return msg
  })
}

export function stableStringify(value: any): string {
  if (value === null || value === undefined) return String(value)
  if (typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
}

export function isPlainObject(value: any) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getArrayItemKey(item: any, index: number) {
  if (item === null || item === undefined) return `null:${index}`
  if (typeof item === 'string') return `str:${item.slice(0, 200)}`
  if (typeof item !== 'object') return `primitive:${String(item)}`

  const preferredKeys = ['id', 'key', 'name', 'title', 'code', '编号', '标识', '名称']
  for (const key of preferredKeys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) {
      return `${key}:${value.trim()}`
    }
  }
  return `obj:${stableStringify(item).slice(0, 500)}`
}

export function safeAppendArray(target: any[], source: any[], path = 'root') {
  if (!Array.isArray(target) || !Array.isArray(source)) return target
  if (target === source) {
    throw new Error(`检测到数组自引用追加: ${path}`)
  }

  if (source.length === 0) return target

  const remaining = Math.max(0, MAX_ARRAY_ITEMS - target.length)
  if (remaining === 0) return target

  const existingKeys = new Set(target.map((item, index) => getArrayItemKey(item, index)))
  const dedupedSource = source.filter((item, index) => {
    const key = getArrayItemKey(item, index)
    if (existingKeys.has(key)) return false
    existingKeys.add(key)
    return true
  })

  const toAppend = dedupedSource.slice(0, remaining)
  for (let i = 0; i < toAppend.length; i += ARRAY_PUSH_CHUNK_SIZE) {
    target.push(...toAppend.slice(i, i + ARRAY_PUSH_CHUNK_SIZE))
  }
  return target
}

export function sanitizeForDocx(value: any, path = 'root'): any {
  if (value === null || value === undefined) return ''

  if (typeof value === 'string') {
    const normalized = value.replace(/\n{4,}/g, '\n\n\n').trim()
    if (normalized.length <= MAX_STRING_LENGTH) return normalized
    return `${normalized.slice(0, MAX_STRING_LENGTH)}\n...[内容过长已截断]`
  }

  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    const sanitizedItems: any[] = []
    const seen = new Set<string>()
    for (let i = 0; i < value.length && sanitizedItems.length < MAX_ARRAY_ITEMS; i++) {
      const item = sanitizeForDocx(value[i], `${path}[${i}]`)
      const key = getArrayItemKey(item, i)
      if (seen.has(key)) continue
      seen.add(key)
      sanitizedItems.push(item)
    }
    return sanitizedItems
  }

  const result: Record<string, any> = {}
  for (const [key, child] of Object.entries(value)) {
    const sanitizedChild = sanitizeForDocx(child, `${path}.${key}`)
    const isEmptyObject = sanitizedChild && typeof sanitizedChild === 'object' && !Array.isArray(sanitizedChild) && Object.keys(sanitizedChild).length === 0
    const isEmptyArray = Array.isArray(sanitizedChild) && sanitizedChild.length === 0
    if (sanitizedChild === '' || sanitizedChild === null || sanitizedChild === undefined || isEmptyObject || isEmptyArray) {
      continue
    }
    result[key] = sanitizedChild
  }
  return result
}

export function inspectRenderData(value: any): RenderStats {
  const stats: RenderStats = {
    totalStringChars: 0,
    maxStringLength: 0,
    totalArrayItems: 0,
    totalNodes: 0,
  }

  const walk = (node: any) => {
    stats.totalNodes += 1
    if (node === null || node === undefined) return
    if (typeof node === 'string') {
      stats.totalStringChars += node.length
      stats.maxStringLength = Math.max(stats.maxStringLength, node.length)
      return
    }
    if (typeof node !== 'object') return
    if (Array.isArray(node)) {
      stats.totalArrayItems += node.length
      node.forEach(walk)
      return
    }
    Object.values(node).forEach(walk)
  }

  walk(value)
  return stats
}

export function summarizeDocumentData(data: Record<string, any>) {
  const parts: string[] = []
  const keys = Object.keys(data)
  parts.push(`顶层字段数: ${keys.length}`)

  for (const key of keys.slice(0, 12)) {
    const value = data[key]
    if (Array.isArray(value)) {
      parts.push(`${key}: 数组(${value.length})`)
    } else if (value && typeof value === 'object') {
      parts.push(`${key}: 对象(${Object.keys(value).length})`)
    } else if (typeof value === 'string') {
      parts.push(`${key}: 文本(${value.length}字)`)
    } else {
      parts.push(`${key}: ${typeof value}`)
    }
  }

  if (keys.length > 12) parts.push(`其余字段: ${keys.length - 12}`)
  return parts.join('\n')
}

export function mergeObjectFields(target: any, source: any): any {
  if (!isPlainObject(target) || !isPlainObject(source)) return source

  for (const key of Object.keys(source)) {
    const sourceVal = source[key]
    const targetVal = target[key]
    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      target[key] = mergeObjectFields(targetVal, sourceVal)
    } else {
      target[key] = sourceVal
    }
  }

  return target
}

export function parsePatchPath(path: string): Array<string | number> {
  const normalized = (path || '').trim()
  if (!normalized) return []

  const tokens: Array<string | number> = []
  const regex = /([^[.\]]+)|\[(\d+)\]/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(normalized)) !== null) {
    if (match[1] !== undefined) tokens.push(match[1])
    if (match[2] !== undefined) tokens.push(Number(match[2]))
  }
  return tokens
}

function getContainerByNextToken(nextToken: string | number | undefined) {
  return typeof nextToken === 'number' ? [] : {}
}

export function applyPatchOperation(
  root: Record<string, any>,
  operation: 'replace' | 'merge' | 'append',
  path: string,
  value: any,
) {
  const segments = parsePatchPath(path)

  if (segments.length === 0) {
    if (operation === 'append') {
      throw new Error('根路径不支持 append，请指定到具体数组字段')
    }
    if (operation === 'replace') {
      return typeof value === 'object' && value !== null ? value : { value }
    }
    return mergeObjectFields(root, value)
  }

  let current: any = root
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    const nextToken = segments[i + 1]

    if (typeof segment === 'number') {
      if (!Array.isArray(current)) {
        throw new Error(`路径 ${path} 非法：索引 ${segment} 的父节点不是数组`)
      }
      if (current[segment] === undefined || current[segment] === null || typeof current[segment] !== 'object') {
        current[segment] = getContainerByNextToken(nextToken)
      }
      current = current[segment]
    } else {
      if (!isPlainObject(current)) {
        throw new Error(`路径 ${path} 非法：字段 ${segment} 的父节点不是对象`)
      }
      if (current[segment] === undefined || current[segment] === null || typeof current[segment] !== 'object') {
        current[segment] = getContainerByNextToken(nextToken)
      }
      current = current[segment]
    }
  }

  const leaf = segments[segments.length - 1]
  const getLeafValue = () => (typeof leaf === 'number' ? current[leaf] : current[leaf])
  const setLeafValue = (nextValue: any) => {
    if (typeof leaf === 'number') {
      if (!Array.isArray(current)) {
        throw new Error(`路径 ${path} 非法：末尾索引 ${leaf} 的父节点不是数组`)
      }
      current[leaf] = nextValue
    } else {
      if (!isPlainObject(current)) {
        throw new Error(`路径 ${path} 非法：末尾字段 ${leaf} 的父节点不是对象`)
      }
      current[leaf] = nextValue
    }
  }

  const existing = getLeafValue()

  if (operation === 'replace') {
    setLeafValue(value)
    return root
  }

  if (operation === 'merge') {
    if (!isPlainObject(value)) {
      throw new Error('merge 操作只接受对象 value')
    }
    if (existing === undefined) {
      setLeafValue(value)
      return root
    }
    if (!isPlainObject(existing)) {
      throw new Error(`路径 ${path} 当前不是对象，不能执行 merge`)
    }
    setLeafValue(mergeObjectFields(existing, value))
    return root
  }

  const appendValue = Array.isArray(value) ? value : [value]
  if (existing === undefined) {
    setLeafValue([])
  }
  const nextExisting = getLeafValue()
  if (!Array.isArray(nextExisting)) {
    throw new Error(`路径 ${path} 当前不是数组，不能执行 append`)
  }
  safeAppendArray(nextExisting, appendValue, path)
  return root
}

export function buildRenderDataFromCanonical(schema: TemplateSchema, canonical: Record<string, any>) {
  const rootSource = isPlainObject(canonical.root) ? canonical.root : {}
  const entitySource = isPlainObject(canonical.entities) ? canonical.entities : {}

  const buildLoopItems = (node: any, parentId?: string) => {
    const sourceItems = Array.isArray(entitySource[node.name]) ? entitySource[node.name] : []
    const filtered = sourceItems.filter((item: any) => {
      if (!isPlainObject(item)) return false
      const itemParent = typeof item._parent === 'string' ? item._parent : ''
      return parentId ? itemParent === parentId : !itemParent
    })

    return filtered.slice(0, MAX_ARRAY_ITEMS).map((item: Record<string, any>, index: number) => {
      const row: Record<string, any> = {}
      for (const field of node.fields) {
        if (item[field] !== undefined) {
          row[field] = item[field]
        }
      }
      const itemId = typeof item._id === 'string' && item._id ? item._id : `${node.name}-${index}`
      for (const child of node.children) {
        row[child.name] = buildLoopItems(child, itemId)
      }
      return row
    })
  }

  const finalData: Record<string, any> = {}
  for (const field of schema.rootFields) {
    if (rootSource[field] !== undefined) {
      finalData[field] = rootSource[field]
    } else if (canonical[field] !== undefined) {
      finalData[field] = canonical[field]
    }
  }
  for (const loop of schema.loops) {
    finalData[loop.name] = buildLoopItems(loop)
  }

  return finalData
}

export function validateRenderStats(stats: RenderStats) {
  if (stats.totalArrayItems > MAX_RENDER_NODES) {
    throw new Error(`数组项总数过大 (${stats.totalArrayItems})，已拦截渲染，请缩小生成范围。`)
  }
  if (stats.totalStringChars > MAX_TOTAL_STRING_CHARS) {
    throw new Error(`文本总量过大 (${stats.totalStringChars} 字)，已拦截渲染，请缩小范围或减少单字段长度。`)
  }
  if (stats.maxStringLength > MAX_STRING_LENGTH) {
    throw new Error(`存在超长字段 (${stats.maxStringLength} 字)，已拦截渲染。`)
  }
}
