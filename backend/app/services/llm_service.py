from typing import Any, Dict, List

import httpx

from app.config import settings


class LLMService:
    """Async client for LM Studio (OpenAI-compatible)."""

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=30.0)

    async def generate(
        self,
        prompt: str,
        history: List[Dict[str, str]],
    ) -> str:
        """Send conversation to LM Studio and return assistant reply."""
        payload: Dict[str, Any] = {
            "model": settings.llm_model,
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_tokens,
            "messages": history
            + [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }

        response = await self._client.post(settings.llm_api_url, json=payload)
        response.raise_for_status()
        data = response.json()

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            return ""


llm_service = LLMService()

