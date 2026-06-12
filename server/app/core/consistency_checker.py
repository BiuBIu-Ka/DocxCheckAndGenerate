
from app.db.database import AsyncSessionLocal
from app.db.models import TermBase
from app.schemas import ReviewIssue
from sqlalchemy.future import select
import json


class ConsistencyChecker:
    def _evaluate_terms(self, terms: list[dict], content: str) -> list[ReviewIssue]:
        issues = []
        for index, term in enumerate(terms, start=1):
            forbidden_terms = term.get("forbiddenTerms") or ""
            standard_name = term.get("standardName") or "标准术语"
            description = term.get("description") or ""
            for forbidden in [item.strip() for item in forbidden_terms.split(",") if item.strip()]:
                if forbidden in content:
                    issues.append(
                        ReviewIssue(
                            id=f"term-{index}-{forbidden}",
                            title=f"发现禁用术语：{forbidden}",
                            severity="medium",
                            rule="GJB-TERM",
                            suggestion=description or f"建议替换为标准术语：{standard_name}",
                            location="全文",
                        )
                    )
        return issues

    async def evaluate_db(self, content: str) -> list[ReviewIssue]:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(TermBase))
            terms = [
                {
                    "standardName": term.standard_name,
                    "aliases": term.aliases,
                    "forbiddenTerms": term.forbidden_terms,
                    "description": term.description,
                }
                for term in result.scalars().all()
            ]
            return self._evaluate_terms(terms, content)

    async def evaluate_template(self, terms_json: str | None, content: str) -> list[ReviewIssue]:
        if terms_json:
            try:
                terms = json.loads(terms_json)
                if isinstance(terms, list) and terms:
                    return self._evaluate_terms(terms, content)
            except json.JSONDecodeError:
                pass
        return await self.evaluate_db(content)

consistency_checker = ConsistencyChecker()
