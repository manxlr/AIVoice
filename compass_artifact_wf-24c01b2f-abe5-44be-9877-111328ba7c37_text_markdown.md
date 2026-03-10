# Voice-Mode AI Assistant: Complete Technical Specification

**Building a local voice-enabled AI assistant with FastAPI, vanilla JavaScript, and LM Studio**

## System overview

This specification delivers a production-ready architecture for a voice-mode AI assistant running entirely on a local laptop, accessible via browser locally and remotely through Tailscale VPN. The system supports dual modes (voice + chat) with five distinct voice personalities and intelligent content routing that prevents the AI from reading code blocks aloud.

**Core capabilities achieved**: Sub-second STT latency, dual-quality TTS modes (fast roboticsounding vs slower natural-sounding), real-time WebSocket audio streaming, intelligent response detection, modular personality switching, and seamless mode transitions. The implementation prioritizes local processing, zero cloud dependencies, and practical deployment on consumer laptop hardware.

---

## Architecture overview

### System components and dataflow

The architecture consists of five main layers working in concert:

**Browser Frontend Layer** captures audio via MediaRecorder API, streams over WebSocket to backend, receives processed audio back, and manages dual UI modes (voice/chat). The frontend maintains conversation state and handles user interruptions.

**FastAPI Backend Layer** manages WebSocket connections, orchestrates the AI pipeline, routes audio through STT→LLM→Content Analysis→TTS, implements intelligent response detection, and serves both voice and text interfaces.

**STT Layer** uses faster-whisper for speech recognition, processes audio chunks in near-real-time, runs on GPU for optimal latency, and returns transcribed text to the orchestrator.

**LLM Layer** connects to LM Studio at localhost:1234, processes transcribed queries, generates markdown-formatted responses, and maintains conversation context.

**TTS Layer** implements dual-mode synthesis with Piper TTS for low-latency and StyleTTS2 for high-quality output, manages five distinct voice personalities, and streams audio back to frontend.

**Content Router** analyzes LLM responses for code blocks, tables, and lengthy content, deciding between voice output, text-only display, or hybrid approaches with alternative voice messages like "I've created the code for you, please check the chat tab."

### Data flow sequence

1. User speaks → Browser captures audio (MediaRecorder, WebM/Opus format)
2. Audio chunks stream to FastAPI via WebSocket (100ms intervals)
3. FastAPI buffers and sends to faster-whisper STT
4. Transcribed text feeds to LM Studio API
5. LLM response passes through Content Analyzer
6. Based on content type: Route to TTS (simple) OR Display text + speak alternative (code/complex)
7. TTS synthesizes with selected personality and quality mode
8. Audio streams back through WebSocket
9. Frontend plays via Web Audio API with buffered scheduling
10. Text always displays in chat interface regardless of voice output

---

## Recommended technology stack

### Backend core

**FastAPI** (v0.104+) provides async WebSocket support, automatic OpenAPI docs, and excellent performance for real-time audio streaming.

```bash
pip install fastapi==0.104.1 uvicorn[standard]==0.24.0 python-multipart==0.0.6 websockets==12.0
```

**STT Engine**: faster-whisper (v0.10.0+) delivers 4x faster transcription than OpenAI Whisper with identical accuracy.

```bash
pip install faster-whisper==0.10.0
# GPU support (CUDA 12.x)
pip install nvidia-cublas-cu12 nvidia-cudnn-cu12==9.*
```

**TTS Engines** (dual-mode implementation):

```bash
# Low latency mode
pip install piper-tts==1.2.0

# High quality mode  
pip install TTS==0.22.0  # Coqui TTS with XTTS-v2
# OR
pip install styletts2  # For best quality, requires additional setup
```

**Supporting Libraries**:

```bash
pip install python-dotenv==1.0.0  # Configuration
pip install aiofiles==23.2.1  # Async file I/O
pip install numpy==1.24.3  # Audio processing
pip install soundfile==0.12.1  # Audio format handling
pip install pydantic==2.5.0  # Data validation
```

### Frontend stack

**Vanilla JavaScript** with Web APIs—no frameworks needed. Core browser APIs used:

- **MediaRecorder API**: Audio capture
- **WebSocket API**: Bidirectional streaming
- **Web Audio API**: Playback scheduling
- **AudioContext**: Buffer management

**Optional CSS Framework**: TailwindCSS via CDN for rapid UI development.

### LLM integration

**LM Studio** running locally at http://localhost:1234/v1/chat/completions with OpenAI-compatible API. Recommended models: Mistral-7B, LLaMA-2-7B, or similar size for laptop deployment.

### Development tools

```bash
pip install pytest==7.4.3  # Testing
pip install black==23.12.0  # Code formatting
pip install mypy==1.7.1  # Type checking
```

---

## Project structure

