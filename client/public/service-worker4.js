chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received", message.action);

  if (message.action === "startCapture" || message.action === "stopCapture") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("Tabs found", tabs);
      if (tabs[0]?.id) {
        chrome.scripting
          .executeScript({
            target: { tabId: tabs[0].id },
            func:
              message.action === "startCapture"
                ? startTabCapture
                : stopTabCapture,
          })
          .then(() => {
            console.log(`${message.action} script executed`);
          })
          .catch((error) => {
            console.error("Error executing script:", error);
          });
      }
    });
  }
});

function startTabCapture() {
  console.log("Starting tab capture");

  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    console.log("Stream captured", stream);

    if (chrome.runtime.lastError || !stream) {
      console.error("Error capturing audio:", chrome.runtime.lastError.message);
      return;
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
        sendAudioChunkToServer(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start(1000);
    window.mediaRecorder = mediaRecorder;
  });
}

function stopTabCapture() {
  console.log("Stopping tab capture");
  if (window.mediaRecorder) {
    window.mediaRecorder.stop();
  }
}

async function sendAudioChunkToServer(audioBlob) {
  console.log("Sending audio chunk to server");

  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");

  try {
    const response = await fetch("http://localhost:3000/audio", {
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
