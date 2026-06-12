from app.core.generation_orchestrator import generation_orchestrator
from app.services.generation_context_service import generation_context_service


def test_generation_orchestrator_flattens_nested_template_structure():
    structure = [
        {
            "title": "1 范围",
            "children": [
                {"title": "1.1 系统概述", "children": []},
                {"title": "1.2 运行环境", "children": []},
            ],
        },
        {"title": "2 功能需求", "children": []},
    ]

    titles = generation_orchestrator._flatten_structure(structure)

    assert titles == ["1 范围", "1.1 系统概述", "1.2 运行环境", "2 功能需求"]


def test_generation_context_payload_keeps_prompt_sources():
    context_text, sources_json = generation_context_service.build_context_payload(
        [
            {"filename": "req.md", "text": "系统需支持导出 docx。"},
            {"filename": "api.py", "text": "def export_docx(): pass"},
        ]
    )

    assert "req.md" in context_text
    assert "api.py" in context_text
    assert "导出 docx" in context_text
    assert "req.md" in sources_json
