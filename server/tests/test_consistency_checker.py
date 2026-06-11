from app.core.consistency_checker import consistency_checker


def test_consistency_checker_flags_mixed_terms():
    issues = consistency_checker.evaluate("任务规划模块需要保持术语统一，避免任务计划等别称。")
    assert len(issues) == 1
    assert issues[0].rule == "CONSISTENCY-TERM"
