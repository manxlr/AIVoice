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
    ) -> tuple[str, str]:
        """Send conversation to LM Studio and return (spoken_response, text_response)."""
        # Enhanced system prompt for dual responses
        system_prompt = """You are a helpful AI assistant. For every user query, provide TWO responses:

1. SPEAKING RESPONSE (30-50 words max): Natural, conversational, no symbols/emojis, suitable for voice synthesis
2. TEXT RESPONSE: Complete, detailed answer with code, explanations, or full content as needed

Format your response exactly as:
SPEAK: [brief natural response]
TEXT: [complete detailed response]

Examples:
User: Hello
SPEAK: Hello! How can I assist you today?
TEXT: Hello! I'm here to help with any questions or tasks you might have.

User: Write a calculator in tkinter
SPEAK: I've created a calculator application for you. You can review the code in the text box.
TEXT: Here's a complete tkinter calculator implementation: [full code follows]"""

        messages = [
            {"role": "system", "content": system_prompt}
        ] + history + [
            {
                "role": "user",
                "content": prompt,
            }
        ]

        payload: Dict[str, Any] = {
            "model": settings.llm_model,
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_tokens,
            "messages": messages,
        }

        response = await self._client.post(settings.llm_api_url, json=payload)
        response.raise_for_status()
        data = response.json()

        try:
            full_response = data["choices"][0]["message"]["content"]
            
            # Parse the dual response
            if "SPEAK:" in full_response and "TEXT:" in full_response:
                parts = full_response.split("TEXT:", 1)
                spoken = parts[0].replace("SPEAK:", "").strip()
                text = parts[1].strip()
                return spoken, text
            else:
                # Fallback: use first sentence for speaking, full response for text
                sentences = full_response.split(".")
                spoken = sentences[0] + "." if sentences else full_response[:50]
                return spoken.strip(), full_response
                
        except (KeyError, IndexError):
            return "I'm here to help!", "I'd be happy to assist you with that."


llm_service = LLMService()

