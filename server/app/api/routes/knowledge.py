from fastapi import APIRouter

from app.services.knowledge_index_service import knowledge_index_service
from app.schemas import KnowledgeSummaryResponse

router = APIRouter()


@router.get("/summary", response_model=KnowledgeSummaryResponse)
def get_knowledge_summary() -> KnowledgeSummaryResponse:
    return knowledge_index_service.summary()
