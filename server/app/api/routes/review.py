from fastapi import APIRouter

from app.core.review_orchestrator import review_orchestrator
from app.schemas import ReviewRequest, ReviewResponse

router = APIRouter()


@router.post("", response_model=ReviewResponse)
def review_document(payload: ReviewRequest) -> ReviewResponse:
    return review_orchestrator.review(payload)
