"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import type { Agent, VoiceState } from "./types/index"
import VoiceVisualizer from "./VoiceVisualizer"
import { BackIcon, MicIcon, PhoneIcon, PhoneOffIcon } from "./Icons"

// WebSocket and audio constants
const WS_URL = "http://localhost:9000/api/v1/talk/"
// const WS_URL = "https://goodmeetings-voice-ai.onrender.com/api/v1/talk/"
const BACKGROUND_CONSTANT_VOLUME = 0.4

const LiveConvoWebsocketEvents = {
  ConversationInitMetadata: "conversation_init_metadata",
  UserTranscript: "user_transcript",
  Interruption: "interruption",
  AgentTranscript: "agent_transcript",
  UtteranceEnd: "utterance_end",
  AudioStream: "audio_stream",
  Error: "error",
  UserAudio: "user_audio",
}

interface VoiceInterfaceProps {
  agent: Agent
  onBack: () => void
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ agent, onBack }) => {
  const BACKGROUND_AUDIO_URL = "https://s3.ap-south-1.amazonaws.com/assets.amongst.ai/assets/busy-call-centre.1.mp4"

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    volume: 0,
  })
  const [isCallActive, setIsCallActive] = useState<boolean>(false)
  const [currentTranscript, setCurrentTranscript] = useState<string>("")
  const [lastResponse, setLastResponse] = useState<string>("")
  const [callDuration, setCallDuration] = useState<number>(0)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const mediaSourceRef = useRef<MediaSource | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const audioQueueRef = useRef<Uint8Array[]>([])
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const callStartTimeRef = useRef<any>(null)

  // Background audio control
  const startBackgroundAudio = useCallback(() => {
    const bg = backgroundAudioRef.current
    if (!bg) return console.warn("Background audio element missing")
    if (bg.paused) {
      bg.volume = BACKGROUND_CONSTANT_VOLUME
      bg.play().catch((e) => {
        console.error("Background playback failed:", e)
        setError("Failed to play background audio. User interaction may be needed.")
      })
    }
  }, [])

  const stopBackgroundAudio = useCallback(() => {
    const bg = backgroundAudioRef.current
    if (!bg) return
    if (!bg.paused) {
      bg.pause()
      bg.currentTime = 0
    }
  }, [])

  const endCall = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      const tracks = mediaRecorderRef.current.stream?.getTracks()
      tracks?.forEach((track) => track.stop())
      mediaRecorderRef.current = null
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.src = ""
      URL.revokeObjectURL(audioElementRef.current.src)
    }

    if (mediaSourceRef.current && mediaSourceRef.current.readyState === "open") {
      mediaSourceRef.current.endOfStream()
    }

    stopBackgroundAudio()

    setIsCallActive(false)

    setConnectionStatus("disconnected")
    setVoiceState({
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      volume: 0,
    })
    setCurrentTranscript("")
    setLastResponse("")
    setError(null)
    setCallDuration(0)
    audioQueueRef.current = []

    // ------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // ------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // ------------------------------------------------------------------------------------------------------------------------------------------------------------------

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
  }, [stopBackgroundAudio])



  // Process audio chunks using MediaSource API
  // const processAudioChunk = useCallback(
  //   (audioData: Uint8Array) => {
  //     if (!sourceBufferRef.current) {
  //       console.warn("SourceBuffer not ready, queuing audio chunk.")
  //       audioQueueRef.current.push(audioData)
  //       return
  //     }
  //     if (sourceBufferRef.current.updating) {
  //       audioQueueRef.current.push(audioData)
  //       return
  //     }

  //     try {
  //       // @ts-ignore
  //       sourceBufferRef.current.appendBuffer(audioData)

  //       if (audioElementRef.current?.paused) {
  //         audioElementRef.current.play().catch((e) => {
  //           console.error("Playback failed:", e)
  //           setVoiceState((prev) => ({ ...prev, isSpeaking: true }))
  //           setError("Agent is speaking... (Click to unmute)")
  //         })
  //       }
  //     } catch (e) {
  //       console.error("Error appending audio chunk:", e)
  //       setError("Audio stream processing error. Please reconnect.")
  //       endCall()
  //     }
  //   },
  //   [endCall]
  // )
  const processAudioChunk = useCallback(
    (audioData: Uint8Array) => {
      // --- START OF FIX ---
      // Add a more robust check to ensure the MediaSource is still open.
      // This prevents writing to a buffer that has been detached.
      if (
        !sourceBufferRef.current ||
        !mediaSourceRef.current ||
        mediaSourceRef.current.readyState !== "open"
      ) {
        // If the source is not ready, we can either queue or, more safely, just drop the chunk
        // since a reset is likely in progress (due to interruption or end of call).
        console.warn("SourceBuffer not ready or MediaSource closed, dropping audio chunk.")
        return
      }
      // --- END OF FIX ---

      if (sourceBufferRef.current.updating) {
        audioQueueRef.current.push(audioData)
        return
      }

      try {
        // @ts-ignore
        sourceBufferRef.current.appendBuffer(audioData)

        if (audioElementRef.current?.paused) {
          audioElementRef.current.play().catch((e) => {
            console.error("Playback failed:", e)
            setVoiceState((prev) => ({ ...prev, isSpeaking: true }))
            setError("Agent is speaking... (Click to unmute)")
          })
        }
      } catch (e) {
        // This catch block will still handle other potential errors,
        // but the InvalidStateError should now be prevented.
        console.error("Error appending audio chunk:", e)
        setError("Audio stream processing error. Please reconnect.")
        endCall()
      }
    },
    [endCall] // The dependencies are correct
  )


  // Setup MediaSource for audio streaming
  const setupAudioStream = useCallback(() => {
    if (mediaSourceRef.current) return

    const mediaSource = new MediaSource()
    mediaSourceRef.current = mediaSource

    const audioUrl = URL.createObjectURL(mediaSource)
    if (audioElementRef.current) {
      audioElementRef.current.src = audioUrl
      audioElementRef.current.autoplay = true
      audioElementRef.current.muted = false
    }

    mediaSource.addEventListener("sourceopen", () => {
      try {
        const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg")
        sourceBufferRef.current = sourceBuffer

        sourceBuffer.addEventListener("updateend", () => {
          if (audioQueueRef.current.length > 0 && !sourceBuffer.updating) {
            const nextAudioData = audioQueueRef.current.shift()
            if (nextAudioData) {
              processAudioChunk(nextAudioData)
            }
          }
        })
      } catch (e) {
        console.error("Error creating SourceBuffer:", e)
        setError("Failed to create audio buffer. Please check codec support.")
        endCall()
      }
    })

    mediaSource.addEventListener("sourceended", () => {
      console.log("MediaSource ended.")
      setVoiceState((prev) => ({ ...prev, isSpeaking: false }))
      if (connectionStatus === "connected") {
        setVoiceState((prev) => ({ ...prev, isListening: true }))
      }
    })
  }, [processAudioChunk])

  // Start streaming user audio
  const startUserAudio = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log(wsRef.current);
      // setError("WebSocket is not connected.")
      // return
    }

    if (mediaRecorderRef.current) {
      console.log(`function returned`);
      return;
    }

    try {
      console.log('hello from startUserAudio');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm; codecs=opus"

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      console.log('mic open');
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'greetingMessage',
          data: agent.agent.greetingMessage
        }))
        console.log(`greeting sent`);
      } else {
        console.log(`greeting not sent`);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader()
          reader.onload = () => {
            // @ts-ignore
            const base64Audio = btoa(String.fromCharCode.apply(null, new Uint8Array(reader.result)))
            const message = {
              type: LiveConvoWebsocketEvents.UserAudio,
              data: base64Audio,
            }


            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify(message))
            }
          }
          reader.readAsArrayBuffer(event.data)
        }
      }

      mediaRecorder.start(250)
      setVoiceState((prev) => ({ ...prev, isListening: true }))
    } catch (e) {
      console.error("Error starting user audio stream:", e)
      setError("Could not access microphone. Please check permissions.")
      setVoiceState((prev) => ({ ...prev, isListening: false }))
    }
  }, [])

  // Handle WebSocket messages
  const handleWsMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)
        console.log("Received basic message:", message)

        switch (message.type) {
          case LiveConvoWebsocketEvents.ConversationInitMetadata:
            setConnectionStatus("connected")
            console.log("initialised metadata");
            // console.log(message.agent);


            setLastResponse(message.agent?.greetingMessage || agent.agent.greetingMessage)
            startBackgroundAudio()
            break

          case LiveConvoWebsocketEvents.UserTranscript:
            if (message.data.isFinal) {
              setCurrentTranscript("")
            } else {
              setCurrentTranscript(message.data.text)
            }
            break

          case LiveConvoWebsocketEvents.Interruption:
            if (audioElementRef.current) {
              const oldUrl = audioElementRef.current.src
              audioElementRef.current.pause()
              audioElementRef.current.removeAttribute("src")
              if (oldUrl?.startsWith("blob:")) URL.revokeObjectURL(oldUrl)
            }
            mediaSourceRef.current = null
            sourceBufferRef.current = null
            audioQueueRef.current = []
            setupAudioStream()
            setVoiceState((prev) => ({ ...prev, isSpeaking: false, isListening: true }))
            setError(null)
            break

          case LiveConvoWebsocketEvents.AgentTranscript:
            console.log(message);

            setLastResponse(message.data.text)
            setVoiceState((prev) => ({ ...prev, isProcessing: false, isSpeaking: true }))
            break

          case LiveConvoWebsocketEvents.UtteranceEnd:
            setVoiceState((prev) => ({ ...prev, isListening: false, isProcessing: true }))
            break

          case LiveConvoWebsocketEvents.AudioStream:
            if (message.data && typeof message.data === "object") {
              console.log(message.data);
              console.log(message.data.data);

              const audioData = new Uint8Array(Object.values(message.data.data))
              processAudioChunk(audioData)
            } else {
              console.error("Received malformed audio stream data:", message.data)
              setError("Audio stream received with invalid data.")
            }
            break

          case LiveConvoWebsocketEvents.Error:
            setError(`Server Error: ${message.data.message || "An unknown error occurred."}`)
            endCall()
            break

          default:
            console.warn("Unknown WebSocket message type:", message.type)
            break
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e)
        setError("Failed to process data from the server.")
      }
    },
    [processAudioChunk, setupAudioStream, startBackgroundAudio]
  )

  // Initialize WebSocket connection
  const connectToWebSocket = useCallback(() => {
    if (wsRef.current) return


    setConnectionStatus("connecting")
    setError(null)

    setupAudioStream()
    startBackgroundAudio()
    console.log((WS_URL + agent.agentId));

    const ws = new WebSocket(WS_URL + agent.agentId)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("WebSocket connection opened.")
      setIsCallActive(true)
    }

    ws.onmessage = handleWsMessage

    ws.onclose = () => {
      console.log("WebSocket connection closed.")
      endCall()
    }

    ws.onerror = (e) => {
      console.error("WebSocket error:", e)
      setError("WebSocket connection error. Is the backend running?")
      endCall()
    }
  }, [handleWsMessage, setupAudioStream, startBackgroundAudio])




  // Start call
  const startCall = async (): Promise<void> => {
    connectToWebSocket()            // works    
    setConnectionStatus("connecting")
    setIsCallActive(true)
    startUserAudio()
    console.log(`hello_4`);
  }

  // End call and cleanup
  useEffect(() => {
    const voice = agent.tts.voiceId;
    console.log(voice);

  }, [])

  // Call timer
  useEffect(() => {
    if (isCallActive) {
      callStartTimeRef.current = Date.now()
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
      }, 1000)
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }
      setCallDuration(0)
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [isCallActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [endCall])

  // Unmute when agent speaks
  useEffect(() => {
    if (voiceState.isSpeaking && audioElementRef.current) {
      audioElementRef.current.muted = false
    }
  }, [voiceState.isSpeaking])

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusText = (): string => {
    if (connectionStatus === "connecting") return "Connecting..."
    if (!isCallActive) return "Ready to call"
    if (voiceState.isSpeaking) return "Agent speaking..."
    if (voiceState.isListening) return "Listening..."
    if (voiceState.isProcessing) return "Processing..."
    return "Connected"
  }

  const getStatusColor = (): string => {
    if (connectionStatus === "connecting") return "text-yellow-600"
    if (!isCallActive) return "text-gray-600"
    if (voiceState.isSpeaking) return "text-green-600"
    if (voiceState.isListening) return "text-blue-600"
    if (voiceState.isProcessing) return "text-purple-600"
    return "text-green-600"
  }

  const isSpeechRecognitionSupported = (): boolean => {
    return "SpeechRecognition" in window || "webkitSpeechRecognition" in window
  }

  if (!isSpeechRecognitionSupported()) {
    return (
      <div className="min-h-screen pt-20 lg:pt-0 bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <MicIcon />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Speech Recognition Not Supported</h2>
          <p className="text-gray-600 mb-4">
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for the best experience.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-smooth"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Background audio */}
      <audio
        ref={backgroundAudioRef}
        src={BACKGROUND_AUDIO_URL}
        loop
        preload="auto"
        style={{ display: "none" }}
      />
      {/* AI audio */}
      <audio ref={audioElementRef} />
      {/* Header */}
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
              <h1 className="text-lg font-semibold text-gray-900">{agent.agent.displayName}</h1>
              <p className={`text-sm transition-colors ${getStatusColor()}`}>
                {getStatusText()}
                {isCallActive && connectionStatus === "connected" && (
                  <span className="ml-2 text-gray-500">• {formatCallDuration(callDuration)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connectionStatus === "connected"
                ? "bg-green-500 animate-pulse"
                : connectionStatus === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-gray-400"
                }`}
            />
            <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>
      {/* Main Voice Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Agent Avatar */}
          <div className="relative">
            <div
              className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold transition-all duration-300 ${isCallActive ? "scale-110 shadow-2xl" : "scale-100 shadow-lg"
                }`}
            >
              {agent.agent.displayName.charAt(0).toUpperCase()}
            </div>
            {isCallActive && (
              <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-blue-500/20 animate-ping" />
            )}
          </div>
          {/* Voice Visualizer */}
          <div className="h-24 flex items-center justify-center">
            <VoiceVisualizer
              isActive={isCallActive && (voiceState.isListening || voiceState.isSpeaking || voiceState.isProcessing)}
              type={voiceState.isListening ? "listening" : voiceState.isSpeaking ? "speaking" : "processing"}
            />
          </div>
          {/* Current Transcript */}
          {currentTranscript && (
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 fade-in">
              <p className="text-sm text-gray-600 mb-1">You're saying:</p>
              <p className="text-gray-900 font-medium">{currentTranscript}</p>
            </div>
          )}
          {/* Last Response */}
          {lastResponse && isCallActive && (
            <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200 fade-in">
              <p className="text-sm text-blue-600 mb-1">Agent responded:</p>
              <p className="text-blue-900 font-medium">{lastResponse}</p>
            </div>
          )}
          {/* Error Message */}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm rounded-lg p-4 border border-red-200 fade-in">
              <p className="text-sm text-red-600 mb-1">Error:</p>
              <p className="text-red-900 font-medium">{error}</p>
            </div>
          )}
          {/* Call Controls */}
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
          {/* Instructions */}
          <div className="text-center space-y-2">
            {!isCallActive ? (
              <div>
                <p className="text-gray-600">Click the call button to start talking with {agent.agent.displayName}</p>
                <p className="text-sm text-gray-500">Make sure your microphone is enabled</p>
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
                <p className="text-sm text-gray-500">Click the red button to end the call</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Agent Info Footer */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Voice: {agent.tts.voice}</span>
              {agent.agent.backgroundSound !== "none" && <span>Background: {agent.agent.backgroundSound}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Voice AI Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceInterface
