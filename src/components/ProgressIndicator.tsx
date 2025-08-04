"use client"

import React from "react"
import type { Step } from "./types/index"

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick: (step: number) => void
  isStepValid: (step: number) => boolean
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, currentStep, onStepClick, isStepValid }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep
          const isCompleted = step.number < currentStep
          const isClickable =
            step.number <= currentStep || (step.number === currentStep + 1 && isStepValid(currentStep))

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(step.number)}
                  disabled={!isClickable}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-smooth focus-ring ${
                    isCompleted
                      ? "bg-blue-600 text-white"
                      : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                  } ${isClickable ? "hover:scale-105 cursor-pointer" : "cursor-not-allowed"}`}
                >
                  {isCompleted ? <CheckIcon /> : step.number}
                </button>
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400">{step.description}</div>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${step.number < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

const CheckIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
)

export default ProgressIndicator
