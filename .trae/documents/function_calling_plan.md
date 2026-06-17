# AI 文档生成 - Function Calling (工具调用) 架构升级计划

## 1. 摘要 (Summary)
当前系统采用“单次全量 Prompt 注入”的方式，如果知识库内容过多，容易导致大模型出现遗漏、摘要化或超出上下文窗口等问题。
本计划旨在引入 **Agent Function Calling（工具调用）** 机制。AI 将化身为主动探索的 Agent：首先获取模板的数据结构，然后**主动调用搜索工具**从知识库中按需获取各个模块/功能点的详细信息，最后再拼接出完整的高质量 JSON 数据，彻底解决长文本下的生成遗漏问题。

## 2. 当前状态分析 (Current State Analysis)
*   **当前生成模式**：在 `Generation.vue` 中，将用户选择的知识库全文直接拼接进 `prompt`，请求一次 OpenAI 接口，要求其直接返回 JSON。
*   **痛点**：大模型对超长文本的注意力机制（Attention）存在衰减，容易“偷懒”只提取开头几个功能，忽略长尾内容。

## 3. 架构设计与提议方案 (Proposed Changes & Architecture)

### 3.1 核心机制：Agent Loop（代理循环）
将 `Generation.vue` 中的单次 API 调用改造为 `while` 循环交互。
1.  **System Prompt** 告知大模型任务目标和 JSON Schema 格式，但不提供全量知识库。
2.  向大模型提供一个工具（Tool）：`search_knowledge_base(query: string)`。
3.  大模型根据需求，输出 `tool_calls`（例如先查询“系统包含哪些模块”，再分别查询“模块A的具体功能”）。
4.  前端执行本地检索逻辑，将检索结果以 `tool` 角色返回给大模型。
5.  大模型收集齐所有信息后，输出最终的 JSON 字符串。

### 3.2 工具定义与本地检索引擎
由于系统是纯前端架构，知识库内容存储在本地，我们将实现一个轻量的**前端文本分块与检索算法**：
*   **分块 (Chunking)**：在用户点击生成时，将选中的知识库 `content` 按换行符 `\n\n` 或特定长度切割成多个文本块 (Chunks)。
*   **检索 (Retrieval)**：当 AI 传入 `query`（如“虚拟拆装系统的功能”）时，系统对 `query` 进行分词，并使用简单的 TF-IDF 或关键字命中率算法，从 Chunks 中筛选出得分最高的前 N 个文本块返回给 AI。

### 3.3 Prompt 提示词重构
*   **去除全量注入**：Prompt 中不再包含 `${kbContent}`。
*   **赋予主动性**：在 Prompt 中增加指令：“你现在需要生成一份复杂的结构化文档。请务必先使用 `search_knowledge_base` 工具查询总体的模块列表，然后再针对每个模块查询其包含的功能用例和详细信息。在确认收集完毕所有必要信息前，请不断调用工具进行探索。只有当所有数据准备就绪时，才输出最终的 JSON 数据。”

### 3.4 涉及修改的文件
1.  **`src/views/Generation.vue`**:
    *   重构 `generateDoc` 方法，加入 OpenAI 的 `tools` 定义。
    *   实现 Agent 交互 `while` 循环处理逻辑。
    *   实现本地轻量级检索函数（如 `localKBSearch(content, query)`）。

## 4. 假设与决策 (Assumptions & Decisions)
*   **模型兼容性**：该方案强烈依赖于支持 `Function Calling / Tools` 能力的大模型（如 OpenAI GPT-4o / GPT-3.5-turbo，DeepSeek 等新模型均支持）。用户配置的 API 必须支持此特性。
*   **本地检索性能**：考虑到桌面端知识库一般为几万字级别的说明文档，纯 JS 进行正则/关键字匹配性能完全足够，无需引入复杂的向量数据库（Vector DB）。

## 5. 验证步骤 (Verification Steps)
1.  **检索测试**：单独调用 `localKBSearch` 函数，传入关键字，验证是否能准确返回知识库中的相关段落。
2.  **交互流测试**：在开发者工具 Console 中打印 AI 的消息记录，验证大模型是否发起了正确的 `tool_calls` 请求。
3.  **结果测试**：对比全量注入模式，验证通过 Function Calling 生成的 JSON 是否更加详尽，是否彻底解决了“只提取一个功能”的遗漏问题。
