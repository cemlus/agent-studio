"use client"

import type React from "react"
import { useState } from "react"
import Sidebar from "./components/Sidebar"
import CreateAgent from "./components/CreateAgent"
import MyAgents from "./components/MyAgents"
import VoiceInterface from "./components/VoiceInterface"
import VoiceTraining from "./components/VoiceTraining"
import type { Agent } from "./components/types/index"

type CurrentView = "create" | "my-agents" | "voice" | "voice-training"

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [currentView, setCurrentView] = useState<CurrentView>("create")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const handleViewChange = (view: CurrentView): void => {
    setCurrentView(view)
    if (view !== "voice") {
      setSelectedAgent(null)
    }
  }

  const navigateToMyAgents = (component: CurrentView) => {
    setCurrentView(component)
  }
  const handleAgentSelect = (agent: Agent): void => {
    setSelectedAgent(agent)
    setCurrentView("voice")
  }

  const renderCurrentView = (): React.ReactNode => {
    switch (currentView) {
      case "create":
        return <CreateAgent onAgentCreated={navigateToMyAgents}/>
      case "my-agents":
        return <MyAgents onAgentSelect={handleAgentSelect} />
      case "voice":
        return selectedAgent ? (
          <VoiceInterface agent={selectedAgent} onBack={() => setCurrentView("my-agents")} />
        ) : (
          <MyAgents onAgentSelect={handleAgentSelect} />
        )
      case "voice-training":
        return <VoiceTraining onBack={() => setCurrentView("create")} />
      default:
        return <CreateAgent onAgentCreated={navigateToMyAgents}/>
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      <main className={`flex-1 transition-smooth ${sidebarCollapsed ? "ml-16" : "ml-64"} lg:ml-64`}>
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default App
