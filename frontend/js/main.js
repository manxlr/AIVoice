import { AudioCapture } from "./audioCapture.js";
import { AudioPlayback } from "./audioPlayback.js";
import { SocketClient } from "./socketClient.js";

const WS_URL = "ws://localhost:8003/ws";

const conversationEl = document.getElementById("conversation");
const transcriptionEl = document.getElementById("transcription");
const statusEl = document.getElementById("statusText");
const pttButton = document.getElementById("pttButton");
const textForm = document.getElementById("textForm");
const textInput = document.getElementById("textInput");
// UI Elements
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const saveSettings = document.getElementById("saveSettings");
const restoreDefaults = document.getElementById("restoreDefaults");
const resetAll = document.getElementById("resetAll");
const testBackend = document.getElementById("testBackend");
const testLlm = document.getElementById("testLlm");

// New UI Elements
const toggleVoicePanel = document.getElementById("toggleVoicePanel");
const voicePanel = document.getElementById("voicePanel");
const voicePanelContent = document.getElementById("voicePanelContent");
const openFullSettings = document.getElementById("openFullSettings");
const testBackendSmall = document.getElementById("testBackendSmall");
const testLlmSmall = document.getElementById("testLlmSmall");
const backendUrlSmall = document.getElementById("backendUrlSmall");
const llmApiUrlSmall = document.getElementById("llmApiUrlSmall");
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
  const messageContainer = document.createElement("div");
  messageContainer.className = "message-container";
  
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;
  
  // Parse and format markdown-like content
  wrapper.innerHTML = formatMessageContent(text);
  
  // Add copy button for assistant messages
  if (role === 'assistant') {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'small-copy-btn';
    copyBtn.innerHTML = '📋';
    copyBtn.title = 'Copy response';
    copyBtn.onclick = function() {
      copyMessageText(wrapper, copyBtn);
    };
    messageContainer.appendChild(copyBtn);
  }
  
  const row = document.createElement("div");
  row.className = "flex";
  row.style.justifyContent = role === "user" ? "flex-end" : "flex-start";
  row.appendChild(wrapper);
  messageContainer.appendChild(row);
  
  conversationEl.appendChild(messageContainer);
  conversationEl.scrollTop = conversationEl.scrollHeight;
}

function addCopyMessageButton() {
  // Remove existing copy button if present
  const existingBtn = document.getElementById('copy-message-btn');
  if (existingBtn) existingBtn.remove();
  
  // Create copy button
  const copyBtn = document.createElement('button');
  copyBtn.id = 'copy-message-btn';
  copyBtn.className = 'copy-message-button';
  copyBtn.innerHTML = '📋 Copy Response';
  copyBtn.onclick = copyEntireMessage;
  
  // Insert before the conversation container
  conversationEl.parentNode.insertBefore(copyBtn, conversationEl.nextSibling);
}

function formatMessageContent(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // Handle code blocks with language specification
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    return `
      <div class="code-section">
        <div class="code-header">
          <span class="code-lang">${language.toUpperCase()}</span>
          <button class="copy-btn" onclick="copyCode(this)">📋</button>
        </div>
        <pre class="code-block"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>
      </div>
    `;
  });
  
  // Handle inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Handle headers (## Header)
  formatted = formatted.replace(/^##\s+(.+)$/gm, '<h3 class="section-header">$1</h3>');
  formatted = formatted.replace(/^#\s+(.+)$/gm, '<h2 class="main-header">$1</h2>');
  
  // Handle bullet points
  formatted = formatted.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul class="bullet-list">$1</ul>');
  
  // Handle tip/info boxes
  formatted = formatted.replace(/\*\*(Tip|Note|Info):\*\*\s*(.*?)(?=\n\n|$)/gs, 
    '<div class="info-box tip"><div class="info-icon">💡</div><div class="info-content">$2</div></div>');
  
  formatted = formatted.replace(/\*\*(Warning|Caution):\*\*\s*(.*?)(?=\n\n|$)/gs, 
    '<div class="info-box warning"><div class="info-icon">⚠️</div><div class="info-content">$2</div></div>');
  
  // Handle paragraphs
  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = '<p>' + formatted + '</p>';
  
  // Clean up empty paragraphs
  formatted = formatted.replace(/<p>\s*<\/p>/g, '');
  
  return formatted;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Global copy state
let copiedTimeout = null;

function copyCode(button) {
  const codeBlock = button.closest('.code-section').querySelector('code');
  const fullText = codeBlock.textContent;
  
  navigator.clipboard.writeText(fullText).then(() => {
    showCopyFeedback(button, 'Copied!');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showCopyFeedback(button, 'Failed');
  });
}

function copyEntireMessage() {
  // Get the last assistant message container
  const lastMessageContainer = conversationEl.querySelector('.message-container');
  if (lastMessageContainer) {
    const assistantMessage = lastMessageContainer.querySelector('.message.assistant');
    if (assistantMessage) {
      const fullText = assistantMessage.innerText || assistantMessage.textContent;
      navigator.clipboard.writeText(fullText).then(() => {
        showGlobalCopyFeedback('Message copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy message:', err);
        showGlobalCopyFeedback('Failed to copy');
      });
    }
  }
}

function copyMessageText(messageElement, button) {
  const fullText = messageElement.innerText || messageElement.textContent;
  navigator.clipboard.writeText(fullText).then(() => {
    showCopyFeedback(button, '✓');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showCopyFeedback(button, '✗');
  });
}

function showCopyFeedback(button, message) {
  const originalText = button.textContent;
  button.textContent = message;
  button.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
  
  clearTimeout(copiedTimeout);
  copiedTimeout = setTimeout(() => {
    button.textContent = originalText;
    button.style.backgroundColor = '';
  }, 1500);
}

function showGlobalCopyFeedback(message) {
  // Create temporary notification
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove after delay
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 2000);
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
    const response = await fetch("http://localhost:8003/api/voices");
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

openFullSettings?.addEventListener("click", () => {
  loadSettings();
  settingsModal?.classList.remove("hidden");
});

// Voice Panel Toggle
let isVoicePanelMinimized = false;

toggleVoicePanel?.addEventListener("click", () => {
  isVoicePanelMinimized = !isVoicePanelMinimized;
  if (isVoicePanelMinimized) {
    voicePanel.classList.add("lg:w-12");
    voicePanelContent.classList.add("hidden");
    toggleVoicePanel.textContent = "→";
  } else {
    voicePanel.classList.remove("lg:w-12");
    voicePanelContent.classList.remove("hidden");
    toggleVoicePanel.textContent = "←";
  }
});

// Small connection testers
testBackendSmall?.addEventListener("click", () => testConnectionSmall(backendUrlSmall.value, testBackendSmall, '/healthz'));
testLlmSmall?.addEventListener("click", () => testConnectionSmall(llmApiUrlSmall.value, testLlmSmall, '/v1/models'));

closeSettings?.addEventListener("click", () => {
  settingsModal?.classList.add("hidden");
});

saveSettings?.addEventListener("click", saveCurrentSettings);
restoreDefaults?.addEventListener("click", restoreDefaultSettings);
resetAll?.addEventListener("click", resetAllSettings);
testBackend?.addEventListener("click", testBackendConnection);
testLlm?.addEventListener("click", testLlmConnection);

// Close modal when clicking outside
settingsModal?.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal?.classList.add("hidden");
  }
});