```
voice-assistant/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application entry
│   │   ├── config.py               # Configuration management
│   │   ├── models.py               # Pydantic models
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── stt_service.py     # faster-whisper integration
│   │   │   ├── llm_service.py     # LM Studio client
│   │   │   ├── tts_service.py     # Dual-mode TTS manager
│   │   │   ├── content_analyzer.py # Response detection
│   │   │   └── audio_processor.py  # Audio format handling
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── websocket.py       # WebSocket endpoints
│   │   │   └── api.py             # REST endpoints
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── connection_manager.py  # WebSocket management
│   │   │   └── session_manager.py     # User sessions
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   │
│   ├── models/                     # TTS/STT model storage
│   │   ├── whisper/
│   │   ├── piper/
│   │   └── styletts2/
│   │
│   ├── voices/                     # Voice personality configs
│   │   ├── seductive_female.json
│   │   ├── professional_male.json
│   │   ├── professional_female.json
│   │   ├── youtuber_male.json
│   │   └── enthusiastic_female.json
│   │
│   ├── requirements.txt
│   ├── .env                        # Environment configuration
│   └── run.sh                      # Startup script
│
├── frontend/
│   ├── index.html                  # Main application
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── main.js                 # Application entry
│   │   ├── audio-capture.js        # MediaRecorder handler
│   │   ├── audio-playback.js       # Web Audio API handler
│   │   ├── websocket-client.js     # WebSocket management
│   │   ├── ui-controller.js        # Mode switching, animations
│   │   └── config.js               # Frontend configuration
│   └── assets/
│       ├── icons/
│       └── animations/
│
├── tests/
│   ├── test_stt.py
│   ├── test_tts.py
│   ├── test_content_analyzer.py
│   └── test_integration.py
│
├── docs/
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── docker-compose.yml             # Optional containerization
├── Dockerfile
└── README.md
```

---

## Backend implementation

### Configuration system (backend/app/config.py)

```python
from pydantic_settings import BaseSettings
from typing import Dict

class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # LM Studio
    LLM_API_URL: str = "http://localhost:1234/v1/chat/completions"
    LLM_MODEL: str = "local-model"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 2000
    
    # STT Configuration
    STT_MODEL: str = "large-v3-turbo"  # or "base", "small", "medium"
    STT_DEVICE: str = "cuda"  # or "cpu"
    STT_COMPUTE_TYPE: str = "float16"  # or "int8" for CPU
    STT_LANGUAGE: str = "en"
    
    # TTS Configuration
    TTS_LOW_LATENCY_ENGINE: str = "piper"
    TTS_HIGH_QUALITY_ENGINE: str = "styletts2"  # or "xtts"
    TTS_DEFAULT_MODE: str = "auto"  # "fast", "quality", "auto"
    
    # Piper TTS paths
    PIPER_MODEL_PATH: str = "./models/piper/en_US-amy-medium.onnx"
    
    # Voice Personalities
    VOICE_PERSONALITIES: Dict = {
        "professional_female": {
            "engine": "piper",
            "model": "en_US-amy-medium",
            "speed": 0.95,
            "pitch": 0
        },
        "professional_male": {
            "engine": "piper",
            "model": "en_US-ryan-medium",
            "speed": 0.92,
            "pitch": -3
        },
        "seductive_female": {
            "engine": "styletts2",
            "reference_audio": "./voices/seductive_sample.wav",
            "alpha": 0.4,
            "beta": 0.6,
            "embedding_scale": 1.3,
            "speed": 0.8
        },
        "youtuber_male": {
            "engine": "xtts",
            "reference_audio": "./voices/energetic_male.wav",
            "speed": 1.2,
            "emotion": "excited"
        },
        "enthusiastic_female": {
            "engine": "styletts2",
            "reference_audio": "./voices/enthusiastic_sample.wav",
            "alpha": 0.5,
            "beta": 0.9,
            "embedding_scale": 1.4,
            "speed": 1.1
        }
    }
    
    # Content Analysis Thresholds
    MAX_VOICE_LENGTH: int = 300  # words
    MIN_CODE_BLOCK_SIZE: int = 10  # characters
    
    # Audio Settings
    AUDIO_SAMPLE_RATE: int = 16000
    AUDIO_CHUNK_MS: int = 100
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### STT Service (backend/app/services/stt_service.py)

```python
from faster_whisper import WhisperModel
import numpy as np
import io
import soundfile as sf
from typing import Optional
import asyncio
from app.config import settings

