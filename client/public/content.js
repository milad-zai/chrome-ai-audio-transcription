let mediaStream;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script: Message received: ", request);
  if (request.action === "startCapture") {
    startAudioCapture();
    sendResponse({ success: true });
  }
});

function startAudioCapture() {
  console.log("starting audio capture");
  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (chrome.runtime.lastError || !stream) {
      console.error("Error capturing audio:", chrome.runtime.lastError);
      return;
    }

    console.log("Stream captured", stream);

    try {
      const output = new AudioContext();
      const source = output.createMediaStreamSource(stream);
      source.connect(output.destination);
    } catch (error) {
      console.error("Error creating audio context:", error);
    }

    /* chrome.runtime.sendMessage({
      action: "startCapture",
      stream: stream,
    }); */
  });
}
