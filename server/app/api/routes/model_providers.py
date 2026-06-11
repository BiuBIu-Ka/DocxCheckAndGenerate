
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.db.models import ModelConfig
from app.core.llm_client import LLMClient
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

@router.get("")
async def list_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelConfig))
    return result.scalars().all()

@router.post("")
async def create_model(config: ModelConfigCreate, db: AsyncSession = Depends(get_db)):
    db_config = ModelConfig(**config.dict())
    if config.is_default:
        # Reset other defaults
        await db.execute(ModelConfig.__table__.update().values(is_default=False))
    db.add(db_config)
    await db.commit()
    return db_config

@router.post("/test/{id}")
async def test_model(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelConfig).where(ModelConfig.id == id))
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    client = LLMClient(config.base_url, config.api_key, config.model_name)
    success = await client.test_connection()
    return {"success": success}

@router.delete("/{id}")
async def delete_model(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelConfig).where(ModelConfig.id == id))
    config = result.scalars().first()
    if config:
        await db.delete(config)
        await db.commit()
    return {"success": True}
