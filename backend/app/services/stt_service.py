import asyncio
import os
import tempfile
from functools import lru_cache

from faster_whisper import WhisperModel

from app.config import settings


@lru_cache(maxsize=1)
def _load_model() -> WhisperModel:
    return WhisperModel(
        settings.stt_model,
        device=settings.stt_device,
        compute_type=settings.stt_compute_type,
        num_workers=2,
    )


class STTService:
    def __init__(self) -> None:
        self.model: WhisperModel = _load_model()

    async def transcribe_audio(self, audio_bytes: bytes) -> str:
        if not audio_bytes:
            return ""

        loop = asyncio.get_running_loop()

        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp.flush()
            tmp_path = tmp.name

        try:
            segments, _ = await loop.run_in_executor(
                None,
                lambda: self.model.transcribe(
                    tmp_path,
                    language=settings.stt_language,
                    beam_size=1,
                    vad_filter=True,
                    vad_parameters={"min_silence_duration_ms": 400},
                ),
            )
        except Exception:
            return ""
        finally:
            try:
                os.remove(tmp_path)
            except FileNotFoundError:
                pass

        return " ".join(segment.text for segment in segments).strip()


stt_service = STTService()

