import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.config import settings
from app.core.connection_manager import connection_manager
from app.services.llm_service import llm_service
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service

router = APIRouter()


@router.websocket("/ws")
async def voice_socket(websocket: WebSocket) -> None:
    client_id = await connection_manager.connect(websocket)
    audio_buffer = bytearray()
    history: List[Dict[str, str]] = []
    voice_catalog = tts_service.list_voices()
    voice_key = settings.default_voice_personality
    if voice_key not in voice_catalog and voice_catalog:
        voice_key = next(iter(voice_catalog.keys()))
    if voice_key not in voice_catalog:
        voice_key = None

    try:
        while True:
            try:
                message = await websocket.receive()
            except WebSocketDisconnect:
                break

            if "bytes" in message:
                audio_buffer.extend(message["bytes"])
                continue

            if "text" in message:
                payload = json.loads(message["text"])
                voice_key = await _handle_control(
                    payload,
                    websocket,
                    audio_buffer,
                    history,
                    voice_key,
                )
    except Exception as exc:  # pragma: no cover - safety net
        if websocket.application_state == WebSocketState.CONNECTED:
            try:
                await websocket.send_json({"type": "error", "message": str(exc)})
            except RuntimeError:
                pass
    finally:
        connection_manager.disconnect(client_id)


async def _handle_control(
    payload: Dict[str, Any],
    websocket: WebSocket,
    audio_buffer: bytearray,
    history: List[Dict[str, str]],
    voice_key: Optional[str],
) -> Optional[str]:
    msg_type = payload.get("type")

    if msg_type == "flush_audio":
        await _process_audio_buffer(websocket, audio_buffer, history, voice_key)
        audio_buffer.clear()
        return voice_key
    elif msg_type == "text_query":
        text = payload.get("text", "")
        if text:
            await _process_text(text, websocket, history, voice_key)
        return voice_key
    elif msg_type == "set_personality":
        new_voice = payload.get("voice_id")
        if new_voice in tts_service.list_voices():
            voice_key = new_voice
            await websocket.send_json(
                {"type": "personality_ack", "voice_id": voice_key}
            )
        else:
            await websocket.send_json(
                {
                    "type": "error",
                    "message": f"Voice '{new_voice}' not available.",
                }
            )
        return voice_key
    elif msg_type == "ping":
        await websocket.send_json({"type": "pong"})
    return voice_key


async def _process_audio_buffer(
    websocket: WebSocket,
    audio_buffer: bytearray,
    history: List[Dict[str, str]],
    voice_key: Optional[str],
) -> None:
    if not audio_buffer:
        return

    transcript = await stt_service.transcribe_audio(bytes(audio_buffer))
    if not transcript:
        await websocket.send_json({"type": "transcription", "text": ""})
        return

    await websocket.send_json({"type": "transcription", "text": transcript})

    history.append({"role": "user", "content": transcript})
    reply = await llm_service.generate(transcript, history)
    if reply:
        history.append({"role": "assistant", "content": reply})
    else:
        reply = "..."

    await websocket.send_json({"type": "assistant_text", "text": reply})

    audio_bytes = await tts_service.synthesize(reply, personality=voice_key)
    await websocket.send_bytes(audio_bytes)
    await websocket.send_json({"type": "audio_complete"})


async def _process_text(
    text: str,
    websocket: WebSocket,
    history: List[Dict[str, str]],
    voice_key: Optional[str],
) -> None:
    history.append({"role": "user", "content": text})
    reply = await llm_service.generate(text, history)
    if reply:
        history.append({"role": "assistant", "content": reply})
    else:
        reply = "..."

    await websocket.send_json({"type": "assistant_text", "text": reply})
    if voice_key:
        audio_bytes = await tts_service.synthesize(reply, personality=voice_key)
        await websocket.send_bytes(audio_bytes)
        await websocket.send_json({"type": "audio_complete"})

