export class SocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = {
      open: () => {},
      json: () => {},
      audio: () => {},
      close: () => {},
      error: () => {},
    };
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = "arraybuffer";

    this.ws.addEventListener("open", (evt) => this.handlers.open(evt));
    this.ws.addEventListener("message", (evt) => {
      if (typeof evt.data === "string") {
        try {
          const payload = JSON.parse(evt.data);
          this.handlers.json(payload);
        } catch (err) {
          console.warn("Non-JSON text frame:", err);
        }
      } else {
        this.handlers.audio(evt.data);
      }
    });
    this.ws.addEventListener("close", (evt) => this.handlers.close(evt));
    this.ws.addEventListener("error", (evt) => this.handlers.error(evt));
  }

  sendJSON(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(data));
  }

  sendBinary(blob) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(blob);
  }

  on(type, handler) {
    if (type in this.handlers) {
      this.handlers[type] = handler;
    }
  }
}

