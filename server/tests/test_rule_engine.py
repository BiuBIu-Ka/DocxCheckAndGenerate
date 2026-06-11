from app.core.rule_engine import rule_engine


def test_rule_engine_detects_missing_sections_and_terms():
    content = "1. 系统概述\n正文\n数据库表单"
    issues = rule_engine.evaluate("design", content)
    titles = [issue.title for issue in issues]
    assert any("缺少必备章节" in title for title in titles)
    assert any("禁用术语" in title for title in titles)
