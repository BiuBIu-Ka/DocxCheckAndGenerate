import type { KnowledgeBaseRecord, TemplateProfile } from '../../types/app'
import type { TemplateSchema } from './templateSchema'
import { describeTemplateLoops } from './templateSchema'

interface BuildPromptOptions {
  template: TemplateProfile
  templateSchema: TemplateSchema
  selectedKnowledgeBases: KnowledgeBaseRecord[]
  globalContext: string
  referenceMaterials: string
  notes: string
}

export function buildGenerationPrompt(options: BuildPromptOptions) {
  const loopDescriptions = describeTemplateLoops(options.templateSchema.loops).join('\n')
  const canonicalSchemaHint = `请输出统一的标准中间结构（Canonical Structure），而不是直接输出模板嵌套树：
{
  "root": {
    ${options.templateSchema.rootFields.map((field) => `"${field}": "..."`).join(',\n    ')}
  },
  "entities": {
    ${options.templateSchema.loops.map((loop) => `"${loop.name}": [{ "_id": "${loop.name}-1", ${loop.fields.map((field) => `"${field}": "..."`).join(', ')} }]`).join(',\n    ')}
  }
}
规则：
- 顶层普通变量放进 root。
- 每个循环块都对应 entities 下的同名数组。
- 顶层循环数组项使用 "_id" 标识唯一主键。
- 子循环数组项除了 "_id" 外，还必须使用 "_parent" 指向父级数组项的 _id。
- 不要直接返回嵌套 children 数组，嵌套关系由系统根据 _parent 自动组装。`

  const varDefinitions = options.template.variables
    .map((item) => `- 【${item.name}】: ${item.description || '无具体说明，请根据上下文推断'}`)
    .join('\n')

  const kbContent = options.selectedKnowledgeBases
    .map((item) => `【知识库：${item.name}】\n${item.content}`)
    .join('\n\n')

  const prompt = `
你是一个专业的文档生成助手。你需要根据【全局系统背景】、【补充参考资料】和【整体规则】，生成一段符合【统一标准结构】的 JSON Patch 数据。

【🚨 终极核心指令（解决长文本生成的关键）】：
由于最终的文档可能非常巨大，你绝对不要在最后一次性输出完整的 JSON 数据。
请采取“边搜索，边提交 patch”的策略：
1. 每次提交必须使用 \`submit_partial_data\`，并明确给出 \`operation\`、\`path\`、\`value\`。
2. 默认优先使用 \`replace\`：例如 \`root\`、\`entities.apps\`、\`entities.models\` 这类路径都优先 replace。
3. 只有当你明确知道某个路径是“新增列表项”时，才使用 \`append\`。
4. 当你只想补充对象里的部分字段时，才使用 \`merge\`。
5. 严禁把最终模板树结构直接提交给系统；你只负责提交统一标准结构中的 root 和 entities。
6. 严禁把整棵 JSON 树反复提交；每次只提交一个明确 path 的局部 patch。
7. 每个文本字段请尽量精炼，通常不要超过 2000 字，严禁把原始资料整段照搬进单个字段。
8. 单次提交不要过大，请控制在一个模块或一批功能点。
9. 当你确信所有模块和所有所需数据都已经全部提交完毕后，请调用 \`finish_generation\` 工具结束流程。

【Patch 协议说明】：
- operation = replace: 用 value 整体替换 path 对应的字段，这是默认首选模式。
- operation = merge: 仅用于对象，按字段递归合并；数组在 merge 中会整体替换，不会追加。
- operation = append: 仅用于数组，表示只向该数组追加新增项。
- path 示例：
  - "root"
  - "root.APP_NAME"
  - "entities.apps"
  - "entities.models"
  - "entities.childModels"
  - "entities.functions"

【模板循环结构】：
${loopDescriptions || '无循环结构'}

【统一标准结构要求】：
${canonicalSchemaHint}

【变量含义与示例说明（非常重要，请严格遵守）】：
${varDefinitions || '无'}

【全局系统背景】：
${options.globalContext || '无'}

【整体规则】：
${options.template.standardText || '无'}

【本次注意事项】：
${options.notes || '无'}

【补充参考资料】：
${options.referenceMaterials || '无'}
${kbContent ? '\n【关联的知识库内容】（通过 search_knowledge_base 获取更多）：\n' + kbContent.substring(0, 1000) + '... (内容较长已截断，请使用工具继续搜索)' : ''}
`

  return {
    prompt,
    knowledgeBaseContent: kbContent,
  }
}
