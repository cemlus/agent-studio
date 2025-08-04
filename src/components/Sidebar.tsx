"use client"

import type React from "react"
import { useState } from "react"
import type { NavItem } from "./types/index"

type CurrentView = "create" | "my-agents" | "voice" | "voice-training"

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  currentView: CurrentView
  onViewChange: (view: CurrentView) => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed: externalCollapsed, onToggle, currentView, onViewChange }) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false)
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed

  const navItems: (NavItem & { view: CurrentView })[] = [
    { name: "Create Agent", href: "#", active: currentView === "create", view: "create" },
    { name: "My Agents", href: "#", active: currentView === "my-agents" || currentView === "voice", view: "my-agents" },
    { name: "Voice Training", href: "#", active: currentView === "voice-training", view: "voice-training" },
  ]

  const handleToggle = (): void => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  const handleNavClick = (view: CurrentView): void => {
    onViewChange(view)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-smooth z-40 ${collapsed ? "w-16" : "w-64"} hidden lg:block`}
      >
        <div className="p-6">
          {/* Workspace indicator */}
          <div className={`text-xs text-gray-500 mb-2 ${collapsed ? "hidden" : "block"}`}>Workspace</div>

          {/* Logo/Title */}
          <div className="flex items-center justify-between mb-8">
            <h1 className={`font-semibold text-lg text-gray-900 ${collapsed ? "hidden" : "block"}`}>
              Voice Agent Studio
            </h1>
            <button
              onClick={handleToggle}
              className="p-2 rounded-md hover:bg-gray-100 transition-smooth focus-ring"
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.view)}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-smooth focus-ring ${
                  item.active ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" : "text-gray-700 hover:bg-gray-50"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <span className={collapsed ? "hidden" : "block"}>{item.name}</span>
                {collapsed && (
                  <span className="text-xs font-medium">
                    {item.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-50">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-lg text-gray-900">Voice Agent Studio</h1>
          <button onClick={handleToggle} className="p-2 rounded-md hover:bg-gray-100 transition-smooth focus-ring">
            <MenuIcon />
          </button>
        </div>
        <nav className="flex space-x-1 mt-4 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.view)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth whitespace-nowrap ${
                item.active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

const MenuIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export default Sidebar
