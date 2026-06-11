
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.docx_parser import docx_parser
from app.core.llm_client import model_manager
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import shutil

router = APIRouter()

class GenerateRequest(BaseModel):
    projectName: str
    docType: str
    prompt: str
    structure: List[Dict[str, Any]]

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

@router.post("/generate")
async def generate_document(req: GenerateRequest):
    client = await model_manager.get_default_client()
    if not client:
        raise HTTPException(status_code=400, detail="请先在设置中配置并开启一个默认大模型")
    
    sections = {}
    for item in req.structure:
        title = item['title']
        prompt = f"请作为军工软件专家，为项目【{req.projectName}】编写【{req.docType}】文档的章节：{title}。\n要求：符合GJB 438B规范。\n背景：{req.prompt}"
        
        try:
            content = await client.chat_completion([{"role": "user", "content": prompt}])
            sections[title] = content
        except Exception as e:
            sections[title] = f"生成失败: {str(e)}"
            
    return {"sections": sections}
