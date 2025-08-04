"use client"

import type React from "react"
import { useState } from "react"
import ProgressIndicator from "./ProgressIndicator"
import StepOne from "./steps/StepOne"
import StepTwo from "./steps/StepTwo"
import StepThree from "./steps/StepThree"
import type { FormData, FormErrors, Step } from "./types/index"
import axios from "axios"

const CreateAgent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [formData, setFormData] = useState<FormData>({
    displayName: "",
    greetingMessage: "",
    systemPrompt: "",
    knowledgeBase: "",
    selectedVoice: "",
    selectedVoiceId: "",
    backgroundSound: "",
    ttsProvider: "",
    asrProvider: "",
    backgroundSoundUrl: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const steps: Step[] = [
    { number: 1, title: "Details", description: "Basic information" },
    { number: 2, title: "Voice", description: "Audio settings" },
    { number: 3, title: "Review", description: "Final review" },
  ]

  const updateFormData = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {}

    if (step === 1) {
      if (!formData.displayName.trim()) {
        newErrors.displayName = "Display name is required"
      }
      if (!formData.greetingMessage.trim()) {
        newErrors.greetingMessage = "Greeting message is required"
      }
      if (!formData.systemPrompt.trim()) {
        newErrors.systemPrompt = "System prompt is required"
      }
    }
    
    if (step === 2) {
        if (!formData.selectedVoice) {
            newErrors.selectedVoice = "Please select a voice"
        }
        // if (!formData.ttsProvider.trim()) {
        //   newErrors.ttsProvider = "tts provider is required"
        // }
        // if (!formData.asrProvider.trim()) {
        //   newErrors.asrProvider = "asr provider is required"
        // }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async() => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1)
      } else {
        console.log("Creating agent:", formData)
        console.log(formData);
        try {
            const repsonse = await axios.post("https://goodmeetings-voice-ai.onrender.com/api/v1/agent/create-agent", {
                agent: {
                    displayName: formData.displayName,
                    greetingMessage: formData.greetingMessage,
                    knowledgeBase: formData.knowledgeBase,
                    backgroundSound: formData.backgroundSound,
                    backgroundSoundUrl: formData.backgroundSoundUrl,
                },
                tts: {
                    provider: formData.ttsProvider.toLowerCase(),
                    voice: formData.selectedVoice,
                    voiceId: formData.selectedVoiceId
                }, 
                asr: {
                    provider: formData.asrProvider.toLowerCase()
                }
            })
            console.log(repsonse.data)
        } catch (error) {
            console.log(error);
        }
      }
    }
  }

  const handlePrevious = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = (step: number): boolean => {
    if (step === 1) {
      return !!(formData.displayName.trim() && formData.greetingMessage.trim() && formData.systemPrompt.trim())
    }
    if (step === 2) {
      return !!formData.selectedVoice
    }
    return true
  }

  const renderStep = (): React.ReactNode => {
    switch (currentStep) {
      case 1:
        return <StepOne formData={formData} updateFormData={updateFormData} errors={errors} />
      case 2:
        return <StepTwo formData={formData} updateFormData={updateFormData} errors={errors} />
      case 3:
        return <StepThree formData={formData} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-0 bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <span>Agent Studio</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Create Agent</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create Agent</h1>
          <p className="text-gray-600">Define your assistant's behavior and personality.</p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          isStepValid={isStepValid}
        />

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6 fade-in">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center bg-white rounded-lg border border-gray-200 p-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth focus-ring rounded-md"
          >
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>

          <button
            onClick={handleNext}
            disabled={!isStepValid(currentStep)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth focus-ring"
          >
            {currentStep === 3 ? "Create Agent" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateAgent
