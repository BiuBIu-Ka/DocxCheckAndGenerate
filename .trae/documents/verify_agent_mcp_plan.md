# 功能验证与测试计划 (Agent & MCP)

## 1. 当前状态分析
根据对代码库的探索（`src/views/Generation.vue`, `electron/main.ts`, `src/views/Tools.vue` 等），以下功能已经成功实现：
- **Agent Function Calling 循环**：在 `Generation.vue` 中已引入 `while (loopCount < 20)` 循环，能够接收大模型的 `tool_calls` 并回传工具执行结果。
- **本地知识库搜索工具**：大模型可以主动调用 `search_knowledge_base` 工具，根据关键字在本地选中的知识库中进行切片搜索并获取上下文。
- **MCP 服务集成**：在 `electron/main.ts` 中集成了 `@modelcontextprotocol/sdk`，并在前端通过 `connectMcpServer`、`getMcpTools` 和 `callMcpTool` 与主进程通信，实现了外部 MCP 工具的动态加载与调用。

## 2. 计划内容：验证与测试
由于核心开发工作已经完成，本阶段的计划主要集中在对系统的运行测试上。

### 步骤 1：启动本地开发环境
- 通过 `npm run dev -- --host` 在 Web 纯净模式下（或全环境）启动前端与 Vite 服务。
- 提供预览地址，便于在浏览器中进行交互测试。

### 步骤 2：环境配置与准备
- 在系统设置中配置兼容 OpenAI 格式的大模型接口（例如使用支持 Function Calling 的模型）。
- 创建或上传一份带有测试变量（如 `{#modules}`, `{{name}}` 等）的 DOCX 模板。
- 在“知识库”中添加一些较长的样本文本，以测试检索切分功能。
- 在“工具”页面添加一个测试用 MCP Server（如 `sqlite` 或本地的一个简单脚本服务），测试跨进程服务是否连通。

### 步骤 3：执行 Agent 循环与文档生成测试
- 发起文档生成请求。
- 观察控制台和生成过程，验证：
  1. AI 是否正确触发了 `search_knowledge_base` 搜索指令。
  2. 知识库搜索函数是否返回了切片后的正确文本。
  3. AI 是否能根据检索结果，循环多次，直至补全所有 DOCX 模板所需的 JSON 变量。
  4. 是否能成功调用 MCP 服务获取额外信息（如有）。
  5. 最终生成的 DOCX 文档是否包含完整的结构化数据。

## 3. 验收标准
- 运行过程中不再出现由于长文本导致的“提取不全”问题，AI 能够通过多轮搜索补全所需信息。
- 文档生成最终输出格式完整的 DOCX 文件，且内容符合知识库事实。
- 若测试发现 Bug，将就地修复并记录。