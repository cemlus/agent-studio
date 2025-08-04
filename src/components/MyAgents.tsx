// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import type { Agent } from "./types/index"
// import { VoiceIcon, KnowledgeIcon, EmptyStateIcon } from "./Icons"
// import axios from 'axios'

// interface MyAgentsProps {
//   onAgentSelect: (agent: Agent) => void
// }

// const MyAgents: React.FC<MyAgentsProps> = ({ onAgentSelect }) => {
// //   const [agents, setAgents] = useState<Agent[]>([])
//   const [searchTerm, setSearchTerm] = useState<string>("")
//   const [sortBy, setSortBy] = useState<"name" | "created" | "lastUsed">("created")
//   const [agents, setAgents] = useState<Agent[]>([])

//   // Mock data - in real app, this would come from an API
//   useEffect(() => {
//     axios.get('http://localhost:9000/api/v1/agent/list-agents')
//         .then((response) => {
//             setAgents(response.data.agents || [])
//         })
//         .catch(err => console.error(err))

//     // const mockAgents: Agent[] = [
//     //   {
//     //     id: "1",
//     //     displayName: "Customer Support Bot",
//     //     greetingMessage:
//     //       "Hello! I'm here to help you with any questions about our products and services. How can I assist you today?",
//     //     systemPrompt:
//     //       "You are a helpful customer support assistant for a tech company. Be friendly, professional, and solution-oriented. Always try to resolve customer issues efficiently.",
//     //     knowledgeBase: "https://company.com/kb",
//     //     selectedVoice: "sarah",
//     //     backgroundSound: "office",
//     //     createdAt: new Date("2024-01-15"),
//     //     lastUsed: new Date("2024-01-20"),
//     //     status: "ready",
//     //   },
//     //   {
//     //     id: "2",
//     //     displayName: "Sales Assistant",
//     //     greetingMessage:
//     //       "Hi there! I'm excited to help you find the perfect solution for your needs. What brings you here today?",
//     //     systemPrompt:
//     //       "You are an enthusiastic sales assistant. Help customers understand product benefits and guide them through the sales process with confidence and expertise.",
//     //     selectedVoice: "alex",
//     //     backgroundSound: "none",
//     //     createdAt: new Date("2024-01-10"),
//     //     lastUsed: new Date("2024-01-18"),
//     //     status: "ready",
//     //   },
//     //   {
//     //     id: "3",
//     //     displayName: "Technical Expert",
//     //     greetingMessage:
//     //       "Welcome! I'm here to provide technical guidance and troubleshooting support. What technical challenge can I help you solve?",
//     //     systemPrompt:
//     //       "You are a technical expert with deep knowledge of software and hardware. Provide detailed, accurate technical assistance while being patient and educational.",
//     //     knowledgeBase: "https://docs.company.com",
//     //     selectedVoice: "james",
//     //     backgroundSound: "nature",
//     //     createdAt: new Date("2024-01-05"),
//     //     status: "inactive",
//     //   },
//     // ]
//     // setAgents(mockAgents)
//   }, [])

//   console.log(agents);


//   const filteredAndSortedAgents = agents
//     .filter(
//       (agent) =>
//         agent.agent.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         agent.agent.systemPrompt.toLowerCase().includes(searchTerm.toLowerCase()),
//     )
//     .sort((a, b) => {
//       switch (sortBy) {
//         case "name":
//           return a.agent.displayName.localeCompare(b.agent.displayName)
//         case "created":
//           return b.createdAt.getTime() - a.createdAt.getTime()
//         case "lastUsed":
//           if (!a.lastUsed && !b.lastUsed) return 0
//           if (!a.lastUsed) return 1
//           if (!b.lastUsed) return -1
//           return b.lastUsed.getTime() - a.lastUsed.getTime()
//         default:
//           return 0
//       }
//     })

//   const formatDate = (date: Date): string => {
//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     })
//   }

//   const getVoiceName = (voiceId: string): string => {
//     const voices: Record<string, string> = {
//       sarah: "Sarah",
//       alex: "Alex",
//       emma: "Emma",
//       james: "James",
//     }
//     return voices[voiceId] || voiceId
//   }

//   return (
//     <div className="min-h-screen pt-20 lg:pt-0 bg-gray-50">
//       <div className="max-w-6xl mx-auto p-6">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-2xl font-semibold text-gray-900 mb-2">My Voice Agents</h1>
//           <p className="text-gray-600">Manage and talk with your AI voice agents.</p>
//         </div>

//         {/* Search and Filter */}
//         <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex-1">
//               <input
//                 type="text"
//                 placeholder="Search agents..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth"
//               />
//             </div>
//             <div className="sm:w-48">
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value as "name" | "created" | "lastUsed")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth"
//               >
//                 <option value="created">Sort by Created</option>
//                 <option value="name">Sort by Name</option>
//                 <option value="lastUsed">Sort by Last Used</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Agents Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredAndSortedAgents.map((agent) => (
//             <div
//               key={agent.agentId}
//               className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-smooth cursor-pointer fade-in group"
//               onClick={() => onAgentSelect(agent)}
//             >
//               {/* Agent Header */}
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
//                     {agent.agent.displayName}
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     <span
//                       className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
//                         agent.status === "ready" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
//                       {agent.status}
//                     </span>
//                   </div>
//                 </div>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     onAgentSelect(agent)
//                   }}
//                   className="p-2 rounded-md hover:bg-gray-100 transition-smooth focus-ring group-hover:bg-blue-50"
//                   aria-label="Talk with agent"
//                 >
//                   <VoiceIcon />
//                 </button>
//               </div>

