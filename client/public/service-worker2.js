chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

let audioStream = null;

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

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(audioContext.destination); // Play the audio
  });
}

function stopCapture() {
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop()); // Stop all audio tracks
    audioStream = null;
  }
}
