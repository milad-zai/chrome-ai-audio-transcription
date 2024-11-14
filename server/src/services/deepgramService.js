const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const config = require("../config/config");
const constants = require("../config/constants");
const websocketService = require("./websocketService");

class DeepgramService {
  constructor() {
    this.deepgramClient = createClient(config.DEEPGRAM_API_KEY);
    this.connection = null;
    websocketService.setDeepgramService(this); // Inject DeepgramService into WebSocketService
    this.keepAliveInterval = null;
  }

  async initConnection() {
    this.connection = this.deepgramClient.listen.live({
      smart_format: true,
      model: constants.DEEPGRAM_MODEL,
      language: constants.DEFAULT_LANGUAGE,
    });

    this.connection.keepAlive();

    this.connection.on(LiveTranscriptionEvents.Open, () => {
      console.log("Deepgram connection opened.");
      this.startKeepAlive();
    });

    this.connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Deepgram connection closed.");
      this.stopKeepAlive();
    });

    this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.dir(data, { depth: null });
      if (data) {
        console.log("Transcript:", data.channel.alternatives[0].transcript);
        websocketService.sendTranscript(
          data.channel.alternatives[0].transcript
        );
      }
    });

    this.connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.log("Metadata received:", data);
    });
  }

  startKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(() => {
      if (this.connection && this.connection.keepAlive) {
        console.log("Sending keep-alive message...");
        this.connection.keepAlive();
      }
    }, 10000);
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval); // Stop the periodic keep-alive
      this.keepAliveInterval = null;
    }
  }

  sendAudioChunk(chunk) {
    console.log(
      "Deepgram connection state:",
      this.connection.connectionState()
    );
    if (this.connection && this.connection.isConnected()) {
      this.connection.send(chunk);
    } else {
      console.error("Deepgram connection not initialized, reconnecting...");
      this.initConnection();
    }
    this.startKeepAlive();
  }
}

module.exports = new DeepgramService();
