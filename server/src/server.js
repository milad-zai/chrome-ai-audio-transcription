const express = require("express");
const multer = require("multer");
const app = express();
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const fetch = require("cross-fetch");
const WebSocket = require("ws");
const config = require("./config/config");

const wss = new WebSocket.Server({ port: 8080 });

// Set up multer to handle file uploads
const upload = multer();

console.log(config.DEEPGRAM_API_KEY);

let connection;
let userSocket;

wss.on("error", (error) => {
  console.error("WebSocket error:", error);
});

wss.on("close", () => {
  console.log("WebSocket closed");
});

wss.on("listening", () => {
  console.log("WebSocket server listening on port 8080");
});

wss.on("connection", (ws) => {
  console.log("User connected");
  userSocket = ws; // Store the user WebSocket connection

  ws.on("close", () => {
    console.log("User disconnected");
    userSocket = null; // Clear the connection when user disconnects
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("message", (data) => {
    if (data instanceof Buffer) {
      console.log("Received audio chunk, size:", data.length);
      connection.send(data);

      /* ws.send(
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
    ); */
    } else {
      console.log("Received non-binary data:", data.toString());
    }
  });
});

const live = async () => {
  const deepgramApiKey = config.DEEPGRAM_API_KEY;

  // Initialize the Deepgram SDK
  const deepgram = createClient(deepgramApiKey);

  // Create a websocket connection to Deepgram
  connection = deepgram.listen.live({
    smart_format: true,
    model: "nova-2",
    language: "en-US",
  });

  // Listen for the connection to open.
  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Connection opened.");
    // Listen for any transcripts received from Deepgram and write them to the console.
    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.dir(data, { depth: null });
      if (userSocket && data) {
        console.log("Transcript:", data.channel.alternatives[0].transcript);
        userSocket.send(data.channel.alternatives[0].transcript); // Send transcription to the user
      }
    });

    // Listen for any metadata received from Deepgram and write it to the console.
    connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.dir(data, { depth: null });
    });

    // Listen for the connection to close.
    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Connection closed.");
    });

    // Send streaming audio from the URL to Deepgram.
    /* fetch(url)
      .then((r) => r.body)
      .then((res) => {
        res.on("readable", () => {
          connection.send(res.read());
        });
      }); */
  });
};

live();

app.post("/audio", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    console.log("No audio file received");
    return res.status(400).send("No audio file uploaded");
  }

  // Log the audio data buffer
  console.log("Received audio data:", req.file.buffer);

  connection.send(req.file.buffer);

  // Send a response back to the client
  res.json({ transcription: "Transcription of audio not implemented yet" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
