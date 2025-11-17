import asyncio
import os
import tempfile
import wave
from pathlib import Path
from typing import Any, Dict, Optional

from piper import PiperVoice, SynthesisConfig

from app.config import settings


class PiperWrapper:
    """Lightweight Piper voice wrapper with async synthesis."""

    def __init__(
        self,
        model_path: Path,
        config_path: Optional[Path] = None,
        synthesis_params: Optional[Dict[str, Any]] = None,
    ):
        self.voice = PiperVoice.load(
            str(model_path),
            config_path=str(config_path) if config_path else None,
        )
        self.syn_config = (
            SynthesisConfig(
                speaker_id=synthesis_params.get("speaker_id"),
                length_scale=synthesis_params.get("length_scale"),
                noise_scale=synthesis_params.get("noise_scale"),
                noise_w_scale=synthesis_params.get("noise_w_scale"),
                normalize_audio=synthesis_params.get("normalize_audio", True),
                volume=synthesis_params.get("volume", 1.0),
            )
            if synthesis_params
            else None
        )

    async def synthesize(self, text: str) -> bytes:
        loop = asyncio.get_event_loop()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name

        def _speak() -> None:
            with wave.open(tmp_path, "wb") as wav_file:
                self.voice.synthesize_wav(
                    text,
                    wav_file,
                    syn_config=self.syn_config,
                )

        try:
            await loop.run_in_executor(None, _speak)
            with open(tmp_path, "rb") as in_f:
                return in_f.read()
        finally:
            try:
                os.remove(tmp_path)
            except FileNotFoundError:
                pass


class TTSService:
    """Manage Piper voices."""

    def __init__(self) -> None:
        self.voices: Dict[str, PiperWrapper] = {}
        self.voice_metadata: Dict[str, Dict[str, Any]] = {}
        self._bootstrap_voices()

    def _bootstrap_voices(self) -> None:
        for voice_id, config in settings.voice_personalities.items():
            if config.get("engine", "piper") != "piper":
                continue

            model_path = Path(config.get("model_path"))
            config_path_value = config.get("config_path")
            config_path = (
                Path(config_path_value)
                if config_path_value
                else None
            )

            if not model_path.exists():
                print(f"[tts] Skipping {voice_id}: model not found at {model_path}")
                continue

            synthesis_params = config.get("synthesis") or {}

            try:
                wrapper = PiperWrapper(
                    model_path,
                    config_path=config_path,
                    synthesis_params=synthesis_params,
                )
            except Exception as exc:
                print(f"[tts] Failed to load {voice_id}: {exc}")
                continue

            self.voices[voice_id] = wrapper
            self.voice_metadata[voice_id] = {
                "id": voice_id,
                "label": config.get("label", voice_id.replace("_", " ").title()),
                "description": config.get("description", ""),
                "engine": "piper",
                "is_default": voice_id == settings.default_voice_personality,
            }

    async def synthesize(self, text: str, personality: Optional[str] = None) -> bytes:
        """Return spoken audio (wav bytes)."""
        voice_key = personality or settings.default_voice_personality
        voice = self.voices.get(voice_key)

        if voice is None:
            if self.voices:
                fallback_key = next(iter(self.voices.keys()))
                voice = self.voices[fallback_key]
            else:
                raise RuntimeError("No Piper voices are available. Check model paths.")

        return await voice.synthesize(text)

    def list_voices(self) -> Dict[str, Dict[str, Any]]:
        return self.voice_metadata


tts_service = TTSService()