// Settings functions
function loadSettings() {
  // Load from localStorage or config file
  const savedSettings = localStorage.getItem('aivoice-settings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    document.getElementById('backendUrl').value = settings.backend_url || '';
    document.getElementById('llmApiUrl').value = settings.llm_api_url || '';
    
    // Update small settings panel
    if (backendUrlSmall) backendUrlSmall.value = settings.backend_url || '';
    if (llmApiUrlSmall) llmApiUrlSmall.value = settings.llm_api_url || '';
  }
}

function saveCurrentSettings() {
  const settings = {
    backend_url: document.getElementById('backendUrl').value,
    llm_api_url: document.getElementById('llmApiUrl').value
  };
  
  localStorage.setItem('aivoice-settings', JSON.stringify(settings));
  
  // Update small settings panel
  if (backendUrlSmall) backendUrlSmall.value = settings.backend_url;
  if (llmApiUrlSmall) llmApiUrlSmall.value = settings.llm_api_url;
  
  showGlobalCopyFeedback('Settings saved successfully!');
}

function restoreDefaultSettings() {
  if (confirm('Restore default connection settings?')) {
    document.getElementById('backendUrl').value = 'http://localhost:8003';
    document.getElementById('llmApiUrl').value = 'http://192.0.2.75:1234/v1/chat/completions';
    showGlobalCopyFeedback('Defaults restored');
  }
}

function resetAllSettings() {
  if (confirm('Reset ALL settings to factory defaults?')) {
    localStorage.removeItem('aivoice-settings');
    loadSettings();
    showGlobalCopyFeedback('All settings reset');
  }
}

// Simplified connection testing that doesn't interrupt workflow
async function testConnectionSmall(url, button, endpoint = '') {
  try {
    const originalText = button.textContent;
    button.textContent = '✓';
    button.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
    
    // Quick check without detailed error handling
    if (endpoint) {
      await fetch(`${url}${endpoint}`, { method: 'GET', timeout: 3000 });
    } else {
      await fetch(url, { method: 'POST', timeout: 3000 });
    }
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
    }, 1500);
  } catch (error) {
    // Silent fail - don't disrupt user experience
    button.textContent = '✗';
    button.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
    setTimeout(() => {
      button.textContent = '✓';
      button.style.backgroundColor = '';
    }, 1500);
  }
}

async function testBackendConnection() {
  const url = document.getElementById('backendUrl').value;
  const button = testBackend;
  
  try {
    button.textContent = 'Testing...';
    button.disabled = true;
    
    const response = await fetch(`${url}/healthz`, { timeout: 5000 });
    if (response.ok) {
      showCopyFeedback(button, '✓ Connected');
    } else {
      throw new Error('Connection failed');
    }
  } catch (error) {
    showCopyFeedback(button, '✗ Failed');
  } finally {
    setTimeout(() => {
      button.textContent = 'Test';
      button.disabled = false;
    }, 2000);
  }
}

async function testLlmConnection() {
  const url = document.getElementById('llmApiUrl').value;
  const button = testLlm;
  
  try {
    button.textContent = 'Testing...';
    button.disabled = true;
    
    // Simple reachability test
    await fetch(`${url}/v1/models`, { 
      method: 'GET', 
      timeout: 5000 
    }).catch(() => {
      // If /v1/models fails, try a basic POST test
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'test' }),
        timeout: 5000
      });
    });
    
    showCopyFeedback(button, '✓ Reachable');
  } catch (error) {
    showCopyFeedback(button, '✗ Failed');
  } finally {
    setTimeout(() => {
      button.textContent = 'Test';
      button.disabled = false;
    }, 2000);
  }
}

