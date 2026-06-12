
import httpx
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse


def normalize_base_url(base_url: str, provider: Optional[str] = None) -> str:
    value = (base_url or "").strip()
    provider_name = (provider or "").strip().lower()

    if not value:
        defaults = {
            "deepseek": "https://api.deepseek.com/v1",
            "openai": "https://api.openai.com/v1",
            "ollama": "http://127.0.0.1:11434/v1",
        }
        return defaults.get(provider_name, "")

    if value.startswith("sk-"):
        defaults = {
            "deepseek": "https://api.deepseek.com/v1",
            "openai": "https://api.openai.com/v1",
            "ollama": "http://127.0.0.1:11434/v1",
        }
        return defaults.get(provider_name, value)

    if not value.startswith(("http://", "https://")):
        if value.startswith(("127.0.0.1", "localhost")):
            value = f"http://{value}"
        else:
            value = f"https://{value}"

    parsed = urlparse(value)
    path = parsed.path.rstrip("/")
    if provider_name in {"deepseek", "openai", "ollama"} and path == "":
        value = value.rstrip("/") + "/v1"

    return value.rstrip("/")

class LLMClient:
    def __init__(self, base_url: str, api_key: str, model_name: str, provider: Optional[str] = None):
        self.base_url = normalize_base_url(base_url, provider)
        self.api_key = (api_key or "").strip()
        self.model_name = (model_name or "").strip()
        self.provider = (provider or "").strip().lower()

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

    async def test_connection(self) -> tuple[bool, Optional[str]]:
        try:
            if not self.base_url.startswith(("http://", "https://")):
                return False, "模型地址不是合法的 HTTP 地址。"
            if not self.model_name:
                return False, "模型名称不能为空。"

            messages = [{"role": "user", "content": "hi"}]
            await self.chat_completion(messages)
            return True, None
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False, str(e)

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
                return LLMClient(config.base_url, config.api_key, config.model_name, config.provider)
            return None

model_manager = ModelManager()
