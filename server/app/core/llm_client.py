
import httpx
import json
from typing import List, Dict, Any, Optional

class LLMClient:
    def __init__(self, base_url: str, api_key: str, model_name: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.model_name = model_name

    async def chat_completion(self, messages: List[Dict[str, str]], stream: bool = False) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": stream
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']

    async def test_connection(self) -> bool:
        try:
            # Send a simple hello to test connectivity
            messages = [{"role": "user", "content": "hi"}]
            await self.chat_completion(messages)
            return True
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False

# Model Manager to handle dynamic switching
from sqlalchemy.future import select
from app.db.models import ModelConfig
from app.db.database import AsyncSessionLocal

class ModelManager:
    async def get_default_client(self) -> Optional[LLMClient]:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(ModelConfig).where(ModelConfig.is_default == True)
            )
            config = result.scalars().first()
            if not config:
                # Fallback to any config if no default
                result = await session.execute(select(ModelConfig))
                config = result.scalars().first()
            
            if config:
                return LLMClient(config.base_url, config.api_key, config.model_name)
            return None

model_manager = ModelManager()
