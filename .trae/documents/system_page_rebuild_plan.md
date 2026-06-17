# 系统页面整体重构计划

## 一、Summary

本次重构以现有业务逻辑为基础，不推翻“模板 + 知识库 + 工具 + Agent Loop + 预览后导出”的主链路，而是把当前分散、耦合、信息不透明的页面体系重构为“生成中台”。

重构后的默认入口仍为生成，但会升级成三栏工作台：左侧负责生成配置与输入，中间完整展示每轮 AI / tool call / patch / MCP / 错误 / 耗时等执行过程，右侧负责结构化预览、渲染体检和导出；其余页面围绕模板、知识库、工具、模型配置形成统一资产管理体系。

用户已明确的产品决策如下：
- 默认首页形态：生成中台
- 过程开放程度：全量调试默认开放
- 生成页主布局：三栏工作台

## 二、Current State Analysis

### 1. 当前前端结构

已确认的现有入口与页面：
- `src/App.vue`：仅有基础左侧菜单 + `router-view`
- `src/router/index.ts`：同步引入页面组件，无懒加载，无 404，无运行态页面
- `src/views/Generation.vue`：承担输入、Agent Loop、工具调度、patch 合并、结构化预览、DOCX 导出等几乎全部核心逻辑
- `src/views/Templates.vue`：模板列表、变量解析、规则编辑、跳转生成
- `src/views/Knowledge.vue`：知识库列表、文本编辑、文件提取
- `src/views/Tools.vue`：内部工具管理 + MCP 服务管理
- `src/views/Settings.vue`：模型配置
- `src/utils/bridge.ts`：设置存储、模板文件、知识文件、导出、MCP 调用全部集中在一个桥接文件中
- `src/utils/internalTools.ts`：内部工具定义与执行逻辑

### 2. 当前主要问题

#### 页面层面
- `src/App.vue` 的布局过于基础，没有系统级状态、快捷上下文、运行状态、任务入口、错误兜底。
- `src/router/index.ts` 只有 5 个主页面，没有懒加载、404、运行记录页。
- 页面之间只是“并排存在”，不是围绕一条完整业务链协同工作。

#### 状态层面
- 全站通过 `getSettings()/saveSettings()` 共享一个无类型大对象，存在互相覆盖风险。
- `src/views/Settings.vue` 当前直接调用 `saveSettings({ apiUrl, apiKey, modelName })`，会覆盖其他配置字段，是必须优先修复的问题。
- 没有全局状态管理，运行态与配置态混在页面局部 `ref` 中，切页后无法统一表达系统状态。

#### 生成链路层面
- `src/views/Generation.vue` 职责过载：UI、Prompt、OpenAI 请求、Internal Tools、MCP、patch、canonical structure、render data、导出混在一起。
- 虽然已经有“预览后导出”的两段式流程，但执行过程只显示摘要，无法满足“每轮 AI 与工具细节全部放开”的要求。
- 当前没有专门的运行记录模型，生成过程的 logs / patch / tool result 不能被结构化沉淀为任务历史。

#### 资产管理层面
- 模板、知识库、工具、模型配置虽然已经拆成独立页面，但仍直接读写 settings 的裸结构，缺少类型和 service 抽象。
- `Templates.vue` 的变量提取逻辑与 `Generation.vue` 的模板结构解析逻辑分散，后续容易漂移。
- `Knowledge.vue` 目前是“文件名列表 + 一个大文本框”，无法把来源、块级摘要、引用价值展示清楚。
- `Tools.vue` 当前支持内部工具和 MCP，但运行态连接信息与工具调试信息没有形成可视化工作流。

## 三、Assumptions & Decisions

### 1. 产品边界

本次重构范围包括：
- 前端整体信息架构与导航重构
- 生成页三栏工作台重构
- 模板 / 知识库 / 工具 / 模型配置页面重构
- 运行态日志、AI 调用、tool call、patch、MCP 工具执行过程可视化
- 全局状态与配置访问方式重构
- 基于现有逻辑补齐运行记录、调试能力、错误兜底和体验断点

本次不做的事情：
- 不新增后端服务
- 不改变已有 DOCX 生成引擎（仍使用 `docxtemplater`）
- 不改变已有 canonical structure 核心方向
- 不改成特定模板专用逻辑

### 2. 兼容性决策

- 保持 Web 与 Electron 双环境兼容。
- 保持现有主路由语义，`/generation` 仍然可直接访问。
- 保持模板页点击“去生成”时通过 `templateId` 进入生成页的方式。
- 对现有 settings 数据做兼容迁移，不要求用户手动重配全部数据。

### 3. 技术决策

- 新增 `pinia` 作为全局状态管理，统一承载配置态、运行态和页面共享状态。
- 保留 `Element Plus` 作为主 UI 组件库，不引入新的重量级 UI 框架。
- 引入明确的领域分层：`types`、`stores`、`services`、`features/generation`、`components/*`。
- `Generation.vue` 重构为“页面容器 + 子组件 + store + service”，不再承载核心纯逻辑。
- 运行记录默认保存最近若干次（建议 20 次）生成任务，用于回看 AI 调用过程与问题排查。

### 4. 体验决策

- 默认直接进入“生成中台”，而不是先进入总览首页。
- 生成页采用三栏布局：
  - 左栏：模板 / 知识库 / 输入 / 执行控制
  - 中栏：AI 运行流、轮次、tool call、patch、MCP、错误、指标
  - 右栏：结构化结果预览、渲染树摘要、DOCX 风险体检、导出
- 调试信息默认开放，不藏在深层弹窗里；但仍提供折叠、筛选和复制能力，防止信息噪声失控。

## 四、Proposed Changes

### A. 基础架构与类型层

#### 目标
把“裸 settings + 页面直接读写 + 单文件桥接”重构为有类型、有入口、有共享状态的基础架构。

#### 修改文件

1. `package.json`
- 新增 `pinia` 依赖。
- 保持现有构建方式不变。

2. `src/main.ts`
- 挂载 `pinia`。
- 保留 `router` 与 `ElementPlus` 初始化。

3. 新增 `src/types/app.ts`
- 定义 `AppSettings`、`TemplateProfile`、`KnowledgeBaseRecord`、`McpServerConfig`、`GenerationRunRecord`、`GenerationTimelineEvent`、`GenerationPatchRecord` 等核心类型。
- 替代当前各页面中的 `any` 结构。

4. 新增 `src/stores/appConfig.ts`
- 负责加载、缓存、局部更新全局设置。
- 提供 `loadSettings()`、`updateSettings(partial)`、`replaceSettings(next)`、`ensureMigrated()`。
- 统一暴露 `templates`、`knowledgeBases`、`internalTools`、`mcpServers`、`modelConfig`。

5. 新增 `src/stores/generationWorkbench.ts`
- 负责生成中台的运行态。
- 状态包含：当前模板、已选知识库、输入内容、运行状态、步骤状态、时间线、metrics、最终预览、错误、最近任务。
- 提供 `startRun()`、`appendEvent()`、`applyPatch()`、`finishRun()`、`resetWorkbench()` 等动作。

6. 新增 `src/services/settingsService.ts`
- 对 `bridge.ts` 的 settings 读写封装为强类型接口。
- 提供局部 merge 更新，彻底替代页面直接 `getSettings()+saveSettings()` 的模式。
- 负责旧数据兼容迁移：
  - 单模板迁移到 `templates[]`
  - 旧 `templateVariables` 迁移到模板对象

7. 新增 `src/services/runHistoryService.ts`
- 用于保存和读取最近任务记录。
- 存储最近 20 次生成任务的概要和关键调试数据。
- 运行记录不写回 settings 主对象，避免膨胀。

#### 为什么这样做
- 当前 settings 覆盖风险已真实存在。
- 后续“AI 调用全过程可视化”必须有统一运行态模型，不能继续依赖零散 `ref`。

#### 实现要点
- `bridge.ts` 暂不拆散宿主能力，但由新 service 对外收口。
- 页面层禁止再直接调用裸 `getSettings()` 写回整个 settings。

### B. 路由与应用壳重构

#### 目标
把当前“左侧菜单 + 右侧空白容器”升级成真正可承载工作流的系统壳。

#### 修改文件

1. `src/router/index.ts`
- 改为懒加载路由。
- 保留 `/generation`、`/templates`、`/knowledge`、`/tools`、`/settings`。
- 新增 `/runs` 页面用于任务记录和问题复盘。
- 新增 `/:pathMatch(.*)*` 404 页面。
- 根路径 `/` 重定向到 `/generation`。

2. `src/App.vue`
- 重构为应用级工作台外壳。
- 左侧导航分组：
  - 生成中台
  - 任务记录
  - 模板中心
  - 知识库
  - 工具与 MCP
  - 模型配置
- 顶部增加全局状态区：
  - 当前环境（Web / Electron）
  - 当前模型
  - 模板数量 / 知识库数量 / 工具数量
  - 最近一次运行状态
- 增加全局快捷入口：
  - 新建生成
  - 查看最近任务
  - 去模板中心

3. 新增 `src/views/Runs.vue`
- 展示最近任务列表、运行状态、模板、知识库、耗时、错误摘要。
- 点击任务可查看完整时间线和最终预览摘要。

4. 新增 `src/views/NotFound.vue`
- 提供兜底返回入口，避免空白路由。

#### 为什么这样做
- 用户要求“整个系统页面重构”，仅改某个页面不够。
- 任务记录页能承接“每轮 AI 过程放开”的结果沉淀，而不是只在当前会话中瞬时显示。

### C. 生成中台重构

#### 目标
把 `src/views/Generation.vue` 从“超大单文件”拆成“页面容器 + 三栏组件 + 运行 store + 纯逻辑模块”，并完整开放 AI 与工具过程细节。

#### 修改文件

1. 重写 `src/views/Generation.vue`
- 仅保留页面装配职责。
- 使用三栏布局组织子组件。
- 从 `generationWorkbench` store 读取全部页面状态。

2. 新增 `src/components/generation/GenerationControlPanel.vue`
- 左栏控制面板。
- 功能包含：
  - 模板选择与模板元信息展示
  - 知识库多选与已选摘要
  - 全局系统背景输入
  - 补充资料输入
  - 注意事项输入
  - 执行按钮 / 重置按钮
  - 当前生成前检查（模型是否配置、模板是否存在、知识库是否为空）

3. 新增 `src/components/generation/GenerationTimelinePanel.vue`
- 中栏运行流。
- 按时间顺序展示：
  - 每轮 AI 请求
  - assistant 消息
  - tool call
  - internal tool 执行结果
  - MCP tool 执行结果
  - `submit_partial_data` patch 明细
  - `finish_generation`
  - 错误与警告
- 每条事件展示：
  - 类型
  - 名称
  - 时间戳
  - 耗时
  - 摘要
  - 展开原文
  - 复制按钮

4. 新增 `src/components/generation/GenerationMetricsBar.vue`
- 展示运行指标：
  - 轮次
  - tool call 次数
  - patch 次数
  - MCP 调用次数
  - 耗时
  - 最终字段数 / 节点数 / 字符数

5. 新增 `src/components/generation/GenerationPreviewPanel.vue`
- 右栏结果面板。
- 分区包含：
  - Canonical Structure 预览
  - 模板渲染树摘要
  - 渲染风险体检
  - 导出按钮
  - 复制 JSON
- 预览默认展示结构化树摘要 + 可切换到原始 JSON。

6. 新增 `src/components/generation/GenerationEventDetailDrawer.vue`
- 点击中栏任意事件时展开详情。
- 对 AI 请求展示：
  - prompt 原文
  - tool schema 摘要
  - 模型名
- 对 tool call 展示：
  - 参数
  - 返回值
  - 错误
- 对 patch 展示：
  - operation
  - path
  - value
  - 是否重复 / 是否被拦截

7. 新增 `src/features/generation/promptBuilder.ts`
- 负责生成 prompt。
- 从页面中迁出模板说明、变量说明、知识库摘要、注意事项、canonical schema hint 组装逻辑。

8. 新增 `src/features/generation/templateSchema.ts`
- 迁出并统一：
  - `parseTemplateSchema`
  - `describeTemplateLoops`
- 后续模板中心和生成页共享该模块。

9. 新增 `src/features/generation/canonicalData.ts`
- 迁出并统一：
  - `applyPatchOperation`
  - `parsePatchPath`
  - `mergeObjectFields`
  - `sanitizeForDocx`
  - `inspectRenderData`
  - `buildRenderDataFromCanonical`
  - `safeAppendArray`

10. 新增 `src/features/generation/agentRunner.ts`
- 封装 Agent Loop。
- 输入：
  - 模型配置
  - prompt
  - internal tools
  - MCP tools
  - patch handlers
- 输出：
  - 时间线事件
  - 运行 metrics
  - 完整 canonical data
  - 最终错误

11. 新增 `src/features/generation/toolRegistry.ts`
- 统一注册 internal tool、patch tool、finish tool、MCP tool。
- 统一工具命名清洗、查找、执行分发逻辑。

#### 为什么这样做
- `Generation.vue` 是当前全站最重、最关键也最脆弱的页面，必须拆。
- 用户明确要求“每轮和 ai 的调用以及工具细节全部放开”，这需要结构化时间线模型，而不是只追加日志字符串。

#### 实现要点
- 当前已有的 canonical structure、patch、防污染、防爆量逻辑继续保留，但全部迁出页面。
- 当前“两段式流程：先生成预览，再导出 DOCX”继续保留。
- 中栏默认显示所有轮次，支持按事件类型筛选。

### D. 模板中心重构

