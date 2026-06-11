from fastapi import APIRouter

from app.schemas import ModelProviderResponse
from app.core.model_gateway import model_gateway

router = APIRouter()


@router.get("", response_model=list[ModelProviderResponse])
def list_model_providers() -> list[ModelProviderResponse]:
    return model_gateway.list_providers()
