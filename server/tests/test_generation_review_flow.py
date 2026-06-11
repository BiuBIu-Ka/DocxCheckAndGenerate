from app.core.generation_orchestrator import generation_orchestrator
from app.schemas import GenerationRequest


def test_generation_flow_returns_sections_and_review():
    response = generation_orchestrator.generate(
        GenerationRequest(
            documentType="requirements",
            projectName="某型项目",
            templateName="需求模板",
            prompt="生成任务规划和异常处理需求",
        )
    )
    assert response.sections
    assert response.review.score <= 100
