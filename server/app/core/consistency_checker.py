from app.schemas import ReviewIssue


class ConsistencyChecker:
    def evaluate(self, content: str) -> list[ReviewIssue]:
        issues: list[ReviewIssue] = []
        if "任务规划" in content and "任务计划" in content:
            issues.append(
                ReviewIssue(
                    id="consistency-1",
                    title="术语表达不一致",
                    severity="medium",
                    rule="CONSISTENCY-TERM",
                    suggestion="请统一使用术语基线中的“任务规划”。",
                    location="术语检查",
                )
            )
        return issues


consistency_checker = ConsistencyChecker()
