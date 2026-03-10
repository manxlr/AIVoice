# AIVoice Assistant

A local-first AI voice assistant that enables natural voice conversations with AI through speech-to-text, LLM processing, and text-to-speech synthesis. Built with FastAPI and featuring real-time WebSocket communication for seamless voice interactions.

## 🌟 Features

- 🎤 **Real-time Voice Input**: Push-to-talk audio capture with WebSocket streaming
- 🧠 **LLM Integration**: Compatible with LM Studio (OpenAI-compatible API) for intelligent responses
- 🗣️ **Multiple Voice Personalities**: Switch between 6+ pre-configured voices with different tones and styles
- ⚡ **Low Latency**: Local processing with GPU acceleration for fast transcription and synthesis
- 💬 **Dual Input Modes**: Voice input via microphone or text input for typed queries
- 🎨 **Modern UI**: Clean, responsive interface with structured response formatting
- 🔧 **Settings Management**: Comprehensive configuration with connection testing
- 🔄 **Real-time Streaming**: WebSocket-based communication for instant feedback
- 📝 **Conversation History**: View transcripts and assistant responses with copy functionality

## 🛠️ Tech Stack

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

## 📋 Prerequisites

- **Python 3.12+** (using system interpreter)
- **NVIDIA GPU** with CUDA support (recommended for optimal performance)
- **LM Studio** installed and running locally
  - Configure to expose OpenAI-compatible API
  - Default endpoint: `http://localhost:1234/v1/chat/completions`
- **Modern Browser** (Chromium-based recommended for best MediaRecorder support)

## 🚀 Installation

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

## ▶️ Usage

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
4. **Settings**: Click the gear icon to configure backend connections and voice preferences
5. **Copy Responses**: Use the copy buttons next to responses or the global copy button

## ⚙️ Configuration

### Settings Panel

Access the settings panel by clicking the gear icon in the interface:

- **Connection Settings**: Configure backend URL and LLM API endpoint with live testing
- **Voice Settings**: Select default voice personality
- **Persistence**: Settings are saved locally in browser storage
- **Reset Options**: Restore defaults or reset all settings

### Default Configuration

```json
{
  "backend_url": "http://localhost:8003",
  "llm_api_url": "http://192.0.2.75:1234/v1/chat/completions",
  "llm_model": "qwen/qwen3-4b-2507",
  "stt_model": "base",
  "stt_device": "cuda",
  "stt_compute_type": "float16",
  "piper_model_root": "E:/AI_Models/Voice/piper",
  "default_voice_personality": "professional_female"
}
```

## 🎭 Available Voices

| Voice ID | Label | Description |
|----------|-------|-------------|
| `professional_female` | Professional Female | Clear, confident business voice |
| `professional_male` | Professional Male | Balanced male delivery |
| `seductive_female` | Seductive Female | Smooth, lower cadence |
| `romantic_female` | Romantic Female | Warm and intimate tone |
| `deep_male` | Deep Male | Resonant, low register |
| `energetic_male` | Energetic Male | Upbeat, higher energy |

## 🐛 Troubleshooting

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
- Verify the LLM API URL in settings matches your LM Studio configuration
- Check network connectivity and firewall settings

### WebSocket Connection Issues
- Ensure backend is running on the configured port
- Check CORS settings if accessing from a different origin

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- [faster-whisper](https://github.com/guillaumekln/faster-whisper) for efficient Whisper inference
- [Piper TTS](https://github.com/rhasspy/piper) for fast, local text-to-speech
- [LM Studio](https://lmstudio.ai/) for local LLM inference
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework

---
**Version**: 1.0.0  
**Author**: manxlr  
**Email**: nszeeshankhalid@gmail.com