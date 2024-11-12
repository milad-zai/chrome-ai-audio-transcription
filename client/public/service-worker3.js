let audioStream = null;
let mediaRecorder = null;
let chunks = [];

// Configure your transcription server endpoint here
const TRANSCRIPTION_API_URL = "http://localhost:3000/audio";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startCapture") {
    startCapture();
  } else if (message.action === "stopCapture") {
    stopCapture();
  }
});

function startCapture() {
  if (audioStream) return; // Prevent multiple captures

  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (chrome.runtime.lastError || !stream) {
      console.error("Error capturing audio:", chrome.runtime.lastError.message);
      return;
    }

    audioStream = stream;
    setupMediaRecorder();
  });
}

function setupMediaRecorder() {
  // Initialize MediaRecorder with the audio stream
  mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
      sendAudioChunkToServer(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    audioStream.getTracks().forEach((track) => track.stop());
    audioStream = null;
  };

  mediaRecorder.start(1000); // Collect audio data in 1-second chunks
}

function stopCapture() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

// Sends audio chunk to the transcription server for processing
async function sendAudioChunkToServer(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");

  try {
    const response = await fetch(TRANSCRIPTION_API_URL, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (data && data.transcription) {
      console.log("Transcription:", data.transcription);
    }
  } catch (error) {
    console.error("Error sending audio chunk:", error);
  }
}
