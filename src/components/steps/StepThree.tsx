"use client"

import type React from "react"
import type { FormData } from "../types/index"

interface StepThreeProps {
  formData: FormData
}

const StepThree: React.FC<StepThreeProps> = ({ formData }) => {
  const voices: Record<string, string> = {
    sarah: "Sarah - Warm and professional",
    alex: "Alex - Clear and confident",
    emma: "Emma - Friendly and approachable",
    james: "James - Deep and authoritative",
  }

  const backgroundSounds: Record<string, string> = {
    none: "None",
    office: "Office Ambience",
    nature: "Nature Sounds",
    cafe: "Café Atmosphere",
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Review & Create</h2>
        <p className="text-gray-600 text-sm">Review your agent configuration before creating.</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Identity</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Display Name</span>
              <p className="font-medium">{formData.displayName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Greeting Message</span>
              <p className="text-gray-700">{formData.greetingMessage}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-3">Behavior</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">System Prompt</span>
              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md border">{formData.systemPrompt}</p>
            </div>
            {formData.knowledgeBase && (
              <div>
                <span className="text-sm text-gray-500">Knowledge Base</span>
                <p className="text-gray-700">{formData.knowledgeBase}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-3">Audio Settings</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Voice</span>
              <p className="font-medium">{formData.selectedVoice || "Not selected"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Background Sound</span>
              <p className="font-medium">{formData.backgroundSound || "None"}</p>
            </div>
          </div>
        </div>

        {/* New Providers Review Section */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Providers</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">TTS Provider</span>
              <p className="font-medium">{formData.ttsProvider || "LMNT"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">ASR Provider</span>
              <p className="font-medium">{formData.asrProvider || "Deepgram"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <InfoIcon />
          <div className="ml-3">
            <h4 className="font-medium text-blue-900">Ready to Create</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your agent will be created with the settings above. You can modify these settings later from the agent
              dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const InfoIcon: React.FC = () => (
  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
)

export default StepThree