//               {/* Agent Details */}
//               <div className="space-y-3">
//                 <div>
//                   <p className="text-sm text-gray-600 line-clamp-2">{agent.agent.greetingMessage}</p>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
//                   <div>
//                     <span className="font-medium">Voice:</span>
//                     <p>{(agent.tts.voice)}</p>
//                   </div>
//                   <div>
//                     <span className="font-medium">Created:</span>
//                     <p>{formatDate(agent.createdAt)}</p>
//                   </div>
//                 </div>

//                 {agent.lastUsed && (
//                   <div className="text-xs text-gray-500">
//                     <span className="font-medium">Last used:</span> {formatDate(agent.lastUsed)}
//                   </div>
//                 )}

//                 {agent.agent.knowledgeBase && (
//                   <div className="flex items-center text-xs text-blue-600">
//                     <KnowledgeIcon />
//                     <span className="ml-1">Knowledge base connected</span>
//                   </div>
//                 )}
//               </div>

//               {/* Action Buttons */}
//               <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     onAgentSelect(agent)
//                   }}
//                   className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-smooth focus-ring text-sm font-medium flex items-center justify-center gap-2"
//                 >
//                   <VoiceIcon />
//                   Talk Now
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     // Handle edit action
//                   }}
//                   className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-smooth focus-ring text-sm"
//                 >
//                   Edit
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//         {filteredAndSortedAgents.length === 0 && (
//           <div className="text-center py-12">
//             <div className="text-gray-400 mb-4">
//               <EmptyStateIcon />
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
//             <p className="text-gray-600">
//               {searchTerm ? "Try adjusting your search terms." : "Create your first voice agent to get started."}
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default MyAgents


"use client"

import React, { useState, useEffect } from "react"
import type { Agent } from "./types/index"
import { VoiceIcon, KnowledgeIcon, EmptyStateIcon } from "./Icons"
import axios from 'axios'
import VoiceInterface from "./VoiceInterface"

interface MyAgentsProps {
    onAgentSelect: (agent: Agent) => void
}

const MyAgents: React.FC<MyAgentsProps> = ({ onAgentSelect }) => {
    const [agents, setAgents] = useState<Agent[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [sortBy, setSortBy] = useState<"name" | "created" | "lastUsed">("created")
    // Add state to track the agent we're testing
    const [testingAgent, setTestingAgent] = useState<Agent | null>(null)


    useEffect(() => {
        axios.get("http://localhost:9000/api/v1/agent/list-agents")
            .then((response) => {
                // Expect response.data.agents as array of Agent objects
                setAgents(response.data.agents ?? [])
            })
            .catch(err => console.error("Error fetching agents", err))
    }, [])

    // Filter and sort based on nested agent fields and date strings
    const filteredAndSortedAgents = agents
        .filter(({ agent }) =>
            agent.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.systemPrompt.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.agent.displayName.localeCompare(b.agent.displayName)
                case "created": {
                    const aDate = new Date(a.createdAt).getTime()
                    const bDate = new Date(b.createdAt).getTime()
                    return bDate - aDate
                }
                case "lastUsed": {
                    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0
                    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0
                    return bTime - aTime
                }
                default:
                    return 0
            }
        })

    const formatDate = (dateStr: string | Date): string => {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    if (testingAgent) {
        return (
            <VoiceInterface
                agent={testingAgent}
                onBack={() => setTestingAgent(null)}
            />
        )
    }

    return (
        <div className="min-h-screen pt-20 lg:pt-0 bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">My Voice Agents</h1>
                    <p className="text-gray-600">Manage and talk with your AI voice agents.</p>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth"
                        />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-smooth"
                        >
                            <option value="created">Sort by Created</option>
                            <option value="name">Sort by Name</option>
                            <option value="lastUsed">Sort by Last Used</option>
                        </select>
                    </div>
                </div>

                {/* Agents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedAgents.map((a) => (
                        <div
                            key={a.agentId}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-smooth cursor-pointer group"
                            onClick={() => onAgentSelect(a)}
                        >
                            {/* Agent Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                        {a.agent.displayName}
                                    </h3>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${a.status === "ready"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {a.status}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAgentSelect(a) }}
                                    className="p-2 rounded-md hover:bg-gray-100 transition-smooth focus-ring group-hover:bg-blue-50"
                                    aria-label="Talk with agent"
                                >
                                    <VoiceIcon />
                                </button>
                            </div>

                            {/* Agent Details */}
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600 line-clamp-2">{a.agent.greetingMessage}</p>

                                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                    <div>
                                        <span className="font-medium">Voice:</span>
                                        <p>{a.tts.voice}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Created:</span>
                                        <p>{formatDate(a.createdAt)}</p>
                                    </div>
                                </div>

                                {a.lastUsed && (
                                    <div className="text-xs text-gray-500">
                                        <span className="font-medium">Last used:</span> {formatDate(a.lastUsed)}
                                    </div>
                                )}

                                {a.agent.knowledgeBase && (
                                    <div className="flex items-center text-xs text-blue-600">
                                        <KnowledgeIcon />
                                        <span className="ml-1">Knowledge base connected</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAgentSelect(a); setTestingAgent(a) }}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-smooth focus-ring text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <VoiceIcon />
                                    Talk Now
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); /* handle edit */ }}
                                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-smooth focus-ring text-sm"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredAndSortedAgents.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4"><EmptyStateIcon /></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
                        <p className="text-gray-600">
                            {searchTerm ? "Try adjusting your search terms." : "Create your first voice agent to get started."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyAgents
