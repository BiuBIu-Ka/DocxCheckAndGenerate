# 计划：基于占位符解析的模板高保真填充与生成闭环重构

## 一、 当前状态与痛点分析
1. **生成效率低**：当前 AI 是基于章节结构逐个循环生成的，如果有 20 个章节，就需要轮询 20 次大模型，耗时极长。
2. **排版格式易丢失**：当前逻辑是提取标题后生成 Markdown，再将 Markdown 强行转换并插入到 Word 中。即使使用了格式转换引擎，也无法 100% 还原用户模板中预设的复杂表格、特定字体、页眉页脚及缩进等精细排版。
3. **缺乏上下文融合**：AI 只看到了“标题”，并没有看到模板中该章节原有的表头或范例说明，导致生成内容经常脱离模板原本的排版容器。
4. **动态数量无法自适应**：当参考资料中有 10 个功能点，而模板中只预留了一个功能点的结构时，当前的简单文本插入无法自动扩充结构。

## 二、 改造目标与方案设计
采用 **“解析器（docxtpl） + 占位符/循环语句 + AI 提取结构化数据”** 的业务逻辑，彻底重构生成闭环：
1. **模板规范进阶**：用户在 `.docx` 模板中不仅可以使用基础占位符（如 `{{ 项目背景 }}`），还可使用 **Jinja2 循环语法**处理动态数据。
    *   例如，针对多个功能点，可在模板中写入 `{% tr for item in features %}`（用于表格行循环）或 `{% p for item in features %}`（用于段落循环）。
2. **模板 Schema 提取**：后端在模板上传时，不仅提取占位符变量，还会提取包含占位符的原始文本片段作为 Schema 结构。
3. **单次并发与数据推断**：触发生成时，将“模板的 Jinja2 结构特征 + 用户要求 + 参考资料”一次性打包提交给 AI。大模型会根据 Jinja 语法自动推断所需的 JSON 数据结构（例如推断出 `features` 需要是一个数组），并一次性提取、返回包含 10 个功能点的 JSON 对象。
4. **高保真动态渲染**：生成完成后，使用 `docxtpl` 直接将 JSON 数据渲染进原生 `.docx` 模板中。不仅 **100% 完美继承**底层排版，而且能够自动循环扩充模板中的表格行和段落。

## 三、 具体修改步骤与文件范围

### 1. 依赖与数据库更新
*   **`server/requirements.txt` / `server/pyproject.toml`**：确保已包含 `docxtpl`。
*   **`server/app/db/models.py`**：新增字段 `placeholders_json = Column(Text)`，用于持久化存储提取出的模板变量和结构提示。
*   **`server/app/schemas.py`**：新增 `placeholdersJson` 字段。
*   **`server/app/db/database.py`**：在 `ensure_sqlite_schema` 中补充 `placeholders_json` 的自动补列。

### 2. 解析器升级 (模板上传)
*   **`server/app/api/routes/documents.py` & `docx_parser.py`**：
    *   在上传保存 `.docx` 模板时，引入 `docxtpl.DocxTemplate(path).get_undeclared_template_variables()` 提取所有占位符变量。
    *   提取文档中的纯文本（包含 `{{ }}` 和 `{% %}` 标签），存为 `placeholders_json`（包含变量集和模板结构片段），返回给前端。

### 3. AI 生成编排器重构
*   **`server/app/core/generation_orchestrator.py`**：
    *   修改 `generate_and_save` 核心逻辑：
        *   **基于模板渲染生成**：将模板包含 Jinja 标签的文本内容发给大模型，告知大模型“这是一个 Jinja2 模板”。
        *   要求大模型根据参考资料 `source_context`，提取对应内容并**严格输出匹配该 Jinja2 结构的 JSON 数据**（如发现循环标签，则输出对应的 JSON 数组）。
        *   将返回的 JSON 直接存入 `content_json`。

### 4. 导出逻辑高保真适配
*   **`server/app/api/routes/documents.py`** (`export-docx` 接口)：
    *   如果 `content_json` 内为生成好的 JSON 键值对，则直接实例化 `docxtpl.DocxTemplate(template_path)`，调用 `.render(content_map)`。
    *   `docxtpl` 会自动根据 JSON 数组进行表格/段落的循环复制，并在底层操作 XML 文本节点，实现导出的 Word 格式与原模板**真·100% 一致**。

### 5. 前端展示适配
*   **`client/src/pages/DocumentWorkspacePage.vue`**：
    *   在“模板维护”区域新增 **“模板变量与动态循环”** 卡片，展示当前模板需要 AI 填充的变量清单。
    *   在帮助说明中补充“占位符与循环语句模板规范”，提供 `{{ 变量 }}` 和 `{% p for item in items %}` 的标准示例，指引用户如何制作支持动态扩充数量的高级模板。

## 四、 验证步骤
1.  准备一个 `.docx` 模板，包含静态占位符 `{{ 项目名称 }}`，以及一个动态循环表格：表头下方使用 `{% tr for item in features %}`，表格单元格内使用 `{{ item.name }}` 和 `{{ item.desc }}`。
2.  在前端上传该模板，验证系统是否识别出相应变量。
3.  上传包含 10 个功能点介绍的参考资料，触发生成。
4.  检查大模型是否一次性返回了包含 `features` 数组（10条数据）的 JSON。
5.  下载生成的 `.docx`，验证表格是否完美扩充为了 10 行，且原有的表格边框、底纹、对齐方式与字体 **保持 100% 一致**。