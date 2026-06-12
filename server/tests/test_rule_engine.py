import asyncio
import json

from app.core.rule_engine import rule_engine


def test_rule_engine_detects_missing_sections_from_template_rules():
    rules_json = json.dumps(
        [
            {
                "sectionName": "1 范围",
                "requirementType": "mandatory",
                "description": "必须说明文档适用范围",
                "isActive": True,
            },
            {
                "sectionName": "2 功能需求",
                "requirementType": "mandatory",
                "description": "必须描述核心功能",
                "isActive": True,
            },
        ],
        ensure_ascii=False,
    )

    issues = asyncio.run(rule_engine.evaluate_template(rules_json, "requirements", "1 范围\n正文"))

    assert len(issues) == 1
    assert "缺少必备章节" in issues[0].title
    assert "2 功能需求" in issues[0].title
