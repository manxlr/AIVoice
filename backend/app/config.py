from pathlib import Path
from typing import Dict, Optional

from pydantic import Field
from pydantic_settings import BaseSettings

from app.utils.voice_loader import load_voice_configs

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_VOICE_CONFIG_DIR = BASE_DIR / "voices"


class Settings(BaseSettings):
    """Application configuration."""

    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    # LM Studio (OpenAI-compatible)
    llm_api_url: str = Field(
        default="http://192.168.18.83:1234/v1/chat/completions", alias="LLM_API_URL"
    )
    llm_model: str = Field(default="qwen/qwen3-4b-2507", alias="LLM_MODEL")
    llm_temperature: float = Field(default=0.7, alias="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(default=512, alias="LLM_MAX_TOKENS")

    # STT
    stt_model: str = Field(default="base", alias="STT_MODEL")
    stt_device: str = Field(default="cuda", alias="STT_DEVICE")
    stt_compute_type: str = Field(default="float16", alias="STT_COMPUTE_TYPE")
    stt_language: Optional[str] = Field(default="en", alias="STT_LANGUAGE")

    # Voice configuration paths
    voice_config_dir: Path = Field(
        default=DEFAULT_VOICE_CONFIG_DIR, alias="VOICE_CONFIG_DIR"
    )
    piper_model_root: Path = Field(
        default=Path("E:/AI_Models/Voice/piper"), alias="PIPER_MODEL_ROOT"
    )

    default_voice_personality: str = Field(
        default="professional_female", alias="DEFAULT_VOICE_PERSONALITY"
    )

    voice_personalities: Dict[str, Dict] = Field(default_factory=dict)

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
settings.voice_personalities = load_voice_configs(
    settings.voice_config_dir,
    settings.piper_model_root,
)

