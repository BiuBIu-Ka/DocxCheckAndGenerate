from fastapi import APIRouter

from app.api.routes import generation, knowledge, manuals, model_providers, review, status

api_router = APIRouter()
api_router.include_router(generation.router, prefix="/generation", tags=["generation"])
api_router.include_router(review.router, prefix="/review", tags=["review"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(model_providers.router, prefix="/model-providers", tags=["model-providers"])
api_router.include_router(manuals.router, prefix="/manuals", tags=["manuals"])
api_router.include_router(status.router, prefix="/status", tags=["status"])
