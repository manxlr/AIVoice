# AIVoice


A local-first AI voice assistant that enables natural voice conversations with AI through speech-to-text, LLM processing, and text-to-speech synthesis. Built with FastAPI and featuring real-time WebSocket communication for seamless voice interactions.
**Note**
Will upload the files soon, the basic workflow is running.

## Description

AIVoice is a full-stack voice assistant application that processes voice input through a complete pipeline: capturing audio from your microphone, transcribing it using Whisper, generating intelligent responses via an LLM (LM Studio), and converting the responses back to natural-sounding speech using Piper TTS. The application features multiple voice personalities, a modern web interface, and is designed to run entirely locally for privacy and low latency.

## Features

- 🎤 **Real-time Voice Input**: Push-to-talk audio capture with WebSocket streaming
- 🧠 **LLM Integration**: Compatible with LM Studio (OpenAI-compatible API) for intelligent responses
- 🗣️ **Multiple Voice Personalities**: Switch between 6+ pre-configured voices with different tones and styles
- ⚡ **Low Latency**: Local processing with GPU acceleration for fast transcription and synthesis
- 💬 **Dual Input Modes**: Voice input via microphone or text input for typed queries
- 🎨 **Modern UI**: Clean, responsive interface built with vanilla JavaScript and Tailwind CSS
- 🔄 **Real-time Streaming**: WebSocket-based communication for instant feedback
- 📝 **Conversation History**: View transcripts and assistant responses in a chat-like interface

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **faster-whisper** - GPU-accelerated speech-to-text (Whisper model)
- **Piper TTS** - Fast, local text-to-speech synthesis
- **WebSockets** - Real-time bidirectional communication
- **LM Studio** - Local LLM inference (OpenAI-compatible)

### Frontend
- **Vanilla JavaScript** - Modular, lightweight client code
- **Tailwind CSS** - Utility-first CSS framework
- **Web Audio API** - Audio capture and playback
- **WebSocket API** - Real-time server communication

## Prerequisites

- **Python 3.12+** (using system interpreter)
- **NVIDIA GPU** with CUDA support (recommended for optimal performance)
- **LM Studio** installed and running locally
  - Configure to expose OpenAI-compatible API
  - Default endpoint: `http://localhost:1234/v1/chat/completions`
- **Modern Browser** (Chromium-based recommended for best MediaRecorder support)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/manxlr/AIVoice.git
cd AIVoice
```

### 2. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Download AI Models

#### Speech-to-Text (Whisper)

The faster-whisper model will be automatically downloaded on first use. To pre-download:

```python
from faster_whisper import WhisperModel
WhisperModel("base")  # Downloads base model
```

#### Text-to-Speech (Piper)

Download Piper voice models to your desired directory (default: `E:\AI_Models\Voice\piper\` on Windows):

```bash
# Create piper directory
mkdir -p /path/to/piper/models

# Download voices (example for Windows PowerShell)
curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx" -o piper\en_US-amy-medium.onnx
curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx" -o piper\en_US-ryan-medium.onnx
# ... (see available voices in voices/ directory)
```

Or use the provided `download_models.bat` script (Windows).

### 4. Configure Environment Variables

Create a `.env` file in the `backend/` directory (optional):

```env
# LLM Configuration
LLM_API_URL=http://localhost:1234/v1/chat/completions
LLM_MODEL=qwen/qwen3-4b-2507
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=512

# STT Configuration
STT_MODEL=base
STT_DEVICE=cuda
STT_COMPUTE_TYPE=float16
STT_LANGUAGE=en

# TTS Configuration
PIPER_MODEL_ROOT=E:/AI_Models/Voice/piper
DEFAULT_VOICE_PERSONALITY=professional_female

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### 5. Start LM Studio

Ensure LM Studio is running and the API server is active on the configured port.

## Usage

### Starting the Backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.

### Starting the Frontend

```bash
cd frontend
python -m http.server 3000
```

Or use any static file server:

```bash
# Using Node.js http-server
npx http-server -p 3000

# Using Python
python -m http.server 3000
```

Open `http://localhost:3000` in your browser.

### Using the Application

1. **Voice Input**: Press and hold the "Hold To Talk" button, speak your query, then release to process
2. **Text Input**: Type a message in the text input field and press Send
3. **Voice Selection**: Choose a voice personality from the sidebar to change the assistant's tone
4. **View Conversation**: Review transcripts and responses in the conversation panel

