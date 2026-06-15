# AI 驱动的文档生成工具开发计划

## 1. 摘要 (Summary)
本项目旨在开发一款基于 Electron + Vue 3 + Node.js 的桌面端应用，用于根据用户提供的标准、参考资料和 DOCX 模板，通过 AI 自动生成并导出排版完美还原的 Word 文档。应用采用“模板标记语言”（如 `docxtemplater`）技术，不仅能 100% 保留复杂的文档样式，还能通过 AI 输出结构化数据（JSON）来处理模板中如“功能点”等动态、不定量的循环内容。

## 2. 当前状态分析 (Current State Analysis)
当前为从零开始的全新项目（空工作区）。用户已明确技术栈要求及核心架构方向。

## 3. 架构设计与提议方案 (Proposed Changes & Architecture)

### 3.1 技术栈 (Tech Stack)
*   **前端**: Vue 3 + Vite + TailwindCSS (或 Element Plus 等 UI 库)
*   **客户端框架**: Electron
*   **后端/本地服务**: Node.js (Electron Main Process)
*   **核心依赖**: 
    *   `docxtemplater` + `pizzip` (用于 DOCX 模板解析与生成)
    *   `electron-store` (用于本地存储配置、规则和模板路径)
    *   `openai` SDK (用于接入兼容 OpenAI 格式的各类大模型 API)

### 3.2 核心功能模块划分 (Core Modules)

**A. 配置管理模块 (Configuration Module)**
*   **UI 页面**: 提供专门的设置页面。
*   **功能**: 用户可自行输入和维护 AI 模型的 API URL、API Key、模型名称（Model Name）等连接信息。配置将持久化保存在本地。

**B. 规则与模板管理模块 (Rules & Templates Module)**
*   **UI 页面**: 模板及标准维护页面。
*   **功能**:
    *   上传和管理 DOCX 模板文件。
    *   维护生成标准或规则说明文本。
    *   **关键技术**: 后端读取模板文件，自动解析出模板中包含的变量和循环标记（例如 `{#features} {title} {/features}`），从而动态推导出 AI 需要生成的 JSON 数据结构 (Schema)。

**C. 文档生成工作区 (Document Generation Workspace)**
*   **UI 页面**: 主操作界面。
*   **功能**:
    *   选择已上传的模板和标准。
    *   上传或直接输入参考资料及额外注意事项。
    *   一键触发 AI 生成。
*   **生成工作流 (Data Flow)**:
    1.  **构造 Prompt**: 组合“参考资料” + “规则标准” + “注意事项” + “提取的模板数据结构要求（强制 AI 输出对应结构的 JSON）”。
    2.  **请求 AI**: 调用用户配置的 AI 模型服务，获取 JSON 格式的结构化数据。AI 会根据参考资料的丰富程度，自行判断循环数组（如功能点）的长度。
    3.  **渲染文档**: 将 AI 返回的 JSON 数据与 DOCX 模板交给 `docxtemplater` 进行渲染。
    4.  **导出**: 渲染完成后，保存为新的 DOCX 文件，100% 还原模板中的样式、字体、边距等。

### 3.3 数据流向 (Data Flow)
`[用户输入参考资料] -> [系统提取模板变量Schema] -> [组合Prompt] -> [AI 模型] -> [返回JSON] -> [docxtemplater + 模板] -> [输出完美的DOCX]`

## 4. 假设与决策 (Assumptions & Decisions)
*   **假设**: 用户配置的 AI 模型具备基本的 JSON 格式输出能力（推荐配置为支持 JSON Mode 的模型）。
*   **决策**: 放弃“完全从零重绘 DOCX”的高风险方案，采用**基于模板的标记填充**方案。用户需在 DOCX 模板中使用特定的标签（例如 `{name}`，以及循环 `{#list}...{/list}`）来指定内容位置，从而完美保留原有文档的复杂样式。
*   **决策**: 选择 Electron 而非纯 Web 方案，是为了满足后续可能涉及的系统级操作（如用户手册相关的自动截图工具、本地文件批量处理等）。

## 5. 验证步骤 (Verification Steps)
1.  **环境验证**: 成功启动 Electron + Vue 3 开发环境。
2.  **配置验证**: 在设置页配置大模型 API，并能成功发送测试请求及接收响应。
3.  **模板解析验证**: 编写一个包含循环标签（如多个功能点）的测试 DOCX 模板，系统能正确识别所需变量。
4.  **全链路验证**: 提供一段包含 3 个功能点的参考文本，触发生成，验证最终导出的 DOCX 文件中是否成功生成了 3 个功能点段落，且样式与模板完全一致。