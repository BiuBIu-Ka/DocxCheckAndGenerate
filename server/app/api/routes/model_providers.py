
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.db.models import ModelConfig
from app.core.llm_client import LLMClient, normalize_base_url
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ModelConfigCreate(BaseModel):
    name: str
    provider: str
    base_url: str
    api_key: str
    model_name: str
    is_default: bool = False


def sanitize_config(config: ModelConfigCreate) -> dict:
    provider = (config.provider or "").strip().lower()
    base_url = (config.base_url or "").strip()
    api_key = (config.api_key or "").strip()

    if base_url.startswith("sk-") and api_key.startswith(("http://", "https://")):
        base_url, api_key = api_key, base_url

    normalized_base_url = normalize_base_url(base_url, provider)
    if not normalized_base_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="模型地址无效，请填写完整的 http(s) 地址。")

    return {
        "name": (config.name or "").strip(),
        "provider": provider,
        "base_url": normalized_base_url,
        "api_key": api_key,
        "model_name": (config.model_name or "").strip(),
        "is_default": config.is_default,
    }

@router.get("")
async def list_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelConfig))
    return result.scalars().all()

@router.post("")
async def create_model(config: ModelConfigCreate, db: AsyncSession = Depends(get_db)):
    payload = sanitize_config(config)
    db_config = ModelConfig(**payload)
    if config.is_default:
        # Reset other defaults
        await db.execute(ModelConfig.__table__.update().values(is_default=False))
    db.add(db_config)
    await db.commit()
    await db.refresh(db_config)
    return db_config

@router.post("/test/{id}")
async def test_model(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelConfig).where(ModelConfig.id == id))
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    normalized_url = normalize_base_url(config.base_url, config.provider)
    if normalized_url != config.base_url:
        config.base_url = normalized_url
        await db.commit()
        await db.refresh(config)

    client = LLMClient(config.base_url, config.api_key, config.model_name, config.provider)
    success, error = await client.test_connection()
    return {"success": success, "error": error, "base_url": config.base_url}

@router.delete("/{id}")
async def delete_model(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelConfig).where(ModelConfig.id == id))
    config = result.scalars().first()
    if config:
        await db.delete(config)
        await db.commit()
    return {"success": True}