class STTService:
    def __init__(self):
        self.model: Optional[WhisperModel] = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize faster-whisper model on startup"""
        try:
            self.model = WhisperModel(
                settings.STT_MODEL,
                device=settings.STT_DEVICE,
                compute_type=settings.STT_COMPUTE_TYPE,
                num_workers=4
            )
            print(f"STT Model loaded: {settings.STT_MODEL} on {settings.STT_DEVICE}")
        except Exception as e:
            print(f"Failed to load STT model: {e}")
            raise
    
    async def transcribe_audio(
        self, 
        audio_data: bytes,
        language: str = None
    ) -> dict:
        """
        Transcribe audio bytes to text
        
        Args:
            audio_data: Raw audio bytes (WebM, WAV, etc.)
            language: Override language detection
            
        Returns:
            dict with 'text', 'language', 'confidence'
        """
        try:
            # Convert bytes to numpy array
            audio_array, sample_rate = sf.read(io.BytesIO(audio_data))
            
            # Ensure mono
            if len(audio_array.shape) > 1:
                audio_array = audio_array.mean(axis=1)
            
            # Run transcription in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            segments, info = await loop.run_in_executor(
                None,
                lambda: self.model.transcribe(
                    audio_array,
                    language=language or settings.STT_LANGUAGE,
                    beam_size=5,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500)
                )
            )
            
            # Collect segments
            text = " ".join([segment.text for segment in segments])
            
            return {
                "text": text.strip(),
                "language": info.language,
                "confidence": info.language_probability,
                "duration": info.duration
            }
            
        except Exception as e:
            print(f"Transcription error: {e}")
            return {
                "text": "",
                "language": "en",
                "confidence": 0.0,
                "error": str(e)
            }
    
    async def transcribe_stream(self, audio_chunks: list) -> str:
        """Transcribe buffered audio chunks"""
        # Combine chunks
        combined = b"".join(audio_chunks)
        result = await self.transcribe_audio(combined)
        return result["text"]

# Global instance
stt_service = STTService()
```

### Content Analyzer (backend/app/services/content_analyzer.py)

```python
import re
from typing import Dict, Optional
from app.config import settings

class ContentAnalyzer:
    """Analyzes LLM responses for voice suitability"""
    
    def __init__(self):
        self.code_fence_pattern = re.compile(r'```[\s\S]*?```')
        self.inline_code_pattern = re.compile(r'`[^`]+`')
        self.table_pattern = re.compile(r'\|.+\|\n\|[\s\-:]+\|')
        self.list_pattern = re.compile(r'^\s*[\-\+\*\d+\.]\s+', re.MULTILINE)
    
    def analyze(self, content: str) -> Dict:
        """
        Analyze content and determine routing
        
        Returns:
            {
                'should_speak': bool,
                'voice_output': str,
                'text_output': str,
                'content_type': str,
                'reasoning': str
            }
        """
        # Detect content characteristics
        has_code = bool(self.code_fence_pattern.search(content))
        inline_code_count = len(self.inline_code_pattern.findall(content))
        has_tables = bool(self.table_pattern.search(content))
        word_count = len(content.split())
        list_count = len(self.list_pattern.findall(content))
        
        # Decision logic
        if has_code:
            return {
                'should_speak': True,
                'voice_output': self._get_code_alternative(),
                'text_output': content,
                'content_type': 'code',
                'reasoning': 'Contains code blocks'
            }
        
        if has_tables:
            return {
                'should_speak': True,
                'voice_output': "I've created a table with that information. You can view it in the chat window.",
                'text_output': content,
                'content_type': 'table',
                'reasoning': 'Contains markdown tables'
            }
        
        if word_count > settings.MAX_VOICE_LENGTH:
            summary = self._extract_summary(content)
            return {
                'should_speak': True,
                'voice_output': f"{summary} The complete details are in the chat window.",
                'text_output': content,
                'content_type': 'long_form',
                'reasoning': f'Content is lengthy ({word_count} words)'
            }
        
        if list_count > 10:
            return {
                'should_speak': True,
                'voice_output': f"I've compiled a list of {list_count} items. Check the chat to review them all.",
                'text_output': content,
                'content_type': 'long_list',
                'reasoning': f'Contains {list_count} list items'
            }
        
        if inline_code_count > 5:
            cleaned = self._strip_markdown(content)
            return {
                'should_speak': True,
                'voice_output': cleaned,
                'text_output': content,
                'content_type': 'technical',
                'reasoning': 'Heavy inline code formatting'
            }
        
        # Simple content - safe for voice
        cleaned = self._strip_markdown(content)
        return {
            'should_speak': True,
            'voice_output': cleaned,
            'text_output': content,
            'content_type': 'simple',
            'reasoning': 'Voice-suitable content'
        }
    
    def _get_code_alternative(self) -> str:
        """Get varied alternative response for code"""
        alternatives = [
            "I've created the code for you, please check the chat tab.",
            "The code is ready. You can view it in the chat window.",
            "I've prepared a code solution. Check the text display to see it."
        ]
        import random
        return random.choice(alternatives)
    
    def _strip_markdown(self, text: str) -> str:
        """Remove markdown formatting for TTS"""
        # Remove code blocks
        text = re.sub(r'```[\s\S]*?```', '[code block]', text)
        # Remove inline code backticks
        text = re.sub(r'`([^`]+)`', r'\1', text)
        # Remove bold/italic
        text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
        text = re.sub(r'\*([^\*]+)\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)
        # Remove links, keep text
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        # Remove headings
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
        # Remove list markers
        text = re.sub(r'^\s*[\-\+\*]\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)
        return text.strip()
    
    def _extract_summary(self, text: str, sentences: int = 2) -> str:
        """Extract first N sentences as summary"""
        sent_list = re.split(r'[.!?]+', text)
        summary_sents = [s.strip() for s in sent_list[:sentences] if s.strip()]
        return '. '.join(summary_sents) + '.'

content_analyzer = ContentAnalyzer()
```

### TTS Service with Dual Modes (backend/app/services/tts_service.py)

```python
from piper import PiperVoice
from TTS.api import TTS
import io
import numpy as np
import soundfile as sf
from typing import Optional
import asyncio
from app.config import settings

class TTSService:
    def __init__(self):
        self.piper_voices = {}
        self.high_quality_tts = None
        self._initialize_engines()
    
    def _initialize_engines(self):
        """Initialize both TTS engines"""
        # Load Piper (low latency)
        try:
            self.piper_voices["default"] = PiperVoice.load(
                settings.PIPER_MODEL_PATH
            )
            print("Piper TTS loaded successfully")
        except Exception as e:
            print(f"Failed to load Piper: {e}")
        
        # Load high-quality engine (XTTS or StyleTTS2)
        try:
            if settings.TTS_HIGH_QUALITY_ENGINE == "xtts":
                self.high_quality_tts = TTS(
                    "tts_models/multilingual/multi-dataset/xtts_v2",
                    gpu=True
                )
                print("XTTS-v2 loaded successfully")
        except Exception as e:
            print(f"Failed to load high-quality TTS: {e}")
    
    async def synthesize(
        self,
        text: str,
        personality: str = "professional_female",
        quality_mode: str = "auto"
    ) -> bytes:
        """
        Synthesize speech with specified personality and quality
        
        Args:
            text: Text to synthesize
            personality: Voice personality key from config
            quality_mode: 'fast', 'quality', or 'auto'
            
        Returns:
            Audio bytes (WAV format)
        """
        # Get personality config
        voice_config = settings.VOICE_PERSONALITIES.get(
            personality,
            settings.VOICE_PERSONALITIES["professional_female"]
        )
        
        # Auto mode: short text = fast, long = quality
        if quality_mode == "auto":
            word_count = len(text.split())
            quality_mode = "fast" if word_count < 50 else "quality"
        
        # Route to appropriate engine
        if quality_mode == "fast":
            return await self._synthesize_piper(text, voice_config)
        else:
            return await self._synthesize_high_quality(text, voice_config)
    
    async def _synthesize_piper(
        self,
        text: str,
        config: dict
    ) -> bytes:
        """Low-latency synthesis with Piper"""
        try:
            voice = self.piper_voices["default"]
            audio_buffer = io.BytesIO()
            
            # Run in thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: voice.synthesize(
                    text,
                    audio_buffer,
                    length_scale=1.0/config.get("speed", 1.0)
                )
            )
            
            return audio_buffer.getvalue()
        except Exception as e:
            print(f"Piper synthesis error: {e}")
            raise
    
    async def _synthesize_high_quality(
        self,
        text: str,
        config: dict
    ) -> bytes:
        """High-quality synthesis with XTTS or StyleTTS2"""
        try:
            output_path = "/tmp/tts_output.wav"
            
            loop = asyncio.get_event_loop()
            
            if "reference_audio" in config:
                # Voice cloning mode
                await loop.run_in_executor(
                    None,
                    lambda: self.high_quality_tts.tts_to_file(
                        text=text,
                        speaker_wav=config["reference_audio"],
                        language="en",
                        file_path=output_path
                    )
                )
            else:
                # Standard synthesis
                await loop.run_in_executor(
                    None,
                    lambda: self.high_quality_tts.tts_to_file(
                        text=text,
                        file_path=output_path
                    )
                )
            
            # Read and return bytes
            with open(output_path, 'rb') as f:
                return f.read()
        except Exception as e:
            print(f"High-quality synthesis error: {e}")
            raise

tts_service = TTSService()
```

### WebSocket Router (backend/app/routers/websocket.py)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.stt_service import stt_service
from app.services.llm_service import llm_service
from app.services.tts_service import tts_service
from app.services.content_analyzer import content_analyzer
from app.core.connection_manager import connection_manager
import json
import asyncio

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for voice assistant"""
    
    await websocket.accept()
    client_id = id(websocket)
    await connection_manager.connect(websocket, client_id)
    
    audio_buffer = []
    session_data = {
        "conversation_history": [],
        "current_personality": "professional_female",
        "quality_mode": "auto"
    }
    
    try:
        while True:
            message = await websocket.receive()
            
            # Handle text messages (control commands)
            if "text" in message:
                data = json.loads(message["text"])
                await handle_control_message(
                    websocket,
                    data,
                    session_data
                )
            
            # Handle binary audio data
            elif "bytes" in message:
                audio_chunk = message["bytes"]
                audio_buffer.append(audio_chunk)
                
                # Process when buffer reaches threshold
                if len(audio_buffer) >= 10:  # ~1 second of audio
                    await process_voice_input(
                        websocket,
                        audio_buffer,
                        session_data
                    )
                    audio_buffer = []
    
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
        print(f"Client {client_id} disconnected")

