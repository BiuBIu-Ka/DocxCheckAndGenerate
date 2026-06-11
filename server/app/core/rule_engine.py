from app.data.demo_assets import GJB_RULES
from app.schemas import ReviewIssue


class RuleEngine:
    def evaluate(self, document_type: str, content: str) -> list[ReviewIssue]:
        spec = GJB_RULES.get(document_type, GJB_RULES["requirements"])
        issues: list[ReviewIssue] = []

        for idx, section in enumerate(spec["required_sections"], start=1):
            if section not in content:
                issues.append(
                    ReviewIssue(
                        id=f"rule-{idx}",
                        title=f"缺少必备章节：{section}",
                        severity="high",
                        rule="GJB-STRUCTURE",
                        suggestion=f"请补齐 {section} 章节，并按模板顺序组织内容。",
                        location=section,
                    )
                )

        for term in spec["forbidden_terms"]:
            if term in content:
                issues.append(
                    ReviewIssue(
                        id=f"term-{term}",
                        title=f"发现禁用术语：{term}",
                        severity="medium",
                        rule="GJB-TERM",
                        suggestion="请替换为术语库中的标准表达，并在全篇统一。",
                        location="全文检索",
                    )
                )

        if len(content.strip()) < 120:
            issues.append(
                ReviewIssue(
                    id="semantic-length",
                    title="内容覆盖偏少",
                    severity="low",
                    rule="LLM-COVERAGE",
                    suggestion="建议补充业务流程、边界条件与异常场景说明。",
                    location="全文",
                )
            )

        return issues


rule_engine = RuleEngine()
