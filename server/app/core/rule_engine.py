
from app.db.database import AsyncSessionLocal
from app.db.models import GjbRule
from app.schemas import ReviewIssue
from sqlalchemy.future import select

class RuleEngine:
    async def evaluate_db(self, doc_type: str, content: str) -> list[ReviewIssue]:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(GjbRule).where(GjbRule.doc_type == doc_type, GjbRule.is_active == True)
            )
            rules = result.scalars().all()
            
            issues = []
            for rule in rules:
                # Basic mandatory check
                if rule.requirement_type == "mandatory" and rule.section_name not in content:
                    issues.append(ReviewIssue(
                        id=f"rule-{rule.id}",
                        title=f"缺少必备章节：{rule.section_name}",
                        severity="high",
                        rule="GJB-STRUCTURE",
                        suggestion=rule.description,
                        location="全文"
                    ))
            return issues

rule_engine = RuleEngine()