async def handle_control_message(
    websocket: WebSocket,
    data: dict,
    session: dict
):
    """Handle control messages from client"""
    
    msg_type = data.get("type")
    
    if msg_type == "change_personality":
        session["current_personality"] = data.get("personality")
        await websocket.send_json({
            "type": "personality_changed",
            "personality": session["current_personality"]
        })
    
    elif msg_type == "change_quality":
        session["quality_mode"] = data.get("mode")
        await websocket.send_json({
            "type": "quality_changed",
            "mode": session["quality_mode"]
        })
    
    elif msg_type == "stop_audio":
        await websocket.send_json({
            "type": "stop_playback"
        })
    
    elif msg_type == "text_query":
        # Handle text-mode query
        query_text = data.get("text")
        await process_text_query(websocket, query_text, session)

async def process_voice_input(
    websocket: WebSocket,
    audio_buffer: list,
    session: dict
):
    """Process voice input through full pipeline"""
    
    try:
        # 1. STT: Transcribe audio
        transcription = await stt_service.transcribe_stream(audio_buffer)
        
        if not transcription:
            return
        
        # Send transcription to client
        await websocket.send_json({
            "type": "transcription",
            "text": transcription
        })
        
        # 2. LLM: Get response
        llm_response = await llm_service.get_completion(
            transcription,
            session["conversation_history"]
        )
        
        # Update history
        session["conversation_history"].append({
            "role": "user",
            "content": transcription
        })
        session["conversation_history"].append({
            "role": "assistant",
            "content": llm_response
        })
        
        # 3. Content Analysis: Determine routing
        analysis = content_analyzer.analyze(llm_response)
        
        # Send text to display
        await websocket.send_json({
            "type": "assistant_text",
            "text": analysis["text_output"],
            "content_type": analysis["content_type"]
        })
        
        # 4. TTS: Generate voice if appropriate
        if analysis["should_speak"]:
            audio_bytes = await tts_service.synthesize(
                analysis["voice_output"],
                personality=session["current_personality"],
                quality_mode=session["quality_mode"]
            )
            
            # Stream audio to client
            await websocket.send_bytes(audio_bytes)
            await websocket.send_json({
                "type": "audio_complete"
            })
    
    except Exception as e:
        print(f"Pipeline error: {e}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })

async def process_text_query(
    websocket: WebSocket,
    query: str,
    session: dict
):
    """Process text-only query (chat mode)"""
    
    # Same pipeline but skip STT
    llm_response = await llm_service.get_completion(
        query,
        session["conversation_history"]
    )
    
    session["conversation_history"].append({
        "role": "user",
        "content": query
    })
    session["conversation_history"].append({
        "role": "assistant",
        "content": llm_response
    })
    
    await websocket.send_json({
        "type": "assistant_text",
        "text": llm_response
    })
```

---

## Frontend implementation

### Main HTML (frontend/index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice AI Assistant</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-gray-900 text-white">
    <div class="container mx-auto p-4 max-w-4xl">
        <!-- Mode Toggle -->
        <div class="flex justify-center mb-6 space-x-4">
            <button id="voiceMode" class="px-6 py-3 bg-purple-600 rounded-lg">
                Voice Mode
            </button>
            <button id="chatMode" class="px-6 py-3 bg-gray-700 rounded-lg">
                Chat Mode
            </button>
        </div>

        <!-- Voice Mode Interface -->
        <div id="voiceModeUI" class="space-y-6">
            <!-- Voice Personality Selector -->
            <div class="bg-gray-800 p-4 rounded-lg">
                <label class="block mb-2">Voice Personality</label>
                <select id="personalitySelect" class="w-full p-2 bg-gray-700 rounded">
                    <option value="professional_female">Professional Female</option>
                    <option value="professional_male">Professional Male</option>
                    <option value="seductive_female">Seductive Female</option>
                    <option value="youtuber_male">YouTuber Male</option>
                    <option value="enthusiastic_female">Enthusiastic Female</option>
                </select>
            </div>

            <!-- Quality Mode Toggle -->
            <div class="bg-gray-800 p-4 rounded-lg">
                <label class="block mb-2">Quality Mode</label>
                <div class="flex space-x-4">
                    <button id="fastMode" class="px-4 py-2 bg-green-600 rounded">
                        Fast (< 1s)
                    </button>
                    <button id="qualityMode" class="px-4 py-2 bg-gray-600 rounded">
                        Quality (2-5s)
                    </button>
                    <button id="autoMode" class="px-4 py-2 bg-gray-600 rounded">
                        Auto
                    </button>
                </div>
            </div>

            <!-- Voice Animation -->
            <div class="flex justify-center items-center h-64 bg-gray-800 rounded-lg">
                <div id="voiceAnimation" class="relative">
                    <div class="w-32 h-32 bg-purple-600 rounded-full animate-pulse"></div>
                    <p id="speakerLabel" class="text-center mt-4">Ready to listen...</p>
                </div>
            </div>

            <!-- Push to Talk Button -->
            <div class="flex justify-center">
                <button id="pushToTalk" class="w-24 h-24 bg-red-600 rounded-full hover:bg-red-700 active:bg-red-800">
                    <svg class="w-12 h-12 mx-auto" fill="white" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                </button>
            </div>

            <!-- Transcription Display -->
            <div class="bg-gray-800 p-4 rounded-lg min-h-24">
                <p id="transcription" class="text-gray-400 italic">
                    Your speech will appear here...
                </p>
            </div>
        </div>

        <!-- Chat Mode Interface -->
        <div id="chatModeUI" class="hidden space-y-6">
            <!-- Chat History -->
            <div id="chatHistory" class="bg-gray-800 p-4 rounded-lg h-96 overflow-y-auto space-y-4">
                <!-- Messages will be added here dynamically -->
            </div>

            <!-- Chat Input -->
            <div class="flex space-x-2">
                <input 
                    id="chatInput" 
                    type="text" 
                    placeholder="Type your message..."
                    class="flex-1 p-3 bg-gray-800 rounded-lg"
                />
                <button id="sendBtn" class="px-6 py-3 bg-purple-600 rounded-lg">
                    Send
                </button>
            </div>
        </div>

        <!-- Status Indicator -->
        <div id="status" class="mt-4 text-center text-sm">
            <span id="connectionStatus" class="text-gray-400">Connecting...</span>
        </div>
    </div>

    <script type="module" src="js/main.js"></script>
</body>
</html>
```

### WebSocket Client (frontend/js/websocket-client.js)

```javascript
export class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.handlers = {
            onOpen: () => {},
            onMessage: () => {},
            onClose: () => {},
            onError: () => {}
        };
    }

    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = (event) => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.handlers.onOpen(event);
        };

        this.ws.onmessage = (event) => {
            if (typeof event.data === 'string') {
                const data = JSON.parse(event.data);
                this.handlers.onMessage(data, 'json');
            } else {
                // Binary audio data
                this.handlers.onMessage(event.data, 'audio');
            }
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket closed');
            this.handlers.onClose(event);
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handlers.onError(error);
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting... (${this.reconnectAttempts})`);
                this.connect();
            }, 2000 * this.reconnectAttempts);
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            if (data instanceof ArrayBuffer || data instanceof Blob) {
                this.ws.send(data);
            } else {
                this.ws.send(JSON.stringify(data));
            }
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }

    on(event, handler) {
        if (event in this.handlers) {
            this.handlers[event] = handler;
        }
    }
}
```

### Audio Capture (frontend/js/audio-capture.js)

```javascript
export class AudioCapture {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.isRecording = false;
        this.onDataAvailable = null;
    }

    async initialize() {
        try {
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });

            // Check supported MIME types
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: mimeType,
                audioBitsPerSecond: 24000
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && this.onDataAvailable) {
                    this.onDataAvailable(event.data);
                }
            };

            console.log('Audio capture initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize audio capture:', error);
            return false;
        }
    }

    start() {
        if (this.mediaRecorder && !this.isRecording) {
            this.mediaRecorder.start(100); // 100ms chunks
            this.isRecording = true;
            console.log('Recording started');
        }
    }

    stop() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            console.log('Recording stopped');
        }
    }

    cleanup() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
    }
}
```

### Audio Playback (frontend/js/audio-playback.js)

```javascript
export class AudioPlayback {
    constructor() {
        this.audioContext = null;
        this.nextStartTime = 0;
        this.sourceQueue = [];
    }

