from fastapi import APIRouter

from app.services.tts_service import tts_service

router = APIRouter(prefix="/api")


@router.get("/voices")
async def list_voices() -> dict:
    return {"voices": list(tts_service.list_voices().values())}

