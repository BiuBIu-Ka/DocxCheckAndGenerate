from app.schemas import ModelProviderResponse
from app.services.runtime_status_service import runtime_status_service


class ModelGateway:
    def list_providers(self) -> list[ModelProviderResponse]:
        return runtime_status_service.list_model_providers()

    def draft_paragraph(self, title: str, context: list[str]) -> str:
        summary = "；".join(context[:2])
        return f"{title}：结合项目知识底座与规则约束，围绕{summary}进行编制，明确输入、处理逻辑、输出结果及异常分支。"


model_gateway = ModelGateway()
