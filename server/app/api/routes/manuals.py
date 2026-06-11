from fastapi import APIRouter

from app.core.manual_builder import manual_builder
from app.schemas import ManualDraftRequest, ManualDraftResponse

router = APIRouter()


@router.post("/draft", response_model=ManualDraftResponse)
def build_manual_draft(payload: ManualDraftRequest) -> ManualDraftResponse:
    return manual_builder.build(payload)
