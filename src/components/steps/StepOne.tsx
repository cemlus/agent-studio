"use client"

import type React from "react"
import FormField from "../FormField"
import type { FormData, FormErrors } from "../types/index"

interface StepOneProps {
    formData: FormData
    updateFormData: (field: keyof FormData, value: string) => void
    errors: FormErrors
}

const StepOne: React.FC<StepOneProps> = ({ formData, updateFormData, errors }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Identity & Behavior</h2>
                <p className="text-gray-600 text-sm">Define how your agent will introduce itself and behave.</p>
            </div>

            <FormField label="Display Name" required error={errors.displayName}>
                <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => updateFormData("displayName", e.target.value)}
                    placeholder="Enter agent name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth"
                />
            </FormField>

            <FormField
                label="Greeting Message"
                required
                error={errors.greetingMessage}
                helper={`${formData.greetingMessage.length}/200 characters`}
            >
                <textarea
                    value={formData.greetingMessage}
                    onChange={(e) => updateFormData("greetingMessage", e.target.value)}
                    placeholder="How should your agent greet users?"
                    maxLength={200}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth resize-none"
                />
            </FormField>

            <FormField
                label="System Prompt"
                required
                error={errors.systemPrompt}
                helper="Define your agent's personality, expertise, and behavior guidelines."
            >
                <textarea
                    value={formData.systemPrompt}
                    onChange={(e) => updateFormData("systemPrompt", e.target.value)}
                    placeholder="You are a helpful assistant that..."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth resize-none"
                />
            </FormField>

            <FormField label="Knowledge Base" helper="Enter context to enhance your agent's reponses.">
                <div className="space-y-3">
                    <textarea
                    value={formData.knowledgeBase}
                    onChange={(e) => updateFormData("knowledgeBase", e.target.value)}
                    placeholder="Enter the important information that you want the agent to know beforehand."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth resize-none"
                />
                    
                </div>
            </FormField>
        </div>
    )
}


export default StepOne
