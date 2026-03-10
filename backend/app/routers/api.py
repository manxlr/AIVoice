from fastapi import APIRouter

from app.services.llm_service import llm_service
from app.services.tts_service import tts_service

router = APIRouter(prefix="/api")


@router.get("/voices")
async def list_voices() -> dict:
    return {"voices": list(tts_service.list_voices().values())}

from pydantic import BaseModel

class DualResponseRequest(BaseModel):
    prompt: str

@router.post("/test-dual-response")
async def test_dual_response(request: DualResponseRequest) -> dict:
    """Test endpoint for dual response generation."""
    spoken, text = await llm_service.generate(request.prompt, [])
    return {
        "spoken_response": spoken,
        "text_response": text,
        "prompt": request.prompt
    }