    async initialize() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio playback initialized');
    }

    async playAudio(audioData) {
        try {
            // Resume context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Decode audio data
            const arrayBuffer = await audioData.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Create source
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            // Schedule playback
            const currentTime = this.audioContext.currentTime;
            const startTime = Math.max(currentTime, this.nextStartTime);
            
            source.start(startTime);
            this.nextStartTime = startTime + audioBuffer.duration;

            // Track sources
            this.sourceQueue.push(source);
            source.onended = () => {
                const index = this.sourceQueue.indexOf(source);
                if (index > -1) {
                    this.sourceQueue.splice(index, 1);
                }
            };

            return audioBuffer.duration;
        } catch (error) {
            console.error('Playback error:', error);
        }
    }

    stopAll() {
        this.sourceQueue.forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {}
        });
        this.sourceQueue = [];
        this.nextStartTime = this.audioContext.currentTime;
    }
}
```

### Main Application (frontend/js/main.js)

```javascript
import { WebSocketClient } from './websocket-client.js';
import { AudioCapture } from './audio-capture.js';
import { AudioPlayback } from './audio-playback.js';

class VoiceAssistant {
    constructor() {
        this.ws = new WebSocketClient('ws://localhost:8000/ws');
        this.audioCapture = new AudioCapture();
        this.audioPlayback = new AudioPlayback();
        
        this.currentMode = 'voice';
        this.isAssistantSpeaking = false;
        
        this.elements = {
            voiceModeUI: document.getElementById('voiceModeUI'),
            chatModeUI: document.getElementById('chatModeUI'),
            pushToTalk: document.getElementById('pushToTalk'),
            transcription: document.getElementById('transcription'),
            chatHistory: document.getElementById('chatHistory'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            personalitySelect: document.getElementById('personalitySelect'),
            speakerLabel: document.getElementById('speakerLabel'),
            voiceAnimation: document.getElementById('voiceAnimation'),
            connectionStatus: document.getElementById('connectionStatus'),
            fastMode: document.getElementById('fastMode'),
            qualityMode: document.getElementById('qualityMode'),
            autoMode: document.getElementById('autoMode')
        };
    }

    async initialize() {
        // Initialize audio systems
        await this.audioCapture.initialize();
        await this.audioPlayback.initialize();

        // Setup WebSocket handlers
        this.setupWebSocket();

        // Setup UI event listeners
        this.setupEventListeners();

        // Connect WebSocket
        this.ws.connect();
    }

    setupWebSocket() {
        this.ws.on('onOpen', () => {
            this.elements.connectionStatus.textContent = 'Connected';
            this.elements.connectionStatus.className = 'text-green-400';
        });

        this.ws.on('onMessage', (data, type) => {
            if (type === 'json') {
                this.handleJSONMessage(data);
            } else if (type === 'audio') {
                this.handleAudioMessage(data);
            }
        });

        this.ws.on('onClose', () => {
            this.elements.connectionStatus.textContent = 'Disconnected';
            this.elements.connectionStatus.className = 'text-red-400';
        });

        // Send audio chunks to server
        this.audioCapture.onDataAvailable = (audioBlob) => {
            this.ws.send(audioBlob);
        };
    }

    handleJSONMessage(data) {
        switch (data.type) {
            case 'transcription':
                this.elements.transcription.textContent = data.text;
                this.elements.speakerLabel.textContent = 'You said: ' + data.text;
                this.addChatMessage(data.text, 'user');
                break;

            case 'assistant_text':
                this.addChatMessage(data.text, 'assistant');
                this.elements.speakerLabel.textContent = 'Assistant responding...';
                break;

            case 'audio_complete':
                this.isAssistantSpeaking = false;
                this.elements.speakerLabel.textContent = 'Ready to listen...';
                break;

            case 'stop_playback':
                this.audioPlayback.stopAll();
                this.isAssistantSpeaking = false;
                break;

            case 'error':
                console.error('Server error:', data.message);
                this.elements.speakerLabel.textContent = 'Error: ' + data.message;
                break;
        }
    }

    async handleAudioMessage(audioData) {
        this.isAssistantSpeaking = true;
        this.elements.speakerLabel.textContent = 'Assistant speaking...';
        await this.audioPlayback.playAudio(audioData);
    }

    setupEventListeners() {
        // Mode switching
        document.getElementById('voiceMode').addEventListener('click', () => {
            this.switchMode('voice');
        });

        document.getElementById('chatMode').addEventListener('click', () => {
            this.switchMode('chat');
        });

        // Push to talk
        this.elements.pushToTalk.addEventListener('mousedown', () => {
            if (this.isAssistantSpeaking) {
                this.stopAssistant();
            } else {
                this.audioCapture.start();
                this.elements.speakerLabel.textContent = 'Listening...';
            }
        });

        this.elements.pushToTalk.addEventListener('mouseup', () => {
            this.audioCapture.stop();
            this.elements.speakerLabel.textContent = 'Processing...';
        });

        // Chat mode
        this.elements.sendBtn.addEventListener('click', () => {
            this.sendTextMessage();
        });

        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendTextMessage();
            }
        });

        // Voice personality
        this.elements.personalitySelect.addEventListener('change', (e) => {
            this.ws.send({
                type: 'change_personality',
                personality: e.target.value
            });
        });

        // Quality modes
        this.elements.fastMode.addEventListener('click', () => {
            this.setQualityMode('fast');
        });

        this.elements.qualityMode.addEventListener('click', () => {
            this.setQualityMode('quality');
        });

        this.elements.autoMode.addEventListener('click', () => {
            this.setQualityMode('auto');
        });
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        if (mode === 'voice') {
            this.elements.voiceModeUI.classList.remove('hidden');
            this.elements.chatModeUI.classList.add('hidden');
            document.getElementById('voiceMode').classList.add('bg-purple-600');
            document.getElementById('voiceMode').classList.remove('bg-gray-700');
            document.getElementById('chatMode').classList.remove('bg-purple-600');
            document.getElementById('chatMode').classList.add('bg-gray-700');
        } else {
            this.elements.voiceModeUI.classList.add('hidden');
            this.elements.chatModeUI.classList.remove('hidden');
            document.getElementById('chatMode').classList.add('bg-purple-600');
            document.getElementById('chatMode').classList.remove('bg-gray-700');
            document.getElementById('voiceMode').classList.remove('bg-purple-600');
            document.getElementById('voiceMode').classList.add('bg-gray-700');
        }
    }

    sendTextMessage() {
        const text = this.elements.chatInput.value.trim();
        if (text) {
            this.ws.send({
                type: 'text_query',
                text: text
            });
            this.elements.chatInput.value = '';
        }
    }

    addChatMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' 
            ? 'bg-purple-600 p-3 rounded-lg ml-12'
            : 'bg-gray-700 p-3 rounded-lg mr-12';
        
        // Render markdown for assistant messages
        if (sender === 'assistant') {
            messageDiv.innerHTML = this.renderMarkdown(text);
        } else {
            messageDiv.textContent = text;
        }
        
        this.elements.chatHistory.appendChild(messageDiv);
        this.elements.chatHistory.scrollTop = this.elements.chatHistory.scrollHeight;
    }

    renderMarkdown(text) {
        // Basic markdown rendering
        text = text.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        return text;
    }

    setQualityMode(mode) {
        this.ws.send({
            type: 'change_quality',
            mode: mode
        });

        // Update button states
        ['fastMode', 'qualityMode', 'autoMode'].forEach(id => {
            this.elements[id].classList.remove('bg-green-600');
            this.elements[id].classList.add('bg-gray-600');
        });

        const modeMap = { fast: 'fastMode', quality: 'qualityMode', auto: 'autoMode' };
        this.elements[modeMap[mode]].classList.add('bg-green-600');
        this.elements[modeMap[mode]].classList.remove('bg-gray-600');
    }

    stopAssistant() {
        this.audioPlayback.stopAll();
        this.ws.send({ type: 'stop_audio' });
        this.elements.speakerLabel.textContent = 'Interrupted';
    }
}

