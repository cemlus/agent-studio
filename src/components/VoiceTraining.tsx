"use client"

import type React from "react"
import { useState, useRef } from "react"
import { BackIcon, UploadIcon, PlayIcon, StopIcon, MicIcon, TrashIcon } from "./Icons"
import type { VoiceTrainingFormData } from "./types/index"

interface VoiceTrainingProps {
  onBack: () => void
}

const VoiceTraining: React.FC<VoiceTrainingProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<VoiceTrainingFormData>({
    name: "",
    enhance: true,
    files: [],
    gender: "",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isTraining, setIsTraining] = useState<boolean>(false)
  const [trainingProgress, setTrainingProgress] = useState<number>(0)
  const [testText, setTestText] = useState<string>("Hello, this is a test of my custom voice. How does it sound?")
  const [isTestPlaying, setIsTestPlaying] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const acceptedFileTypes = [".wav", ".mp3", ".mp4", ".m4a", ".webm"]
  const maxFiles = 20
  const maxTotalSize = 250 * 1024 * 1024 // 250 MB

  const updateFormData = (field: keyof VoiceTrainingFormData, value: any): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files || [])
    const currentFiles = formData.files

    // Check file count limit
    if (currentFiles.length + files.length > maxFiles) {
      setErrors((prev) => ({ ...prev, files: `Maximum ${maxFiles} files allowed` }))
      return
    }

    // Check file types and total size
    let totalSize = currentFiles.reduce((sum, file) => sum + file.size, 0)
    const validFiles: File[] = []

    for (const file of files) {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

      if (!acceptedFileTypes.includes(fileExtension)) {
        setErrors((prev) => ({
          ...prev,
          files: `Invalid file type: ${file.name}. Accepted: ${acceptedFileTypes.join(", ")}`,
        }))
        continue
      }

      totalSize += file.size
      if (totalSize > maxTotalSize) {
        setErrors((prev) => ({ ...prev, files: "Total file size exceeds 250 MB limit" }))
        break
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      updateFormData("files", [...currentFiles, ...validFiles])
      setErrors((prev) => ({ ...prev, files: "" }))
    }
  }

  const removeFile = (index: number): void => {
    const newFiles = formData.files.filter((_, i) => i !== index)
    updateFormData("files", newFiles)
  }

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const file = new File([blob], `recording-${Date.now()}.wav`, { type: "audio/wav" })
        updateFormData("files", [...formData.files, file])

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingDuration(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      setErrors((prev) => ({ ...prev, recording: "Could not access microphone" }))
    }
  }

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalFileSize = (): number => {
    return formData.files.reduce((sum, file) => sum + file.size, 0)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Voice name is required"
    }

    if (formData.files.length === 0) {
      newErrors.files = "At least one audio file is required"
    }

    if (!formData.gender) {
      newErrors.gender = "Please select a gender"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTrainVoice = async (): Promise<void> => {
    if (!validateForm()) return

    setIsTraining(true)
    setTrainingProgress(0)

    // Simulate training progress
    const progressInterval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsTraining(false)
          alert("Voice training completed successfully!")
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  const testVoice = (): void => {
    if (!testText.trim()) return

    if (isTestPlaying) {
      speechSynthesis.cancel()
      setIsTestPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(testText)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    utterance.onstart = () => setIsTestPlaying(true)
    utterance.onend = () => setIsTestPlaying(false)
    utterance.onerror = () => setIsTestPlaying(false)

    synthRef.current = utterance
    speechSynthesis.speak(utterance)
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-0 bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 rounded-md hover:bg-gray-100 transition-smooth focus-ring"
              aria-label="Go back"
            >
              <BackIcon />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Voice Training</h1>
              <p className="text-gray-600">Create custom voices by uploading audio samples</p>
            </div>
          </div>
        </div>

        {/* Training Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="space-y-6">
            {/* Voice Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Voice Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Enter a name for your custom voice"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {["male", "female", "neutral"].map((gender) => (
                  <label key={gender} className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={(e) => updateFormData("gender", e.target.value)}
                      className="mr-2"
                    />
                    <span className="capitalize">{gender}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <p className="text-sm text-red-600 mt-1">{errors.gender}</p>}
            </div>

            {/* Enhancement Option */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enhance}
                  onChange={(e) => updateFormData("enhance", e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-900">Enhance voice quality (recommended)</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">Apply AI enhancement to improve clarity and naturalness</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Describe the voice characteristics, tone, and intended use..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth resize-none"
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
            </div>

            {/* Audio Files Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Audio Files <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Upload 3-20 audio samples (wav, mp3, mp4, m4a, webm). Max total size: 250 MB
              </p>

              {/* Upload Area */}
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-smooth cursor-pointer"
                >
                  <UploadIcon />
                  <p className="text-gray-600 mt-2">Click to upload audio files</p>
                  <p className="text-xs text-gray-400 mt-1">Supported: {acceptedFileTypes.join(", ")}</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={acceptedFileTypes.join(",")}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Recording Option */}
                <div className="flex items-center justify-center">
                  <span className="text-gray-400 text-sm">or</span>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-smooth focus-ring ${
                      isRecording
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <MicIcon />
                    {isRecording ? `Stop Recording (${formatDuration(recordingDuration)})` : "Record Audio"}
                  </button>
                </div>

                {errors.recording && <p className="text-sm text-red-600">{errors.recording}</p>}
              </div>

              {/* File List */}
              {formData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">
                      Uploaded Files ({formData.files.length}/{maxFiles})
                    </h4>
                    <span className="text-sm text-gray-500">Total: {formatFileSize(getTotalFileSize())} / 250 MB</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-smooth"
                          aria-label="Remove file"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.files && <p className="text-sm text-red-600 mt-1">{errors.files}</p>}
            </div>
          </div>
        </div>

        {/* Voice Testing */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Voice</h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter text to test how your voice will sound (uses system voice as preview)
          </p>

          <div className="space-y-4">
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test the voice..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth resize-none"
            />

            <button
              onClick={testVoice}
              disabled={!testText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth focus-ring"
            >
              {isTestPlaying ? <StopIcon /> : <PlayIcon />}
              {isTestPlaying ? "Stop Test" : "Test Voice"}
            </button>
          </div>
        </div>

        {/* Training Progress */}
        {isTraining && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Training in Progress</h3>
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Training your custom voice... {Math.round(trainingProgress)}% complete
              </p>
              <p className="text-xs text-gray-500">
                This process may take several minutes depending on the number and size of audio files.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center bg-white rounded-lg border border-gray-200 p-4">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-smooth focus-ring rounded-md"
          >
            Cancel
          </button>

          <button
            onClick={handleTrainVoice}
            disabled={isTraining || formData.files.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth focus-ring"
          >
            {isTraining ? "Training..." : "Train Voice"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VoiceTraining
