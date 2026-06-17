export interface TemplateLoopNode {
  name: string
  fields: string[]
  children: TemplateLoopNode[]
}

export interface TemplateSchema {
  rootFields: string[]
  loops: TemplateLoopNode[]
}

export function parseTemplateSchema(templateText: string): TemplateSchema {
  const regex = /\{([a-zA-Z0-9_#\/]+)\}/g
  const rootFields = new Set<string>()
  const loops: TemplateLoopNode[] = []
  const stack: TemplateLoopNode[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(templateText)) !== null) {
    const tag = match[1]
    if (!tag) continue

    if (tag.startsWith('#')) {
      const loopName = tag.slice(1).trim()
      if (!loopName) continue
      const node: TemplateLoopNode = { name: loopName, fields: [], children: [] }
      const parent = stack[stack.length - 1]
      if (parent) {
        parent.children.push(node)
      } else {
        loops.push(node)
      }
      stack.push(node)
      continue
    }

    if (tag.startsWith('/')) {
      stack.pop()
      continue
    }

    const currentLoop = stack[stack.length - 1]
    if (currentLoop) {
      if (!currentLoop.fields.includes(tag)) currentLoop.fields.push(tag)
    } else {
      rootFields.add(tag)
    }
  }

  return {
    rootFields: Array.from(rootFields),
    loops,
  }
}

export function describeTemplateLoops(nodes: TemplateLoopNode[], parentName?: string, lines: string[] = []) {
  for (const node of nodes) {
    lines.push(`- 循环 ${node.name}${parentName ? `，父级为 ${parentName}` : '，顶层循环'}，字段: ${node.fields.join(', ') || '无'}`)
    describeTemplateLoops(node.children, node.name, lines)
  }
  return lines
}