// Initialize application
const app = new VoiceAssistant();
app.initialize();
```

---

## Voice personality implementation guide

### Creating reference audio samples

For the five distinct personalities, record or source 15-30 second audio samples:

**Professional Female**: Clear, confident businesswoman voice. Record neutral news-style reading with moderate pitch, steady pace, minimal emotion. Example script: "Thank you for calling. I'm here to assist you with your account today. Let me pull up your information."

**Professional Male**: Authoritative, lower pitch male voice. Business-appropriate tone with confidence. Example: "Welcome to the quarterly review meeting. Today we'll discuss performance metrics and strategic initiatives."

**Seductive Female**: Lower, breathy female voice with slower cadence. Intimate projection, descending intonation. Example: "Why don't you stay a little longer... I promise it will be worth your time."

**YouTuber Male**: Energetic, enthusiastic young male with varied pitch. Fast-paced, excited delivery. Example: "Hey what's up guys! Today we're gonna do something ABSOLUTELY INSANE! Make sure to smash that like button!"

**Enthusiastic Female**: Upbeat female with high energy, higher pitch variation. Quick tempo, bright tone. Example: "Oh my gosh, this is SO exciting! I can't wait to show you all the amazing features we've built!"

### Configuration files

Save personality configs in `backend/voices/`:

**professional_female.json**:
```json
{
  "name": "professional_female",
  "engine": "piper",
  "model": "en_US-amy-medium",
  "parameters": {
    "speed": 0.95,
    "pitch": 0,
    "energy": "moderate"
  },
  "description": "Clear, confident professional voice",
  "fallback_engine": "xtts",
  "reference_audio": null
}
```

**seductive_female.json**:
```json
{
  "name": "seductive_female",
  "engine": "styletts2",
  "model": null,
  "parameters": {
    "speed": 0.8,
    "pitch": -3,
    "alpha": 0.4,
    "beta": 0.6,
    "embedding_scale": 1.3,
    "diffusion_steps": 7
  },
  "description": "Sultry, intimate voice with breathy quality",
  "reference_audio": "./voices/samples/seductive_sample.wav"
}
```

---

## Deployment instructions

### Local development setup

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download models
python -c "from faster_whisper import WhisperModel; WhisperModel('large-v3-turbo')"

# Download Piper voice
wget "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx" -O models/piper/en_US-amy-medium.onnx

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
python -m http.server 3000
# Or use: npx serve .
```

