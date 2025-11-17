export class AudioCapture {
  constructor({ onChunk }) {
    this.mediaRecorder = null;
    this.stream = null;
    this.onChunk = onChunk;
  }

  async init() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      audioBitsPerSecond: 24000,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size && this.onChunk) {
        this.onChunk(event.data);
      }
    };
  }

  start() {
    if (!this.mediaRecorder) return;
    this.mediaRecorder.start(150);
  }

  stop() {
    if (!this.mediaRecorder) return;
    if (this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  }
}

