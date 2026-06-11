from fastapi import APIRouter

from app.core.generation_orchestrator import generation_orchestrator
from app.schemas import GenerationRequest, GenerationResponse

router = APIRouter()


@router.post("", response_model=GenerationResponse)
def generate_document(payload: GenerationRequest) -> GenerationResponse:
    return generation_orchestrator.generate(payload)
