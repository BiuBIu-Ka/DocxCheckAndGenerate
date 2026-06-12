
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.db.models import Document
from app.schemas import DocumentCreate, DocumentUpdate, DocumentSchema
from app.services.docx_parser import docx_parser
from typing import List
from pathlib import Path
import shutil
import os
import tempfile

router = APIRouter()

@router.get("", response_model=List[DocumentSchema])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.updated_at.desc()))
    return result.scalars().all()

@router.post("", response_model=DocumentSchema)
async def create_document(doc: DocumentCreate, db: AsyncSession = Depends(get_db)):
    db_doc = Document(**doc.dict())
    db.add(db_doc)
    await db.commit()
    await db.refresh(db_doc)
    return db_doc

@router.get("/{id}", response_model=DocumentSchema)
async def get_document(id: int, db: AsyncSession = Depends(get_db)):
    db_doc = await db.get(Document, id)
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_doc

@router.put("/{id}", response_model=DocumentSchema)
async def update_document(id: int, doc_update: DocumentUpdate, db: AsyncSession = Depends(get_db)):
    db_doc = await db.get(Document, id)
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    for key, value in doc_update.dict(exclude_unset=True).items():
        setattr(db_doc, key, value)
    
    await db.commit()
    await db.refresh(db_doc)
    return db_doc

@router.delete("/{id}")
async def delete_document(id: int, db: AsyncSession = Depends(get_db)):
    db_doc = await db.get(Document, id)
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(db_doc)
    await db.commit()
    return {"success": True}

@router.post("/parse-template")
async def parse_template(file: UploadFile = File(...)):
    filename = file.filename or ""
    suffix = Path(filename).suffix.lower()
    if suffix != ".docx":
        raise HTTPException(status_code=400, detail="模板解析仅支持 .docx 文件，请上传 Word 模板。")

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_path = temp_file.name
    try:
        with temp_file as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"模板文件保存失败: {exc}") from exc

    try:
        structure = docx_parser.parse_structure(temp_path)
        return {"structure": structure}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"模板解析失败，请确认文件是有效的 Word .docx 模板: {exc}") from exc
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