### Tailscale VPN setup

```bash
# Install Tailscale on laptop
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Get Tailscale IP
tailscale ip -4
# Example output: 100.89.43.21

# Update frontend WebSocket URL
# In frontend/js/main.js:
// For local: ws://localhost:8000/ws
// For Tailscale: ws://100.89.43.21:8000/ws

# Configure CORS in backend
# In backend/app/main.py, add:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify Tailscale IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Production deployment with systemd

Create service file `/etc/systemd/system/voice-assistant.service`:

```ini
[Unit]
Description=Voice Assistant Backend
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/voice-assistant/backend
Environment="PATH=/home/youruser/voice-assistant/backend/venv/bin"
ExecStart=/home/youruser/voice-assistant/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable voice-assistant
sudo systemctl start voice-assistant
```

### Docker deployment (optional)

```dockerfile
FROM nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y \
    python3.11 python3-pip ffmpeg wget

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

# Download models
RUN python3 -c "from faster_whisper import WhisperModel; WhisperModel('large-v3-turbo')"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Performance optimization

### Hardware recommendations

**Minimum** (CPU-only, fast mode): Intel i5-8th gen, 8GB RAM, integrated graphics. Piper TTS + Whisper base. Expected latency: 2-3 seconds total.

**Recommended** (GPU-accelerated, dual mode): Intel i7-12th gen or Ryzen 7, 16GB RAM, NVIDIA RTX 3060 (12GB VRAM) or RTX 4060. faster-whisper large-v3-turbo + Piper + StyleTTS2. Expected latency: 800ms-1.5s for fast mode.

