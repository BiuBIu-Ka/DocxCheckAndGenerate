
from app.core.llm_client import model_manager
from app.db.database import AsyncSessionLocal
from app.db.models import Document
import json

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

    async def generate_and_save(self, document_id: int, prompt: str, structure: list):
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

            sections = {}
            section_titles = self._flatten_structure(structure)
            knowledge_prompt = self._knowledge_prompt(doc)
            for title in section_titles:
                llm_prompt = (
                    f"请作为军工软件专家，为项目【{doc.project_name}】编写【{doc.doc_type}】模板下的章节：{title}。\n"
                    f"要求：符合GJB 438B规范，并严格遵守模板章节要求与术语要求。\n"
                    f"{knowledge_prompt}\n"
                    f"编制背景：{prompt}"
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
