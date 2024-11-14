import { useRef } from "react";

function useAudioCapture(
  AudioCaptureInvervalMS: number,
  setIsCapturing: (isCapturing: boolean) => void,
  onDataAvailable: (audioBlob: Blob) => void
) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const setupMediaRecorder = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        onDataAvailable(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    };

    mediaRecorder.start(AudioCaptureInvervalMS);
  };

  const startCapture = async () => {
    chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
      if (chrome.runtime.lastError || !stream) {
        console.error("Error capturing audio:", chrome.runtime.lastError);
        return;
      }

      audioStreamRef.current = stream;

      try {
        const output = new AudioContext();
        const source = output.createMediaStreamSource(stream);
        source.connect(output.destination);
      } catch (error) {
        console.error("Error creating audio context:", error);
      }

      setupMediaRecorder(stream);
    });
  };

  const stopCapture = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsCapturing(false);
  };

  return { startCapture, stopCapture };
}

export default useAudioCapture;
