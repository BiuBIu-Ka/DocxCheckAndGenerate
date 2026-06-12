import asyncio
import json

from app.core.consistency_checker import consistency_checker


def test_consistency_checker_flags_forbidden_terms_from_template_terms():
    terms_json = json.dumps(
        [
            {
                "standardName": "任务规划",
                "forbiddenTerms": "任务计划,计划编排",
                "description": "统一使用任务规划",
            }
        ],
        ensure_ascii=False,
    )

    issues = asyncio.run(
        consistency_checker.evaluate_template(
            terms_json,
            "任务规划模块需要保持术语统一，避免任务计划等别称。",
        )
    )

    assert len(issues) == 1
    assert issues[0].rule == "GJB-TERM"
    assert "任务计划" in issues[0].title