#### 目标
让模板页从“简单列表 + 弹窗”升级为可管理模板资产、变量说明、模板结构和生成入口的中心页。

#### 修改文件

1. 重构 `src/views/Templates.vue`
- 拆为列表区 + 详情编辑区布局，不再完全依赖单个弹窗承载全部信息。
- 每个模板展示：
  - 模板名称
  - 文件名 / 路径
  - 变量数
  - 最后更新时间
  - 是否可用
  - 去生成

2. 新增 `src/components/templates/TemplateListPanel.vue`
- 管理模板列表、筛选、快速操作。

3. 新增 `src/components/templates/TemplateEditorPanel.vue`
- 管理模板基础信息、规则、变量说明与示例。

4. 新增 `src/components/templates/TemplateSchemaPreview.vue`
- 展示解析出的：
  - 顶层变量
  - 循环层级
  - 变量说明缺失项

5. 新增 `src/services/templateService.ts`
- 负责：
  - 模板列表读写
  - 模板 buffer 保存
  - 模板变量提取
  - 模板结构解析
  - 旧模板数据迁移

#### 为什么这样做
- 模板是生成闭环的第一资产，必须可见“这个模板需要什么结构”。
- 当前变量提取与循环结构解析分散在不同页面，需要统一。

#### 实现要点
- `saveTemplateBuffer(result.buffer, result.path)` 改为按模板 `id` 存储。
- 模板对象补充字段：
  - `id`
  - `name`
  - `path`
  - `fileName`
  - `standardText`
  - `variables`
  - `updatedAt`

### E. 知识库页面重构

#### 目标
让知识库页面从“纯文本堆积区”升级为“知识资产页”，能看见来源、规模和可用于生成的内容范围。

#### 修改文件

1. 重构 `src/views/Knowledge.vue`
- 改为左侧知识库列表 + 中间正文编辑 + 右侧来源与统计侧栏。
- 当前选中知识库展示：
  - 名称
  - 文件来源列表
  - 文本大小
  - 分段数量（按现有逻辑分段计算）
  - 最近更新时间

2. 新增 `src/components/knowledge/KnowledgeListPanel.vue`
- 管理知识库列表与创建/删除/切换。

3. 新增 `src/components/knowledge/KnowledgeEditorPanel.vue`
- 管理正文编辑、上传文件、保存状态提示。

4. 新增 `src/components/knowledge/KnowledgeStatsPanel.vue`
- 展示来源文件、字符数、段落数、建议检索粒度。

5. 新增 `src/services/knowledgeService.ts`
- 负责：
  - 读写知识库
  - 文件导入
  - 文本统计
  - 来源摘要构建

#### 为什么这样做
- 用户在生成时非常依赖知识库，但当前知识库页几乎看不到质量和规模。
- 页面即使暂不升级底层 chunk 存储，也需要先把“来源”和“统计”可视化出来。

#### 实现要点
- 本次先兼容现有 `content + files` 数据结构。
- 右侧统计通过运行时计算得到，不强制先做数据结构迁移。
- 删除文件标签时继续保留“不会自动删除正文”提示，但以显著 warning 呈现。

### F. 工具与 MCP 页面重构

#### 目标
把工具页从“静态配置页”升级为“工具资产 + MCP 连接 + 调试可视化”的控制台。

#### 修改文件

1. 重构 `src/views/Tools.vue`
- 改为双 tab 或双分区布局：
  - 内部工具
  - MCP 服务
- 每个分区都增加状态、错误提示、可视化摘要。

2. 新增 `src/components/tools/InternalToolsPanel.vue`
- 展示内部工具清单、启用状态、参数 Schema、HTTP 配置。
- 支持 JSON 校验提示，而不是静默忽略。

3. 新增 `src/components/tools/McpServersPanel.vue`
- 展示 MCP 服务列表、连接状态、已加载工具数、最近错误。

4. 新增 `src/components/tools/McpToolList.vue`
- 展示每个 MCP 服务加载出的工具列表。

5. 新增 `src/components/tools/ToolCallPreviewCard.vue`
- 用于展示某工具在最近一次生成中的调用次数和最近结果摘要。
- 该组件在工具页和生成中台时间线侧边都可复用。

6. 新增 `src/services/toolService.ts`
- 负责：
  - internal tools 读写
  - MCP 配置读写
  - 参数 JSON 校验
  - 工具摘要生成

#### 为什么这样做
- 用户明确要求“工具放开”“MCP 更健全”“每轮工具细节全部放开”。
- 工具页不能只是录配置，必须能反映运行态能力。

