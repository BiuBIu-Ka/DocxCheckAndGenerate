
from app.db.database import AsyncSessionLocal
from app.db.models import TermBase
from app.schemas import ReviewIssue
from sqlalchemy.future import select

class ConsistencyChecker:
    async def evaluate_db(self, content: str) -> list[ReviewIssue]:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(TermBase))
            terms = result.scalars().all()
            
            issues = []
            for term in terms:
                # Forbidden terms check
                if term.forbidden_terms:
                    for forbidden in term.forbidden_terms.split(','):
                        if forbidden.strip() in content:
                            issues.append(ReviewIssue(
                                id=f"term-{term.id}",
                                title=f"发现禁用术语：{forbidden}",
                                severity="medium",
                                rule="GJB-TERM",
                                suggestion=f"建议替换为标准术语：{term.standard_name}",
                                location="全文"
                            ))
            return issues

consistency_checker = ConsistencyChecker()
