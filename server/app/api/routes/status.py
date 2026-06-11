from fastapi import APIRouter

from app.schemas import CodeStatusResponse, EnvironmentStatusResponse, EnvironmentSummaryResponse
from app.services.runtime_status_service import runtime_status_service

router = APIRouter()


@router.get('/environment', response_model=EnvironmentStatusResponse)
def get_environment_status() -> EnvironmentStatusResponse:
    return runtime_status_service.environment_status()


@router.get('/code', response_model=CodeStatusResponse)
def get_code_status() -> CodeStatusResponse:
    return runtime_status_service.code_status()


@router.get('/summary', response_model=EnvironmentSummaryResponse)
def get_summary() -> EnvironmentSummaryResponse:
    return runtime_status_service.summary()