#### 实现要点
- 本次仍保留“生成时建立 MCP 工具注册”的模式，但工具页需要可测试连接与展示已加载工具。
- 保存行为改为：
  - 内部工具：显式保存或防抖保存
  - MCP 配置：显式保存，避免每次输入都弹成功提示

### G. 模型配置页面重构

#### 目标
修复覆盖风险，并让模型配置页具备“配置 + 连接验证 + 高级参数”的完整能力。

#### 修改文件

1. 重构 `src/views/Settings.vue`
- 改为更完整的模型配置页。
- 展示字段：
  - API URL
  - API Key
  - 模型名称
  - 温度
  - 最大轮次
  - 调试显示开关（默认开启）
- 增加“测试连接”按钮。
- 增加“只保存模型配置，不覆盖其他数据”的实现。

2. 新增 `src/components/settings/ModelSettingsForm.vue`
- 承载表单和校验。

3. 新增 `src/services/modelConfigService.ts`
- 负责模型配置读写、默认值、连接测试。

#### 为什么这样做
- 当前这里是已知风险点。
- 模型配置是生成中台的基础，没有连接验证会导致错误发现过晚。

### H. 样式系统与视觉方向

#### 目标
把当前基础 Element 样式升级为“工业感中台风格”，强化系统感、调试感和可读性。

#### 修改文件

1. 重构 `src/style.css`
- 定义全局 CSS 变量：
  - 背景色
  - 面板色
  - 边框色
  - 强调色
  - 成功/告警/错误色
- 定义统一间距、圆角、阴影、滚动条样式。

2. 在 `App.vue` 与各新组件中统一使用：
- 深色偏中性底 + 高亮状态色
- 强调信息密度与扫描效率
- 卡片层次清晰，避免“纯表单堆叠感”

#### 视觉方向
- 风格：工业化生成中台，不做花哨营销站
- 特点：
  - 信息密度高但分层清晰
  - 过程可追踪、结果可对照、错误可定位
  - 重点突出“AI 在干什么”和“当前数据会渲染成什么”

## 五、Implementation Order

按以下顺序执行，避免重构过程中页面长期不可用：

1. 基础设施先行
- 更新 `package.json`
- 接入 `pinia`
- 新建 `types`、`services`、`stores`
- 完成 settings 兼容迁移与局部更新机制

2. 壳层与路由
- 重构 `App.vue`
- 重构 `router/index.ts`
- 新增 `Runs.vue` 与 `NotFound.vue`

3. 生成链路解耦
- 提取 `promptBuilder.ts`
- 提取 `templateSchema.ts`
- 提取 `canonicalData.ts`
- 提取 `toolRegistry.ts`
- 提取 `agentRunner.ts`
- 重写 `Generation.vue` 与生成相关组件

4. 资产页面重构
- 重构 `Templates.vue` 及其组件
- 重构 `Knowledge.vue` 及其组件
- 重构 `Tools.vue` 及其组件
- 重构 `Settings.vue`

5. 运行记录闭环
- 接入 `runHistoryService`
- 在生成中台与 `Runs.vue` 中打通任务回看

6. 全局视觉收口
- 重构 `src/style.css`
- 统一布局与状态色
- 清理旧页面残留样式

## 六、Verification Steps

### 1. 构建验证
- 执行 `npm run build`
- 确认 TypeScript、Vue 编译、Vite 构建通过

### 2. 关键页面验证
- 打开 `/generation`，确认三栏工作台正常显示
- 打开 `/templates`，确认模板列表、结构预览、去生成入口正常
- 打开 `/knowledge`，确认文件上传、统计、保存正常
- 打开 `/tools`，确认内部工具编辑、MCP 配置、连接测试正常
- 打开 `/settings`，确认不会覆盖其他配置且支持连接测试
- 打开 `/runs`，确认最近任务可查看
- 打开错误路由，确认 404 页面正常

### 3. 生成链路验证
- 选择模板、知识库并发起生成
- 确认中栏能看到：
  - 每轮 AI 请求
  - 每次 tool call
  - 每次 patch
  - MCP 调用
  - 错误与告警
- 确认右栏能看到：
  - canonical structure 预览
  - 体检结果
  - 导出入口

### 4. 回归验证
- 模板页“去生成”仍能带 `templateId`
- Web 模式下模板 buffer 按模板 id 读取正常
- Electron 模式下模板读取、保存文档、MCP 连接不回退
- 旧 settings 数据可正常迁移并继续使用

### 5. 验收标准
- 全站形成统一工作流，而不是孤立页面堆叠
- 生成页默认公开完整 AI / 工具 / patch 过程
- 配置写入不再互相覆盖
- 生成结果仍保持“先预览，后导出”的双阶段流程
- 不引入模板专用硬编码逻辑
