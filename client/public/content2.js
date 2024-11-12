let mediaStream;

function startAudioCapture(streamId) {
  console.log("startAudioCapture");
  /* const mediaElement = document.querySelector("audio, video");
  if (mediaElement) {
    // Capture audio stream from the media element
    mediaStream = mediaElement.captureStream();
    console.log("Audio stream captured from media element.");
    chrome.runtime.sendMessage({
      action: "streamCaptured",
      stream: mediaStream,
    });
  } else {
    console.error("No audio or video element found on this page.");
  } */

  navigator.mediaDevices
    .getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    })
    .then((mediaStream) => {
      console.log("streamCaptured", mediaStream);
      chrome.runtime.sendMessage({
        action: "streamCaptured",
        stream: mediaStream,
      });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startCapture") {
    startAudioCapture(request.streamId);
    sendResponse({ success: true });
  }
});
