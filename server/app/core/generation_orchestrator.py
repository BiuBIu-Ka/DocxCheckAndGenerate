from app.core.model_gateway import model_gateway
from app.core.review_orchestrator import review_orchestrator
from app.schemas import GeneratedSection, GenerationRequest, GenerationResponse, ReviewRequest
from app.services.knowledge_index_service import knowledge_index_service
from app.services.template_service import template_service


class GenerationOrchestrator:
    def generate(self, payload: GenerationRequest) -> GenerationResponse:
        outline = template_service.build_outline(payload.document_type)
        context = knowledge_index_service.retrieve_context(payload.document_type, payload.prompt)
        sections = [
            GeneratedSection(title=title, body=model_gateway.draft_paragraph(title, context))
            for title in outline
        ]
        content = "\n".join(f"{section.title}\n{section.body}" for section in sections)
        review = review_orchestrator.review(
            ReviewRequest(documentType=payload.document_type, content=content)
        )
        return GenerationResponse(
            title=f"{payload.project_name}-{payload.template_name}",
            documentType=payload.document_type,
            sections=sections,
            review=review,
        )


generation_orchestrator = GenerationOrchestrator()
