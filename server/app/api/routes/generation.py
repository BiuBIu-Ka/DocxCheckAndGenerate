
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Document
from app.core.generation_orchestrator import generation_orchestrator
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

class GenerationTaskRequest(BaseModel):
    document_id: int
    prompt: str
    structure: List[Dict[str, Any]]

@router.post("/trigger")
async def trigger_generation(req: GenerationTaskRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, req.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.status = "generating"
    await db.commit()
    
    # Run in background
    background_tasks.add_task(
        generation_orchestrator.generate_and_save, 
        req.document_id, 
        req.prompt, 
        req.structure
    )
    
    return {"status": "started", "document_id": req.document_id}
