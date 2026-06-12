
from app.core.llm_client import model_manager
from app.db.database import AsyncSessionLocal
from app.db.models import Document
import json

class GenerationOrchestrator:
    async def generate_and_save(self, document_id: int, prompt: str, structure: list):
        async with AsyncSessionLocal() as session:
            doc = await session.get(Document, document_id)
            if not doc:
                return

            client = await model_manager.get_default_client()
            if not client:
                doc.status = "error"
                doc.review_summary = "未配置默认模型"
                await session.commit()
                return

            sections = {}
            for item in structure:
                title = item['title']
                llm_prompt = f"请作为军工软件专家，为项目【{doc.project_name}】编写【{doc.doc_type}】文档的章节：{title}。\n要求：符合GJB 438B规范。\n背景：{prompt}"
                
                try:
                    content = await client.chat_completion([{"role": "user", "content": llm_prompt}])
                    sections[title] = content
                except Exception as e:
                    sections[title] = f"生成失败: {str(e)}"
            
            doc.content_json = json.dumps(sections)
            doc.status = "draft"
            await session.commit()

generation_orchestrator = GenerationOrchestrator()
