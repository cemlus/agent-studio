export interface FormData {
  displayName: string
  greetingMessage: string
  systemPrompt: string
  knowledgeBase: string
  selectedVoice: string
  selectedVoiceId: string
  backgroundSound: string,
  backgroundSoundUrl: string,
  ttsProvider: string,
  asrProvider: string
}

export interface FormErrors {
    displayName?: string
    greetingMessage?: string
    systemPrompt?: string
    selectedVoice?: string
    ttsProvider?: string,
    asrProvider?: string
}

export interface Step {
  number: number
  title: string
  description: string
}

export interface Voice {
  id: string
  name: string
  description: string
}

export interface BackgroundSound {
  id: string
  name: string
  description: string
}

export interface NavItem {
  name: string
  href: string
  active: boolean
}

export interface Agent {
  _id: string,
  agentId: string,
  agent: {
            displayName: string,
            greetingMessage: string,
            systemPrompt: string,
            knowledgeBase?: string,
            backgroundSound: string,
            backgroundSoundUrl: string
  },
  tts: {
    provider: string,
    voice: string,
    voiceId: string
  },
  asr: {
    provider: string
  }
  createdAt: Date
  lastUsed?: Date
  status: "ready" | "inactive"
}


export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  volume: number
}

export interface AudioVisualizerProps {
  isActive: boolean
  volume?: number
  type: "listening" | "speaking" | "processing"
}

export interface CustomVoice {
  id: string
  name: string
  gender: "male" | "female" | "neutral"
  description: string
  enhance: boolean
  files: File[]
  createdAt: Date
  status: "training" | "ready" | "failed"
  trainingProgress?: number
}

export interface VoiceTrainingFormData {
  name: string
  enhance: boolean
  files: File[]
  gender: string
  description: string
}