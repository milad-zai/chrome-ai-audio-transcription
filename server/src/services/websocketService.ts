// websocketService.js
import WebSocket from "ws";
import constants from "../config/constants";

class WebSocketService {
  private wss: WebSocket.Server | null = null;
  private userSocket: WebSocket | null = null;
  private deepgramService: any | null = null;

  constructor() {
    this.reset();
    this.init();
  }

  init() {
    this.wss = new WebSocket.Server({ port: constants.WEBSOCKET_PORT });
    this.setupWebSocketEvents();
  }

  reset() {
    this.wss = null;
    this.userSocket = null;
    this.deepgramService = null;
  }

  // Setter to inject DeepgramService instance
  setDeepgramService(deepgramService: any) {
    this.deepgramService = deepgramService;
  }

  setupWebSocketEvents() {
    this.wss!.on("connection", (ws) => {
      console.log("New WebSocket connection established");
      this.userSocket = ws;

      ws.on("message", (data) => this.handleMessage(data));
      ws.on("close", () => {
        console.log("WebSocket connection closed");
        this.userSocket = null;
      });
      ws.on("error", (error) => console.error("WebSocket error:", error));
    });

    this.wss!.on("listening", () => {
      console.log(
        `WebSocket server is listening on port ${constants.WEBSOCKET_PORT}`
      );
    });

    this.wss!.on("error", (error) =>
      console.error("WebSocket server error:", error)
    );
  }

  handleMessage(data: any) {
    if (data instanceof Buffer) {
      console.log("Received audio chunk of size:", data.length);
      if (this.deepgramService) {
        this.deepgramService.sendAudioChunk(data);
      } else {
        console.log("Deepgram service not initialized");
      }
    } else {
      console.log("Received non-binary message:", data.toString());
    }

    // Send dummy transcript for testing
    //this.sendTranscript("This is a placeholder transcript.");
  }

  sendTranscript(transcript: any) {
    if (this.userSocket) {
      this.userSocket.send(transcript);
    } else {
      console.error("No active WebSocket connection to send transcript");
    }
  }
}

export default new WebSocketService();
