
from app.core.llm_client import model_manager
from app.db.database import AsyncSessionLocal
from app.db.models import Document
from app.services.generation_context_service import generation_context_service
import json
import re

class GenerationOrchestrator:
    def _flatten_structure(self, structure: list) -> list[str]:
        titles: list[str] = []
        for item in structure or []:
            title = item.get("title")
            if title:
                titles.append(title)
            children = item.get("children") or []
            titles.extend(self._flatten_structure(children))
        return titles

    def _knowledge_prompt(self, doc: Document) -> str:
        rules = []
        terms = []
        try:
            rules = json.loads(doc.rules_json) if doc.rules_json else []
        except json.JSONDecodeError:
            rules = []
        try:
            terms = json.loads(doc.terms_json) if doc.terms_json else []
        except json.JSONDecodeError:
            terms = []

        rule_lines = [
            f"- 章节: {rule.get('sectionName')} | 要求: {rule.get('requirementType')} | 说明: {rule.get('description')}"
            for rule in rules[:10]
        ]
        term_lines = [
            f"- 标准术语: {term.get('standardName')} | 禁用词: {term.get('forbiddenTerms')}"
            for term in terms[:10]
        ]
        return "\n".join(
            [
                "模板知识约束：",
                *(rule_lines or ["- 无模板章节规则"]),
                "模板术语约束：",
                *(term_lines or ["- 无模板术语规则"]),
            ]
        )

    async def generate_and_save(self, document_id: int, prompt: str, structure: list, source_context: str = ""):
        async with AsyncSessionLocal() as session:
            doc = await session.get(Document, document_id)
            if not doc:
                return

            client = await model_manager.get_default_client()
            if not client:
                doc.status = "error"
                doc.review_summary = "未配置默认模型"
                await session.commit()
                return

            knowledge_prompt = self._knowledge_prompt(doc)
            placeholders = []
            if doc.placeholders_json:
                try:
                    placeholders = json.loads(doc.placeholders_json)
                except Exception:
                    pass

            if placeholders and doc.template_file_path:
                template_text = generation_context_service.extract_text(doc.template_file_path, doc.template_file_name)
                llm_prompt = (
                    f"请作为军工软件专家，为项目【{doc.project_name}】编写【{doc.doc_type}】。\n"
                    f"要求：符合规范，严格遵守知识与术语要求。\n"
                    f"{knowledge_prompt}\n\n"
                    f"这是一个包含 Jinja2 占位符和循环（如 {{% for %}}）的 Word 模板。模板结构与变量分布如下：\n"
                    f"```\n{template_text[:3000]}\n```\n\n" # Limiting template text size for context window
                    f"需要你提供数据的占位符变量包括：{placeholders}\n"
                    f"编制背景与用户要求：{prompt}\n"
                    f"参考资料如下：\n{source_context or '无额外参考资料'}\n\n"
                    f"请根据模板的 Jinja2 结构特征，自动推断所需的 JSON 数据结构（例如推断出某个变量是否应该是数组或对象）。\n"
                    f"**必须且仅输出一个合法的 JSON 对象**，JSON 的 key 应匹配所需的变量，不要包含 ```json 等 Markdown 标记，直接输出 JSON 文本。"
                )

                try:
                    content = await client.chat_completion([{"role": "user", "content": llm_prompt}])
                    # Clean markdown code block if model still outputs it
                    content = re.sub(r"^```json\s*", "", content.strip())
                    content = re.sub(r"^```\s*", "", content)
                    content = re.sub(r"\s*```$", "", content)
                    
                    # Test if it's valid JSON
                    json.loads(content)
                    
                    doc.content_json = content
                    doc.review_summary = f"基于模板占位符的 JSON 数据生成完成。"
                except Exception as e:
                    doc.content_json = "{}"
                    doc.review_summary = f"生成失败: {str(e)}"
                
                doc.status = "completed"
                await session.commit()
                return

            sections = {}
            section_titles = self._flatten_structure(structure)
            for title in section_titles:
                llm_prompt = (
                    f"请作为军工软件专家，为项目【{doc.project_name}】编写【{doc.doc_type}】模板下的章节：{title}。\n"
                    f"要求：符合GJB 438B规范，并严格遵守模板章节要求与术语要求。\n"
                    f"{knowledge_prompt}\n"
                    f"编制背景与用户要求：{prompt}\n"
                    f"参考资料如下，可用于生成需求规格说明书、设计说明书等正式文档：\n{source_context or '无额外参考资料'}"
                )

                try:
                    content = await client.chat_completion([{"role": "user", "content": llm_prompt}])
                    sections[title] = content
                except Exception as e:
                    sections[title] = f"生成失败: {str(e)}"

            doc.content_json = json.dumps(sections, ensure_ascii=False)
            doc.review_summary = f"模板生成完成，共处理 {len(section_titles)} 个章节。"
            doc.status = "completed"
            await session.commit()

generation_orchestrator = GenerationOrchestrator()
