import json
from pathlib import Path
from typing import Any, Dict


def load_voice_configs(
    voices_dir: Path,
    model_root: Path,
) -> Dict[str, Dict[str, Any]]:
    """
    Load voice configuration files from directory.

    Each JSON file should contain at minimum:
      {
        "id": "identifier",
        "label": "Display Name",
        "engine": "piper",
        "model_filename": "en_US-amy-medium.onnx",
        "description": "Optional"
      }

    Additional optional fields: "config_filename", "synthesis" dict.
    """
    voices: Dict[str, Dict[str, Any]] = {}

    if not voices_dir.exists():
        return voices

    for path in voices_dir.glob("*.json"):
        try:
            with path.open("r", encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception:
            continue

        voice_id = data.get("id") or path.stem
        model_filename = data.get("model_filename")
        if not voice_id or not model_filename:
            continue

        model_path = (model_root / model_filename).resolve()
        config_filename = data.get("config_filename")
        config_path = None
        if config_filename:
            candidate = (model_root / config_filename).resolve()
            if candidate.exists():
                config_path = candidate
        else:
            json_candidate = model_path.with_suffix(model_path.suffix + ".json")
            if json_candidate.exists():
                config_path = json_candidate

        data["model_path"] = str(model_path)
        if config_path:
            data["config_path"] = str(config_path)

        voices[voice_id] = data

    return voices

