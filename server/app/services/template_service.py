from app.data.demo_assets import GJB_RULES


class TemplateService:
    def build_outline(self, document_type: str) -> list[str]:
        return GJB_RULES.get(document_type, GJB_RULES["requirements"])["required_sections"]


template_service = TemplateService()
