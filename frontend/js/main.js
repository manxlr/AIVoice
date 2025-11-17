import { AudioCapture } from "./audioCapture.js";
import { AudioPlayback } from "./audioPlayback.js";
import { SocketClient } from "./socketClient.js";

const WS_URL = "ws://localhost:8000/ws";

const conversationEl = document.getElementById("conversation");
const transcriptionEl = document.getElementById("transcription");
const statusEl = document.getElementById("statusText");
const pttButton = document.getElementById("pttButton");
const textForm = document.getElementById("textForm");
const textInput = document.getElementById("textInput");
const voiceListEl = document.getElementById("voiceList");

const playback = new AudioPlayback();
const socket = new SocketClient(WS_URL);
const capture = new AudioCapture({
  onChunk: (chunk) => socket.sendBinary(chunk),
});

let isReady = false;
let availableVoices = [];
let activeVoiceId = null;

function appendMessage(text, role) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;
  wrapper.textContent = text;
  const row = document.createElement("div");
  row.className = "flex";
  row.style.justifyContent = role === "user" ? "flex-end" : "flex-start";
  row.appendChild(wrapper);
  conversationEl.appendChild(row);
  conversationEl.scrollTop = conversationEl.scrollHeight;
}

function renderVoices() {
  if (!voiceListEl) return;
  voiceListEl.innerHTML = "";

  if (!availableVoices.length) {
    const empty = document.createElement("p");
    empty.className = "text-xs text-slate-500";
    empty.textContent = "No voices detected. Verify Piper models are downloaded and restart the backend.";
    voiceListEl.appendChild(empty);
    return;
  }

  availableVoices.forEach((voice) => {
    const button = document.createElement("button");
    button.className = "voice-button";
    if (voice.id === activeVoiceId) {
      button.classList.add("active");
    }
    button.innerHTML = `
      <strong>${voice.label}</strong>
      <span>${voice.description ?? ""}</span>
    `;
    button.addEventListener("click", () => {
      if (voice.id === activeVoiceId) return;
      activeVoiceId = voice.id;
      renderVoices();
      socket.sendJSON({ type: "set_personality", voice_id: voice.id });
    });
    voiceListEl.appendChild(button);
  });
}

async function fetchVoices() {
  try {
    const response = await fetch("http://localhost:8000/api/voices");
    const data = await response.json();
    availableVoices = data.voices ?? [];
    if (availableVoices.length > 0 && !activeVoiceId) {
      activeVoiceId = availableVoices[0].id;
      socket.sendJSON({ type: "set_personality", voice_id: activeVoiceId });
    }
    renderVoices();
  } catch (err) {
    console.error("Failed to load voices", err);
  }
}

socket.on("open", () => {
  statusEl.textContent = "Connected";
  statusEl.classList.remove("text-red-400");
  statusEl.classList.add("text-emerald-400");
  fetchVoices();
});

socket.on("close", () => {
  statusEl.textContent = "Disconnected";
  statusEl.classList.remove("text-emerald-400");
  statusEl.classList.add("text-red-400");
});

socket.on("json", (payload) => {
  switch (payload.type) {
    case "transcription":
      transcriptionEl.textContent = payload.text || "[unrecognized]";
      if (payload.text) {
        appendMessage(payload.text, "user");
      }
      break;
    case "assistant_text":
      appendMessage(payload.text, "assistant");
      break;
    case "audio_complete":
      pttButton.classList.remove("recording");
      pttButton.textContent = "Hold To Talk";
      isReady = true;
      break;
    case "personality_ack":
      if (payload.voice_id) {
        activeVoiceId = payload.voice_id;
        renderVoices();
      }
      break;
    case "error":
      appendMessage(`Error: ${payload.message}`, "assistant");
      pttButton.classList.remove("recording");
      pttButton.textContent = "Hold To Talk";
      isReady = true;
      break;
    default:
      break;
  }
});

socket.on("audio", async (buffer) => {
  const blob = new Blob([buffer], { type: "audio/wav" });
  await playback.play(blob);
});

socket.connect();

async function bootstrap() {
  await playback.init();
  await capture.init();
  isReady = true;
  statusEl.textContent = "Ready";
}

bootstrap().catch((err) => {
  statusEl.textContent = "Microphone blocked";
  console.error(err);
});

function startRecording() {
  if (!isReady) return;
  capture.start();
  pttButton.classList.add("recording");
  pttButton.textContent = "Listening...";
  statusEl.textContent = "Recording";
}

function stopRecording() {
  capture.stop();
  setTimeout(() => {
    socket.sendJSON({ type: "flush_audio" });
  }, 200);
  statusEl.textContent = "Processing";
}

pttButton.addEventListener("mousedown", startRecording);
pttButton.addEventListener("touchstart", (evt) => {
  evt.preventDefault();
  startRecording();
});

const endEvents = ["mouseup", "mouseleave", "touchend", "touchcancel"];
endEvents.forEach((eventName) => {
  pttButton.addEventListener(eventName, () => {
    if (!pttButton.classList.contains("recording")) return;
    pttButton.classList.remove("recording");
    pttButton.textContent = "Processing…";
    stopRecording();
  });
});

textForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  const text = textInput.value.trim();
  if (!text) return;
  appendMessage(text, "user");
  socket.sendJSON({ type: "text_query", text });
  textInput.value = "";
});

