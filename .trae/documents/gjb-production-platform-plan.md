# 基于大模型与GJB规则引擎的军工软件文档智能编制与审查平台 - 生产级实施计划

## 一、 摘要 (Summary)
本计划旨在将现有的原型系统彻底重构为生产级可用的平台。重点解决 UI 视觉体验差（黑底黑字问题）、模型接入受限（无法配置真实 API）、文档解析能力弱（仅支持文本切分）以及缺乏数据持久化的问题。我们将建立一个支持 GJB 438B 深度解析、Word 模板学习、多模型动态配置的现代化、美观、实用的生产级工具。

## 二、 现状分析 (Current State Analysis)
- **UI/UX**: 目前采用深色主题，配色方案（黑底黑字）导致可读性极差，布局不符合办公习惯。
- **模型层**: 核心逻辑为 Mock 数据，无法配置 DeepSeek、OpenAI 等真实模型。
- **解析层**: 缺乏对 Word (.docx) 和 PDF 的真实文件处理能力，无法满足 GJB 438B 规范的导入。
- **持久化**: 数据存储在内存中，不支持配置和规则的持久化。

## 三、 核心变更方案 (Proposed Changes)

### 3.1 前端 UI 彻底重构
- **视觉风格**: 切换至 **Ant Design 亮色主题**。采用清新的浅灰/白色背景，配合深蓝色主色调，确保文字清晰可读。
- **布局优化**: 
    - 重新设计侧边栏（Sider）和顶部面包屑（Breadcrumb）。
    - 页面采用卡片式布局（Card），增加阴影和圆角，提升质感。
- **响应式**: 适配不同分辨率，确保在主流显示器上均有良好表现。

### 3.2 真实模型配置中心
- **后端抽象**: 实现 `LLMClient` 类，兼容 OpenAI 协议。
- **配置管理**: 
    - 数据库存储模型名称、API Key、Base URL、模型版本（如 `deepseek-chat`, `gpt-4o`）。
    - 提供“测试连接”功能，实时反馈模型可用性。
- **动态调用**: 生成与审查任务根据用户选定的模型实时发送 API 请求。

### 3.3 GJB 438B 与 Word 模板解析
- **文件解析引擎**: 
    - 集成 `python-docx`：提取 Word 文档的章节结构、段落样式。
    - 集成 `PyMuPDF`：处理 PDF 版本的 GJB 规范。
- **规则学习逻辑**:
    - **438B 解析**: 提取标准中的章节要求（必须包含、可选包含）并入库。
    - **模板解析**: 用户上传 Word 模板后，系统自动识别其层级结构，将其作为后续生成的“骨架”。

### 3.4 真实文档生成与审查闭环
- **RAG 检索增强**: 使用解析出的 438B 规范作为上下文，增强模型生成的合规性。
- **生成逻辑**: 按照模板结构，调用配置好的 LLM 逐章节生成内容。
- **持久化存储**: 采用 SQLite 存储生成的文档草稿、审查出的问题清单，支持历史记录回溯。

## 四、 关键文件变更清单 (File Change List)

### 4.1 前端 (Vue 3 + Ant Design Vue)
- `client/src/theme/antd-theme.ts`: 定义亮色主题配置。
- `client/src/pages/AdminModelConfigPage.vue`: 重新设计，支持真实配置。
- `client/src/pages/DocumentGeneratePage.vue`: 增加模板上传和 438B 规范关联功能。
- `client/src/components/AppLayout.vue`: 修改整体色调和布局。

### 4.2 后端 (FastAPI + SQLAlchemy)
- `server/app/models/`: 定义 `ModelConfig`, `GjbRule`, `DocumentTemplate` 数据库模型。
- `server/app/core/llm_client.py`: 实现真实的 API 通信。
- `server/app/services/docx_parser.py`: 实现 Word 解析逻辑。
- `server/app/services/gjb_service.py`: 处理 438B 规范的语义化解析。

## 五、 假设与决策 (Assumptions & Decisions)
- **数据库**: 首选 **SQLite**，因为它无需额外部署服务，非常适合涉密单机或小型局域网部署。
- **协议**: 强制模型接入必须兼容 OpenAI 协议（DeepSeek/OpenAI 均原生支持）。
- **解析**: 优先支持 `.docx`，因为 GJB 模板主要以 Word 形式存在。

## 六、 验证步骤 (Verification Steps)
1. **视觉检查**: 确保页面不再是黑底黑字，切换为亮色专业风格。
2. **配置测试**: 在配置页面填写 DeepSeek API Key，点击测试连接，确保返回成功。
3. **解析测试**: 上传一个包含标题的 Word 文档，验证系统能否正确识别出章节列表。
4. **生成测试**: 基于上传的模板，选择配置的模型，生成一段内容并下载为 Word。
