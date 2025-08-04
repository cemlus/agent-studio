"use client"

import { useState, useEffect, useRef } from "react"

interface UseSpeechSynthesisReturn {
  speak: (text: string, voice?: string) => void
  stop: () => void
  isSpeaking: boolean
  voices: SpeechSynthesisVoice[]
}

export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    const updateVoices = () => {
      setVoices(speechSynthesis.getVoices())
    }

    updateVoices()
    speechSynthesis.addEventListener("voiceschanged", updateVoices)

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", updateVoices)
      if (utteranceRef.current) {
        speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = (text: string, voiceName?: string): void => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      if (voiceName) {
        const selectedVoice = voices.find((voice) => voice.name.toLowerCase().includes(voiceName.toLowerCase()))
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      utteranceRef.current = utterance
      speechSynthesis.speak(utterance)
    }
  }

  const stop = (): void => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  return {
    speak,
    stop,
    isSpeaking,
    voices,
  }
}
