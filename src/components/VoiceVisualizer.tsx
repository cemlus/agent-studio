"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { AudioVisualizerProps } from "./types/index"

const VoiceVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, type }) => {
  const [bars, setBars] = useState<number[]>(Array(40).fill(0))
  const [centerPulse, setCenterPulse] = useState<number>(0)

  useEffect(() => {
    let animationFrame: number

    const animate = () => {
      if (isActive) {
        setBars((prev) =>
          prev.map((_, index) => {
            const distanceFromCenter = Math.abs(index - 19.5)
            const baseHeight = type === "processing" ? 0.4 : 0.2
            const maxHeight = type === "speaking" ? 1.0 : type === "listening" ? 0.8 : 0.6

            // Create wave effect from center
            const waveEffect = Math.sin(Date.now() * 0.01 + index * 0.3) * 0.3
            const randomHeight = Math.random() * maxHeight
            const centerBoost = Math.max(0, 1 - distanceFromCenter * 0.1)

            return Math.min(maxHeight, baseHeight + randomHeight * centerBoost + waveEffect * 0.2)
          }),
        )

        // Center pulse effect
        setCenterPulse(Math.sin(Date.now() * 0.008) * 0.5 + 0.5)
      } else {
        setBars((prev) => prev.map((height) => Math.max(0, height * 0.92)))
        setCenterPulse((prev) => prev * 0.95)
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isActive, type])

  const getBarColor = (): string => {
    switch (type) {
      case "listening":
        return "from-blue-400 to-blue-600"
      case "speaking":
        return "from-green-400 to-green-600"
      case "processing":
        return "from-purple-400 to-purple-600"
      default:
        return "from-gray-300 to-gray-400"
    }
  }

  const getGlowColor = (): string => {
    switch (type) {
      case "listening":
        return "shadow-blue-500/50"
      case "speaking":
        return "shadow-green-500/50"
      case "processing":
        return "shadow-purple-500/50"
      default:
        return "shadow-gray-300/50"
    }
  }

  return (
    <div className="relative flex items-center justify-center space-x-1 h-20 w-full max-w-md">
      {/* Center pulse effect */}
      {isActive && (
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${getBarColor()} opacity-20 blur-xl`}
          style={{
            transform: `scale(${1 + centerPulse * 0.5})`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}

      {/* Visualizer bars */}
      {bars.map((height, index) => {
        const distanceFromCenter = Math.abs(index - 19.5)
        const opacity = Math.max(0.3, 1 - distanceFromCenter * 0.02)

        return (
          <div
            key={index}
            className={`w-1 rounded-full bg-gradient-to-t ${getBarColor()} transition-all duration-75 ${
              isActive ? `shadow-md ${getGlowColor()}` : ""
            }`}
            style={{
              height: `${Math.max(2, height * 60)}px`,
              opacity: isActive ? opacity : 0.3,
              transform: `scaleY(${isActive ? 1 : 0.5})`,
            }}
          />
        )
      })}
    </div>
  )
}

export default VoiceVisualizer
