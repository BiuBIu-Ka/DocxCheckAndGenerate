
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Document
from app.core.generation_orchestrator import generation_orchestrator
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
import tempfile
import shutil
import json

from app.services.generation_context_service import generation_context_service

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
        req.structure,
        "",
    )
    
    return {"status": "started", "document_id": req.document_id}


@router.post("/trigger-with-context")
async def trigger_generation_with_context(
    background_tasks: BackgroundTasks,
    document_id: int = Form(...),
    prompt: str = Form(...),
    structure_json: str = Form(...),
    files: List[UploadFile] | None = File(default=None),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        structure = json.loads(structure_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="结构数据无效。") from exc

    parsed_files: list[dict[str, Any]] = []
    for upload in files or []:
        suffix = Path(upload.filename or "").suffix
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_path = temp_file.name
        try:
            with temp_file as buffer:
                shutil.copyfileobj(upload.file, buffer)
            extracted_text = generation_context_service.extract_text(temp_path, upload.filename or "")
            parsed_files.append({
                "filename": upload.filename or "未命名文件",
                "text": extracted_text,
            })
        finally:
            Path(temp_path).unlink(missing_ok=True)

    context_text, sources_json = generation_context_service.build_context_payload(parsed_files)
    doc.status = "generating"
    doc.generation_prompt = prompt
    doc.generation_sources_json = sources_json
    await db.commit()

    background_tasks.add_task(
        generation_orchestrator.generate_and_save,
        document_id,
        prompt,
        structure,
        context_text,
    )
    return {
        "status": "started",
        "document_id": document_id,
        "contextFileCount": len(parsed_files),
    }
