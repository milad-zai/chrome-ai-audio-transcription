const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const config = require("../config/config");
const constants = require("../config/constants");
const websocketService = require("./websocketService");

class DeepgramService {
  constructor() {
    if (!DeepgramService.instance) {
      this.deepgramClient = createClient(config.DEEPGRAM_API_KEY);
      this.connection = null;
      DeepgramService.instance = this;
    }
    return DeepgramService.instance;
  }

  async initConnection() {
    this.connection = this.deepgramClient.listen.live({
      smart_format: true,
      model: constants.DEEPGRAM_MODEL,
      language: constants.DEFAULT_LANGUAGE,
    });

    this.connection.on(LiveTranscriptionEvents.Open, () => {
      console.log("Deepgram connection opened.");
    });

    this.connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Deepgram connection closed.");
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

  sendAudioChunk(chunk) {
    if (this.connection) {
      this.connection.send(chunk);
    } else {
      console.error("Deepgram connection not initialized");
    }
  }
}

module.exports = new DeepgramService();