## Available Voices

| Voice ID | Label | Description |
|----------|-------|-------------|
| `professional_female` | Professional Female | Clear, confident business voice |
| `professional_male` | Professional Male | Balanced male delivery |
| `seductive_female` | Seductive Female | Smooth, lower cadence |
| `romantic_female` | Romantic Female | Warm and intimate tone |
| `deep_male` | Deep Male | Resonant, low register |
| `energetic_male` | Energetic Male | Upbeat, higher energy |

### Adding Custom Voices

1. Download a Piper `.onnx` model file
2. Create a JSON configuration file in `backend/voices/`:

```json
{
  "id": "your_voice_id",
  "label": "Your Voice Label",
  "engine": "piper",
  "model_filename": "your-model.onnx",
  "description": "Voice description"
}
```

3. Place the `.onnx` file in your `PIPER_MODEL_ROOT` directory
4. Restart the backend server

## Project Structure

```
AIVoice/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── connection_manager.py    # WebSocket connection management
│   │   ├── routers/
│   │   │   ├── api.py                    # REST API endpoints
│   │   │   └── websocket.py              # WebSocket handlers
│   │   ├── services/
│   │   │   ├── llm_service.py            # LLM integration (LM Studio)
│   │   │   ├── stt_service.py            # Speech-to-text (Whisper)
│   │   │   └── tts_service.py            # Text-to-speech (Piper)
│   │   ├── utils/
│   │   │   └── voice_loader.py           # Voice configuration loader
│   │   ├── config.py                      # Application settings
│   │   └── main.py                        # FastAPI application
│   ├── voices/                            # Voice personality configurations
│   └── requirements.txt                   # Python dependencies
├── frontend/
│   ├── css/
│   │   └── styles.css                     # Custom styles
│   ├── js/
│   │   ├── main.js                        # Main application logic
│   │   ├── audioCapture.js                # Audio recording
│   │   ├── audioPlayback.js               # Audio playback
│   │   └── socketClient.js                # WebSocket client
│   └── index.html                          # Main HTML page
└── README.md
```

## Configuration

### Voice Configuration

Voice personalities are defined in JSON files under `backend/voices/`. Each file specifies:
- Voice ID and label
- Model filename
- Engine type (currently supports Piper)
- Optional synthesis parameters

### LLM Configuration

The application connects to LM Studio's OpenAI-compatible API. Configure the endpoint and model in your `.env` file or environment variables.

### STT/TTS Configuration

- **STT Device**: Use `cuda` for GPU acceleration or `cpu` for CPU-only
- **Compute Type**: `float16` for faster GPU inference, `float32` for higher accuracy
- **Model Size**: `base` is recommended for balance of speed and accuracy

## Troubleshooting

### No Audio Output
- Verify Piper model files are in the correct directory
- Check backend logs for voice loading errors
- Ensure audio permissions are granted in your browser

### Transcription Issues
- Grant microphone permissions in your browser
- Check browser console for MediaRecorder errors
- Verify faster-whisper model is downloaded

### LLM Connection Errors
- Ensure LM Studio is running and API server is active
- Verify the `LLM_API_URL` matches your LM Studio configuration
- Check network connectivity and firewall settings

### WebSocket Connection Issues
- Ensure backend is running on the configured port
- Check CORS settings if accessing from a different origin
- For remote access, configure HTTPS/WSS (not included in MVP)

### GPU Not Detected
- Install CUDA toolkit matching your GPU
- Verify CUDA is accessible: `nvidia-smi`
- Fall back to CPU by setting `STT_DEVICE=cpu` in `.env`

## Development

### Running in Development Mode

The backend includes auto-reload for development:

```bash
uvicorn app.main:app --reload
```

### Extending the Application

- **New Voice Engines**: Add support in `tts_service.py` by implementing a new wrapper class
- **Additional Services**: Create new service modules in `app/services/`
- **Frontend Features**: Extend modules in `frontend/js/` for new UI capabilities

## License

Open-source, use wherever.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [faster-whisper](https://github.com/guillaumekln/faster-whisper) for efficient Whisper inference
- [Piper TTS](https://github.com/rhasspy/piper) for fast, local text-to-speech
- [LM Studio](https://lmstudio.ai/) for local LLM inference
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework

---

**Note**: This is an MVP (Minimum Viable Product) focused on core functionality. Additional features like HTTPS/WSS support, user authentication, and advanced session management can be added as needed.
