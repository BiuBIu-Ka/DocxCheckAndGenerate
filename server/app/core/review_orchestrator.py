
from app.core.rule_engine import rule_engine
from app.core.consistency_checker import consistency_checker
from app.db.database import AsyncSessionLocal
from app.db.models import Document
import json

class ReviewOrchestrator:
    async def review_and_save(self, document_id: int):
        async with AsyncSessionLocal() as session:
            doc = await session.get(Document, document_id)
            if not doc or not doc.content_json:
                return

            content_dict = json.loads(doc.content_json)
            full_text = "\n".join([f"{k}\n{v}" for k, v in content_dict.items()])
            
            issues = await rule_engine.evaluate_template(doc.rules_json, doc.doc_type, full_text)
            issues.extend(await consistency_checker.evaluate_template(doc.terms_json, full_text))
            
            score = max(0, 100 - len(issues) * 5)
            summary = f"审查完成，发现 {len(issues)} 个问题点。"
            
            doc.review_score = score
            doc.review_summary = summary
            doc.issues_json = json.dumps([issue.dict() for issue in issues], ensure_ascii=False)
            doc.status = "completed"
            await session.commit()

review_orchestrator = ReviewOrchestrator()
