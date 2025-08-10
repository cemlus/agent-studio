"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Agent, VoiceState } from "./types/index";
import VoiceVisualizer from "./VoiceVisualizer";
import { BackIcon, MicIcon, PhoneIcon, PhoneOffIcon } from "./Icons";

// WebSocket and audio constants
// const WS_URL = "http://localhost:9000/api/v1/talk/";
const WS_URL = "https://goodmeetings-voice-ai.onrender.com/api/v1/talk/"
const BACKGROUND_CONSTANT_VOLUME = 0.1;

const LiveConvoWebsocketEvents = {
  ConversationInitMetadata: "conversation_init_metadata",
  UserTranscript: "user_transcript",
  Interruption: "interruption",
  AgentTranscript: "agent_transcript",
  UtteranceEnd: "utterance_end",
  AudioStream: "audio_stream",
  Error: "error",
  UserAudio: "user_audio",
};

interface VoiceInterfaceProps {
  agent: Agent;
  onBack: () => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ agent, onBack }) => {
  const BACKGROUND_AUDIO_URL =
    "https://s3.ap-south-1.amazonaws.com/assets.amongst.ai/assets/busy-call-centre.1.mp4";

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    volume: 0,
  });
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [lastResponse, setLastResponse] = useState<string>("");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const frontendChunkCounter = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<any>(null);

  const receivedAudioChunks = useRef<ArrayBuffer[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const setupAudioPlayback = useCallback(async () => {
    if (audioContextRef.current) return;

    const context = new AudioContext({ sampleRate: 16000 });

    try {
      await context.audioWorklet.addModule("/audioProcessor.js");
      const workletNode = new AudioWorkletNode(context, "pcm-player-processor");

      workletNode.connect(context.destination);

      audioContextRef.current = context;
      audioWorkletNodeRef.current = workletNode;
    } catch (e) {
      console.error("Error setting up AudioWorklet:", e);
      setError("Failed to initialize audio playback system.");
    }
  }, []); 

  const startBackgroundAudio = useCallback(() => {
    const bg = backgroundAudioRef.current;
    if (!bg) return console.warn("Background audio element missing");
    if (bg.paused) {
      bg.volume = BACKGROUND_CONSTANT_VOLUME;
      bg.play().catch((e) => {
        console.error("Background playback failed:", e);
        setError(
          "Failed to play background audio. User interaction may be needed."
        );
      });
    }
  }, []);

  const stopBackgroundAudio = useCallback(() => {
    const bg = backgroundAudioRef.current;
    if (!bg) return;
    if (!bg.paused) {
      bg.pause();
      bg.currentTime = 0;
    }
  }, []);

  const endCall = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream?.getTracks();
      tracks?.forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
        audioWorkletNodeRef.current = null;
      });
    }
    stopBackgroundAudio();

    setIsCallActive(false);

    setConnectionStatus("disconnected");
    setVoiceState({
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      volume: 0,
    });
    setCurrentTranscript("");
    setLastResponse("");
    setError(null);
    setCallDuration(0);
    // audioQueueRef.current = []

    // ------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // ------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // ------------------------------------------------------------------------------------------------------------------------------------------------------------------

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, [stopBackgroundAudio]);


  const startUserAudio = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log(wsRef.current);
    }

    if (mediaRecorderRef.current) {
      console.log(`function returned`);
      return;
    }

    try {
      console.log("hello from startUserAudio");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
        },
      });
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm; codecs=opus";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      console.log("mic open");

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "greetingMessage",
            data: agent.agent.greetingMessage,
          })
        );
        console.log(`greeting sent`);
      } else {
        console.log(`greeting not sent`);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = btoa(
              // @ts-ignore
              String.fromCharCode.apply(null, new Uint8Array(reader.result))
            );
            const message = {
              type: LiveConvoWebsocketEvents.UserAudio,
              data: base64Audio,
            };
            console.log('Audio is being sent to the backend');
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify(message));
            }
          };
          reader.readAsArrayBuffer(event.data);
        }
      };

      mediaRecorder.start(250);
      setVoiceState((prev) => ({ ...prev, isListening: true }));
    } catch (e) {
      console.error("Error starting user audio stream:", e);
      setError("Could not access microphone. Please check permissions.");
      setVoiceState((prev) => ({ ...prev, isListening: false }));
    }
  }, []);

  // Handle WebSocket messages
  const handleWsMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received basic message:", message);

        switch (message.type) {
          case LiveConvoWebsocketEvents.ConversationInitMetadata:
            setConnectionStatus("connected");
            console.log("initialised metadata");

            setLastResponse(
              message.agent?.greetingMessage || agent.agent.greetingMessage
            );
            startBackgroundAudio();
            break;

          case LiveConvoWebsocketEvents.UserTranscript:
            if (message.data.isFinal) {
              setCurrentTranscript("");
            } else {
              setCurrentTranscript(message.data.text);
            }
            break;

          case LiveConvoWebsocketEvents.Interruption:
            console.log("Interruption signal received from server.");

            // 1. Send the 'clear' command to the AudioWorklet to silence it.
            if (audioWorkletNodeRef.current) {
              audioWorkletNodeRef.current.port.postMessage({ type: "clear" });
            }

            // 2. Immediately update the UI state to show the agent is listening again.
            setVoiceState((prev) => ({
              ...prev,
              isSpeaking: false,
              isListening: true,
            }));

            setError(null); // Clear any previous errors
            break;

          case LiveConvoWebsocketEvents.AgentTranscript:
            console.log(message);

            setLastResponse(message.data.text);
            setVoiceState((prev) => ({
              ...prev,
              isProcessing: false,
              isSpeaking: true,
            }));
            if (receivedAudioChunks.current.length > 0) {
              const audioBlob = new Blob(receivedAudioChunks.current, {
                type: "application/octet-stream",
              });
              const url = URL.createObjectURL(audioBlob);
              setDownloadUrl(url);
              receivedAudioChunks.current = []; // Clear for the next turn
            }
            break;

          case LiveConvoWebsocketEvents.UtteranceEnd:
            setVoiceState((prev) => ({
              ...prev,
              isListening: false,
              isProcessing: true,
            }));
            break;

          case LiveConvoWebsocketEvents.Error:
            setError(
              `Server Error: ${
                message.data.message || "An unknown error occurred."
              }`
            );
            endCall();
            break;

          default:
            console.warn("Unknown WebSocket message type:", message.type);
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
        setError("Failed to process data from the server.");
      }
    },
    [startBackgroundAudio, endCall]
  );

  // Initialize WebSocket connection
  const connectToWebSocket = useCallback(() => {
    if (wsRef.current) return;

    setConnectionStatus("connecting");
    setError(null);

    // setupAudioStream()
    startBackgroundAudio();
    console.log(WS_URL + agent.agentId);

    const ws = new WebSocket(WS_URL + agent.agentId);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection opened.");
      setIsCallActive(true);
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // If the data is an ArrayBuffer, it's raw PCM audio.
        // Send it directly to our AudioWorklet.
        frontendChunkCounter.current++;
        console.log(
          `[Frontend] Received chunk #${frontendChunkCounter.current}, Size: ${event.data.byteLength}`
        );
        receivedAudioChunks.current.push(event.data);

        if (audioWorkletNodeRef.current) {
          audioWorkletNodeRef.current.port.postMessage(event.data);
        }
      } else {
        // If the data is not an ArrayBuffer, it's a JSON string with metadata.
        // The original handleWsMessage function can process it.
        handleWsMessage(event);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
      endCall();
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
      setError("WebSocket connection error. Is the backend running?");
      endCall();
    };
  }, [handleWsMessage, endCall, startBackgroundAudio]);

  // Start call
  const startCall = async (): Promise<void> => {
    // --- IMPORTANT: Setup and resume the AudioContext on user interaction ---
    await setupAudioPlayback();
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }
    connectToWebSocket(); 
    setConnectionStatus("connecting");
    setIsCallActive(true);
    startUserAudio();
  };

  useEffect(() => {
    const voice = agent.tts.voiceId;
    console.log(voice);
  }, []);

  useEffect(() => {
    if (isCallActive) {
      callStartTimeRef.current = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration(
          Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        );
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getStatusText = (): string => {
    if (connectionStatus === "connecting") return "Connecting...";
    if (!isCallActive) return "Ready to call";
    if (voiceState.isSpeaking) return "Agent speaking...";
    if (voiceState.isListening) return "Listening...";
    if (voiceState.isProcessing) return "Processing...";
    return "Connected";
  };

  const getStatusColor = (): string => {
    if (connectionStatus === "connecting") return "text-yellow-600";
    if (!isCallActive) return "text-gray-600";
    if (voiceState.isSpeaking) return "text-green-600";
    if (voiceState.isListening) return "text-blue-600";
    if (voiceState.isProcessing) return "text-purple-600";
    return "text-green-600";
  };

  const isSpeechRecognitionSupported = (): boolean => {
    return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  };

  if (!isSpeechRecognitionSupported()) {
    return (
      <div className="min-h-screen pt-20 lg:pt-0 bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <MicIcon />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Speech Recognition Not Supported
          </h2>
          <p className="text-gray-600 mb-4">
            Your browser doesn't support speech recognition. Please use Chrome,
            Edge, or Safari for the best experience.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-smooth"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <audio
        ref={backgroundAudioRef}
        src={BACKGROUND_AUDIO_URL}
        loop
        preload="auto"
        style={{ display: "none" }}
      />
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-md hover:bg-gray-100 transition-smooth focus-ring"
              aria-label="Go back"
            >
              <BackIcon />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {agent.agent.displayName}
              </h1>
              <p className={`text-sm transition-colors ${getStatusColor()}`}>
                {getStatusText()}
                {isCallActive && connectionStatus === "connected" && (
                  <span className="ml-2 text-gray-500">
                    • {formatCallDuration(callDuration)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500 animate-pulse"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-xs text-gray-500 capitalize">
              {connectionStatus}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="relative">
            <div
              className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold transition-all duration-300 ${
                isCallActive ? "scale-110 shadow-2xl" : "scale-100 shadow-lg"
              }`}
            >
              {agent.agent.displayName.charAt(0).toUpperCase()}
            </div>
            {isCallActive && (
              <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-blue-500/20 animate-ping" />
            )}
          </div>
          <div className="h-24 flex items-center justify-center">
            <VoiceVisualizer
              isActive={
                isCallActive &&
                (voiceState.isListening ||
                  voiceState.isSpeaking ||
                  voiceState.isProcessing)
              }
              type={
                voiceState.isListening
                  ? "listening"
                  : voiceState.isSpeaking
                  ? "speaking"
                  : "processing"
              }
            />
          </div>
          {currentTranscript && (
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 fade-in">
              <p className="text-sm text-gray-600 mb-1">You're saying:</p>
              <p className="text-gray-900 font-medium">{currentTranscript}</p>
            </div>
          )}
          {lastResponse && isCallActive && (
            <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200 fade-in">
              <p className="text-sm text-blue-600 mb-1">Agent responded:</p>
              <p className="text-blue-900 font-medium">{lastResponse}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm rounded-lg p-4 border border-red-200 fade-in">
              <p className="text-sm text-red-600 mb-1">Error:</p>
              <p className="text-red-900 font-medium">{error}</p>
            </div>
          )}
          {/* for testing audio from LMNT*/}
          {/* {downloadUrl && (
            <div className="mt-4">
              <a
                href={downloadUrl}
                download="captured_audio.pcm"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download Captured Audio
              </a>
            </div>
          )} */}
          <div className="flex items-center justify-center gap-6">
            {!isCallActive ? (
              <button
                onClick={startCall}
                className="w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl focus-ring"
                aria-label="Start call"
              >
                <PhoneIcon />
              </button>
            ) : (
              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl focus-ring animate-pulse"
                aria-label="End call"
              >
                <PhoneOffIcon />
              </button>
            )}
          </div>
          <div className="text-center space-y-2">
            {!isCallActive ? (
              <div>
                <p className="text-gray-600">
                  Click the call button to start talking with{" "}
                  {agent.agent.displayName}
                </p>
                <p className="text-sm text-gray-500">
                  Make sure your microphone is enabled
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">
                  {voiceState.isListening
                    ? "Speak now..."
                    : voiceState.isSpeaking
                    ? "Agent is responding..."
                    : voiceState.isProcessing
                    ? "Processing your message..."
                    : "Conversation active"}
                </p>
                <p className="text-sm text-gray-500">
                  Click the red button to end the call
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Voice: {agent.tts.voice}</span>
              {agent.agent.backgroundSound !== "none" && (
                <span>Background: {agent.agent.backgroundSound}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Voice AI Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterface;