**Optimal** (production-grade): i9 or Ryzen 9, 32GB RAM, RTX 4070 or better (8GB+ VRAM). All models at maximum quality. Expected latency: 500-800ms total pipeline.

### Latency optimization strategies

**STT optimizations**:
- Use `large-v3-turbo` model (5.4x faster than large-v3)
- Enable GPU with `device="cuda"` and `compute_type="float16"`
- Implement VAD filtering to skip silence
- Buffer 1-2 seconds of audio before processing
- Use `beam_size=1` for fastest decoding (slight accuracy trade-off)

**TTS optimizations**:
- Implement adaptive mode: short responses use Piper, long use StyleTTS2
- Pre-generate common phrases and cache
- Stream TTS output in chunks rather than waiting for complete synthesis
- Use Piper for real-time responses, queue high-quality re-synthesis in background

**Network optimizations**:
- Use WebSocket binary frames (lower overhead than base64 text)
- Compress audio: WebM/Opus at 24kbps achieves good quality at 4x compression
- Implement client-side buffering (2-3 chunks) before playback starts
- Use `audioBitsPerSecond: 24000` in MediaRecorder

**Backend optimizations**:
- Load all models at startup, not per-request
- Use `asyncio.create_task()` for concurrent processing
- Implement connection pooling for LM Studio API
- Cache LLM responses for repeated queries
- Run STT, content analysis, and TTS preparation in parallel where possible

### Monitoring and metrics

Track these key metrics:

```python
# Add to backend
from time import time

async def process_with_metrics(audio_buffer, session):
    metrics = {}
    
    start = time()
    transcription = await stt_service.transcribe_stream(audio_buffer)
    metrics['stt_latency'] = time() - start
    
    start = time()
    llm_response = await llm_service.get_completion(transcription, session)
    metrics['llm_latency'] = time() - start
    
    start = time()
    analysis = content_analyzer.analyze(llm_response)
    metrics['analysis_latency'] = time() - start
    
    start = time()
    audio = await tts_service.synthesize(analysis['voice_output'])
    metrics['tts_latency'] = time() - start
    
    metrics['total_latency'] = sum(metrics.values())
    
    # Log or send to monitoring system
    print(f"Pipeline metrics: {metrics}")
    return analysis, audio
```

Target latencies for responsive experience:
- STT: 200-500ms
- LLM: 300-800ms  
- Content Analysis: <50ms
- TTS (fast mode): 200-800ms
- TTS (quality mode): 2000-5000ms
- **Total (fast)**: <2 seconds
- **Total (quality)**: 3-6 seconds

---

## Additional implementation notes

### Security considerations

- Implement rate limiting on WebSocket connections
- Validate audio file sizes and formats
- Sanitize LLM outputs before TTS (prevent injection attacks)
- Use HTTPS/WSS in production (even with Tailscale)
- Store voice reference audio with proper access controls

### Error handling

Implement graceful degradation:
- If high-quality TTS fails, fall back to Piper
- If faster-whisper fails, log and request user to repeat
- If LM Studio is down, show clear error message
- Implement connection retry logic with exponential backoff
- Cache last N successful responses for offline fallback

### Testing strategy

Key test scenarios:
- Audio format compatibility (WebM, Opus, WAV)
- Concurrent user sessions (test WebSocket scaling)
- Code block detection accuracy (various markdown formats)
- Voice personality consistency across sessions
- Interrupt/stop functionality
- Mode switching without state loss
- Mobile browser compatibility (iOS Safari, Chrome)
- Network disruption recovery

### Future enhancements

Consider implementing:
- Voice activity detection for automatic recording start/stop
- Conversation summarization for long sessions
- Export chat history as markdown/PDF
- Custom wake word detection
- Multi-language support (faster-whisper supports 99 languages)
- Voice biometrics for user identification
- Emotion detection from user voice
- Background noise cancellation
- Integration with calendar/tasks via additional APIs

This complete technical specification provides everything needed to build a production-ready local voice-mode AI assistant with dual interfaces, intelligent content routing, and modular voice personalities.