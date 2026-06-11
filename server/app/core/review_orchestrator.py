from app.core.consistency_checker import consistency_checker
from app.core.rule_engine import rule_engine
from app.schemas import ReviewIssue, ReviewRequest, ReviewResponse
from app.services.document_parser import document_parser


class ReviewOrchestrator:
    def review(self, payload: ReviewRequest) -> ReviewResponse:
        sections = document_parser.parse(payload.content)
        issues = rule_engine.evaluate(payload.document_type, payload.content)
        issues.extend(consistency_checker.evaluate(payload.content))

        if not any(section.title.startswith(("1.", "#")) for section in sections):
            issues.append(
                ReviewIssue(
                    id="structure-heading",
                    title="文档缺少可识别的章节标题",
                    severity="medium",
                    rule="GJB-HEADING",
                    suggestion="建议按模板补充编号化章节标题，例如“1. 系统概述”。",
                    location="文档首部",
                )
            )

        score = max(58, 100 - len(issues) * 8)
        summary = f"共识别 {len(issues)} 个问题，已按规则结构、术语规范和语义覆盖进行聚合。"
        return ReviewResponse(score=score, summary=summary, issues=issues)


review_orchestrator = ReviewOrchestrator()
