import { useCallback, useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import "./App.css";

function App() {
  const [isCapturing, setIsCapturing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [, setChunks] = useState<Blob[]>([]);

  const transcriptionAreaRef = useRef<HTMLDivElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const CHUNK_SIZE_IN_MS = 1000; // Collect audio data in 1-second chunks
  const SOCKET_URL = "ws://localhost:8080";
  const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(SOCKET_URL);
  const [autoScroll, setAutoScroll] = useState(true);

  const appendToMessageHistory = useCallback(
    (message: MessageEvent<any>) =>
      setMessageHistory((prev) => [...prev, message]),
    []
  );

  useEffect(() => {
    if (lastMessage !== null) {
      appendToMessageHistory(lastMessage);

      if (autoScroll && transcriptRef.current && transcriptionAreaRef.current) {
        requestAnimationFrame(() => {
          transcriptionAreaRef.current?.scrollTo(
            0,
            transcriptRef.current?.scrollHeight || 0
          );
        });
      }
    }
  }, [lastMessage, autoScroll, appendToMessageHistory]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const sendAudioChunkToServer = (audioBlob: Blob) => {
    console.log("Sending audio chunk to server");
    if (readyState === ReadyState.OPEN) {
      sendMessage(audioBlob);
    } else {
      console.error("WebSocket is not open. Cannot send audio chunk.");
    }
  };

  const setupMediaRecorder = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setChunks((prevChunks) => [...prevChunks, event.data]);
        sendAudioChunkToServer(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    };

    mediaRecorder.start(CHUNK_SIZE_IN_MS);
  };

  const stopCapture = () => {
    console.log("Stopping capture");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsCapturing(false);
  };

  const handleCaptureToggle = async () => {
    if (isCapturing) {
      //chrome.runtime.sendMessage({ action: "stopCapture" });
      stopCapture();
    } else {
      //try to use popup and load chats in background and display somewhere...

      chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
        if (chrome.runtime.lastError || !stream) {
          console.error("Error capturing audio:", chrome.runtime.lastError);
          setIsCapturing(false);
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

        setupMediaRecorder(stream);
      });
    }
    setIsCapturing(!isCapturing);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Live Transcription</h1>
        <p className="status">
          Status: <span id="status">{connectionStatus}</span>
        </p>
      </header>

      <main
        className="transcription-area"
        id="transcription-area"
        ref={transcriptionAreaRef}
      >
        <div id="transcript" className="transcript" ref={transcriptRef}>
          {messageHistory.map((message, index) => (
            <p key={index}>{message ? message.data : null}</p>
          ))}
        </div>
      </main>

      <footer className="controls">
        <button
          id="startBtn"
          className="control-btn start-btn"
          onClick={handleCaptureToggle}
          disabled={isCapturing}
        >
          Start Transcribing
        </button>
        <button
          id="stopBtn"
          className="control-btn stop-btn"
          onClick={stopCapture}
          disabled={!isCapturing}
        >
          Stop
        </button>
        <div className="auto-scroll">
          <input
            type="checkbox"
            id="autoscroll"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          <span> Auto Scroll</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
