export class AudioPlayback {
  constructor() {
    this.ctx = null;
    this.queue = [];
    this.nextStart = 0;
  }

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  async play(blob) {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.ctx.destination);

    const startTime = Math.max(this.ctx.currentTime, this.nextStart);
    source.start(startTime);
    this.nextStart = startTime + audioBuffer.duration;

    this.queue.push(source);
    source.onended = () => {
      const idx = this.queue.indexOf(source);
      if (idx >= 0) this.queue.splice(idx, 1);
    };
  }

  stopAll() {
    this.queue.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (err) {
        console.error("Failed to stop source", err);
      }
    });
    this.queue = [];
    if (this.ctx) {
      this.nextStart = this.ctx.currentTime;
    }
  }
}

