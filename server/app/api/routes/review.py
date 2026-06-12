
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Document
from app.core.review_orchestrator import review_orchestrator
from pydantic import BaseModel

router = APIRouter()

@router.post("/trigger/{document_id}")
async def trigger_review(document_id: int, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.status = "reviewing"
    await db.commit()
    
    background_tasks.add_task(review_orchestrator.review_and_save, document_id)
    
    return {"status": "started", "document_id": document_id}
