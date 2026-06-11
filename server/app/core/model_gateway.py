from app.data.demo_assets import MODEL_PROVIDERS
from app.schemas import ModelProviderResponse


class ModelGateway:
    def list_providers(self) -> list[ModelProviderResponse]:
        return [ModelProviderResponse(**item) for item in MODEL_PROVIDERS]

    def draft_paragraph(self, title: str, context: list[str]) -> str:
        summary = "；".join(context[:2])
        return f"{title}：结合项目知识底座与规则约束，围绕{summary}进行编制，明确输入、处理逻辑、输出结果及异常分支。"


model_gateway = ModelGateway()
