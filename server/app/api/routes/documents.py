
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.db.models import Document
from app.schemas import DocumentCreate, DocumentUpdate, DocumentSchema
from app.services.docx_parser import docx_parser
from typing import List
import shutil
import os

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
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        structure = docx_parser.parse_structure(temp_path)
        return {"structure": structure}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
