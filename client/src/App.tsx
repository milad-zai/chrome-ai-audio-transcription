import { useCallback, useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import "./App.css";

type Action = "startCapture" | "stopCapture";
type Message = {
  action: Action;
  stream?: MediaStream;
};

function App() {
  const [isCapturing, setIsCapturing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const TRANSCRIPTION_API_URL = "http://localhost:3000/audio";
  const [, setChunks] = useState<Blob[]>([]);

  const transcriptionAreaRef = useRef<HTMLDivElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  //Public API that will echo messages sent to it back to the client
  const SOCKET_URL = "ws://localhost:8080";
  const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(SOCKET_URL);
  const [autoScroll, setAutoScroll] = useState(true);

  const appendToMessageHistory = useCallback(
    (message: MessageEvent<any>) =>
      setMessageHistory((prev) => [...prev, message]),
    []
  );

  /* const sendTestMessage = useCallback(() => {
    setIsCapturing(true);
    sendMessage("Hello");
  }, [sendMessage]); */

  useEffect(() => {
    if (lastMessage !== null) {
      appendToMessageHistory(lastMessage);
      //sendTestMessage();

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

  const sendAudioChunkToServer = async (audioBlob: Blob) => {
    console.log("Sending audio chunk to server");

    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    try {
      const response = await fetch(TRANSCRIPTION_API_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      console.log("Response from server:", data);

      if (data && data.transcription) {
        console.log("Transcription:", data.transcription);
      }
    } catch (error) {
      console.error("Error sending audio chunk:", error);
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

    mediaRecorder.start(1000); // Collect audio data in 1-second chunks
  };

  useEffect(() => {
    const handleMessage = (message: Message) => {
      console.log("Message received:", message);
      if (message.action === "startCapture" && !audioStreamRef.current) {
        // Set audio stream if not already capturing
        audioStreamRef.current = message.stream!;
        setupMediaRecorder(audioStreamRef.current!);
        setIsCapturing(true);
      } else if (message.action === "stopCapture") {
        stopCapture();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const stopCapture = () => {
    console.log("Stopping capture");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsCapturing(false);
  };

  /* const handleCaptureToggle = async () => {
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
  }; */

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
          onClick={sendTestMessage}
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
