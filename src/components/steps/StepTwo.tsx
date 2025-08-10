"use client"

import type React from "react"
import { useEffect, useState } from "react"
import FormField from "../FormField"
import type { FormData, FormErrors, Voice, BackgroundSound } from "../types/index"
import axios from 'axios'

interface StepTwoProps {
    formData: FormData
    updateFormData: (field: keyof FormData, value: string) => void
    errors: FormErrors
}

const StepTwo: React.FC<StepTwoProps> = ({ formData, updateFormData, errors }) => {
    const [ttsProvider, setTtsProvider] = useState<string>(formData.ttsProvider || "LMNT")
    const [asrProvider, setAsrProvider] = useState<string>(formData.asrProvider || "Deepgram")

    const [voices, setVoices] = useState<Voice[]>([])
    useEffect(() => {
        updateFormData("ttsProvider", ttsProvider)
        axios.get(`https://goodmeetings-voice-ai.onrender.com/api/v1/agent/list-voices/${ttsProvider}`)
            .then(response => {
                setVoices(response.data.voices || [])
            })
            .catch(err => console.error(err))
    }, [ttsProvider])

    useEffect(() => {
        updateFormData("asrProvider", asrProvider)
    }, [asrProvider])

    const backgroundSounds: BackgroundSound[] = [
        { id: "", name: "None", description: "No background sound" },
        { id: "https://s3.ap-south-1.amazonaws.com/assets.amongst.ai/assets/busy-call-centre.1.mp4", name: "Café Atmosphere", description: "Light café background" },
    ]


    return (
        <div className="space-y-6">
            {/* Provider Selection */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Providers</h2>
                <p className="text-gray-600 text-sm">Select TTS and ASR providers.</p>
            </div>

            <FormField
                label="TTS Provider"
                required
                error={errors.ttsProvider}
                helper="Choose your text-to-speech service"
            >
                <select
                    value={ttsProvider}
                    onChange={(e) => setTtsProvider(e.target.value)}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="LMNT">LMNT</option>
                    <option value="Deepgram">Deepgram</option>
                </select>
            </FormField>

            <FormField
                label="ASR Provider"
                required
                error={errors.asrProvider}
                helper="Choose your speech-to-text service"
            >
                <select
                    value={asrProvider}
                    onChange={(e) => setAsrProvider(e.target.value)}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="LMNT">LMNT</option>
                    <option value="Deepgram">Deepgram</option>
                </select>
            </FormField>

            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Voice & Audio</h2>
                <p className="text-gray-600 text-sm">Choose how your agent will sound to users.</p>
            </div>

            <FormField
                label="Voice Selection"
                required
                error={errors.selectedVoice}
                helper="Select a voice that matches your agent's personality"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {voices.map((voice) => (
                        <div
                            key={voice.id}
                            onClick={() => {
                                console.log(voice.id);

                                updateFormData("selectedVoice", voice.name)
                                updateFormData("selectedVoiceId", voice.id)
                            }}
                            className={`p-4 border rounded-md cursor-pointer transition-smooth ${formData.selectedVoice === voice.name && formData.selectedVoiceId === voice.id
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900">{voice.name}</h3>
                                    <p className="text-sm text-gray-600">{voice.description}</p>
                                </div>
                                <button

                                    className="p-2 rounded-md hover:bg-gray-100 transition-smooth focus-ring"
                                    aria-label={`Play ${voice.name} sample`}
                                >
                                    {<PlayIcon />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </FormField>

            <FormField label="Background Sound" helper="Optional: Add ambient sound to create atmosphere">
                <div className="space-y-2">
                    {backgroundSounds.map((sound) => (
                        <div
                            key={sound.id}
                            onClick={() => {
                                updateFormData("backgroundSoundUrl", sound.id)
                                updateFormData("backgroundSound", sound.name)
                            } }
                            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-smooth ${formData.backgroundSoundUrl === sound.id && formData.backgroundSound === sound.name
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <div>
                                <h4 className="font-medium text-gray-900">{sound.name}</h4>
                                <p className="text-sm text-gray-600">{sound.description}</p>
                            </div>
                            {sound.id !== "none" && (
                                <button
                                    className="p-2 rounded-md hover:bg-gray-100 transition-smooth focus-ring"
                                    aria-label={`Play ${sound.name} sample`}
                                >
                                    {<PlayIcon />}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </FormField>
        </div>
    )
}

const PlayIcon: React.FC = () => (
    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
        />
    </svg>
)

const StopIcon: React.FC = () => (
    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
            clipRule="evenodd"
        />
    </svg>
)

export default StepTwo
