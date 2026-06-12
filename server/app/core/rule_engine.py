
from app.db.database import AsyncSessionLocal
from app.db.models import GjbRule
from app.schemas import ReviewIssue
from sqlalchemy.future import select
import json


class RuleEngine:
    def _normalize(self, text: str) -> str:
        return (text or "").replace(" ", "").replace("\n", "").lower()

    def _evaluate_rules(self, rules: list[dict], content: str) -> list[ReviewIssue]:
        normalized_content = self._normalize(content)
        issues = []
        for index, rule in enumerate(rules, start=1):
            if not rule.get("isActive", True):
                continue
            section_name = rule.get("sectionName", "").strip()
            requirement_type = rule.get("requirementType", "mandatory")
            description = rule.get("description", "")
            if requirement_type == "mandatory" and self._normalize(section_name) not in normalized_content:
                issues.append(
                    ReviewIssue(
                        id=f"template-rule-{index}",
                        title=f"缺少必备章节：{section_name}",
                        severity="high",
                        rule="GJB-STRUCTURE",
                        suggestion=description or f"请补充章节：{section_name}",
                        location="全文",
                    )
                )
        return issues

    async def evaluate_db(self, doc_type: str, content: str) -> list[ReviewIssue]:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(GjbRule).where(GjbRule.doc_type == doc_type, GjbRule.is_active == True)
            )
            rules = [
                {
                    "sectionName": rule.section_name,
                    "requirementType": rule.requirement_type,
                    "description": rule.description,
                    "isActive": rule.is_active,
                }
                for rule in result.scalars().all()
            ]
            return self._evaluate_rules(rules, content)

    async def evaluate_template(self, rules_json: str | None, doc_type: str, content: str) -> list[ReviewIssue]:
        if rules_json:
            try:
                rules = json.loads(rules_json)
                if isinstance(rules, list) and rules:
                    return self._evaluate_rules(rules, content)
            except json.JSONDecodeError:
                pass
        return await self.evaluate_db(doc_type, content)

rule_engine = RuleEngine()
