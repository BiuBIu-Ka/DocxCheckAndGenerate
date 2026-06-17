# AI 文档生成 - 开放式工具调用 (MCP) 架构升级计划

## 1. 摘要 (Summary)
为了彻底解决单次全量文本生成导致的“内容遗漏”问题，并为未来扩展（如网页截图、外部数据查询等）打下基础，本项目将升级为 **Agent Function Calling（工具调用）** 架构。
更重要的是，系统将**开放工具管理能力**，允许用户自定义工具，并深度集成 **MCP (Model Context Protocol)** 服务。AI 将作为一个智能体，根据当前任务自动从用户配置的工具库（包括本地知识库检索、MCP外部工具）中选取并调用所需能力，逐步搜集信息并最终生成高质量的结构化文档。

## 2. 当前状态分析 (Current State Analysis)
*   **生成模式受限**：目前大模型只能被动接收拼接好的超长字符串，容易产生幻觉或丢失细节。
*   **扩展性不足**：系统目前是一个封闭环境，无法与外部系统（如浏览器截图、数据库查询等）进行交互。

## 3. 架构设计与提议方案 (Proposed Changes & Architecture)

### 3.1 核心机制一：开放式工具管理模块 (Tool Management)
新增一个“工具/插件管理”页面 (`Tools.vue`)，允许用户维护系统可用的工具：
1.  **内置工具管理**：默认提供 `search_knowledge_base`（知识库检索）工具，用户可自行调整该工具的描述提示词（让大模型更懂如何使用它）。
2.  **MCP 服务配置**：用户可在此页面配置 MCP 服务器（Model Context Protocol Servers）。例如配置基于 `puppeteer` 的截图 MCP 服务，或本地的 Python 脚本 MCP 服务。系统将自动连接并读取这些服务暴露的 Tools 列表。

### 3.2 核心机制二：MCP Client 深度集成
由于 Web 浏览器沙盒限制，MCP Client 将运行在 Electron 的 Node.js 主进程中（通过 IPC 与前端通信）：
*   **主进程 (`electron/main.ts`)**：集成官方的 `@modelcontextprotocol/sdk`，负责启动、连接和管理用户配置的各类 MCP 服务器（支持 stdio 方式运行本地命令）。
*   **预加载 (`preload.ts`)**：提供 `get-mcp-tools` 和 `call-mcp-tool` 等接口供 Vue 前端调用。

### 3.3 核心机制三：动态 Agent 交互循环 (Agent Loop)
重构 `Generation.vue` 中的生成逻辑，改为多轮对话的 Agent 架构：
1.  **收集可用工具**：在生成前，向系统获取【内置知识库检索工具】+【MCP服务器提供的所有工具】，并转换为 OpenAI 标准的 `tools` 数组结构。
2.  **开始 Agent Loop**：
    *   发送 System Prompt（包含文档生成任务目标和 JSON Schema）给大模型。
    *   大模型返回响应：
        *   **如果是 `tool_calls`**：判断工具名称。若是知识库检索，由前端执行本地分块检索；若是 MCP 工具，则通过 IPC 转发给 Electron 主进程的 MCP Client 执行。获取结果后，将结果追加到对话记录中，重新请求大模型。
        *   **如果是正常文本/JSON**：代表信息收集完毕，大模型已输出最终文档数据，跳出循环。

### 3.4 涉及修改的文件
*   **`src/views/Tools.vue` (新增)**: 用户工具和 MCP 服务管理界面。
*   **`src/router/index.ts` & `src/App.vue`**: 添加入口菜单。
*   **`electron/main.ts`**: 引入 MCP Client 核心逻辑，管理服务器生命周期，新增对应的 IPC Handlers。
*   **`src/utils/bridge.ts`**: 新增工具相关的接口桥接方法。
*   **`src/views/Generation.vue`**: 重构 `generateDoc` 方法，实现上述的 Agent `while` 循环逻辑。

## 4. 假设与决策 (Assumptions & Decisions)
*   **兼容性降级**：当以纯 Web 模式 (`npm run dev --host`) 运行时，MCP Client 无法启动本地子进程，此时系统将优雅降级，仅提供纯前端支持的内置工具（如本地知识库检索），MCP 相关的工具将被隐藏。
*   **MCP 标准化**：采用标准的 Model Context Protocol，这意味着未来不仅可以接入“截图”服务，任何社区开源的 MCP 插件（如 GitHub、数据库查询、文件读取等）都可以直接无缝接入本项目。

## 5. 验证步骤 (Verification Steps)
1.  **工具页面测试**：在“工具管理”页面添加一个测试 MCP 服务，验证系统能否成功解析出该服务提供的 Tools 列表。
2.  **内置 Agent 测试**：在不配置外部工具的情况下，测试大模型能否自主调用 `search_knowledge_base` 多次，提取出知识库中的所有功能点并生成 JSON。
3.  **MCP 联动测试**：配置一个简单的外部 MCP 工具（如返回当前时间的假服务），在文档生成的 Prompt 中要求大模型获取当前时间，观察 Agent 是否能成功跨进程调用 MCP 工具并将结果渲染进文档。
