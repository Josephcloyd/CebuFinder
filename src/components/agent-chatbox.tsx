'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Sparkles, RefreshCw, ChevronRight, MapPin, Tag, Globe, Phone, ExternalLink } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  actionData?: {
    type: string
    params: any
  }
  leads?: any[]
  loadingAction?: boolean
  actionResult?: string
}

export function AgentChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your Cebu Digital Finder assistant. I can help you search the database, check leads distribution, and launch discovery campaigns.\n\nTry asking me:\n- *\"How many leads do we have?\"*\n- *\"List recent leads in Lahug\"*\n- *\"Search for Restaurants in Mabolo\"*",
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Track messages in ref to avoid stale closures in setTimeout/async handlers
  const messagesRef = useRef<Message[]>([])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Auto-scroll to bottom of chat when new messages appear
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  // Execute client-side actions triggered by the backend API
  const handleMessageAction = async (msgIndex: number, actionType: string, params: any) => {
    // Prevent double execution using latest state ref
    const targetMsg = messagesRef.current[msgIndex]
    if (!targetMsg || targetMsg.leads || targetMsg.actionResult || targetMsg.loadingAction) {
      return
    }

    // Set loading state for this action
    setMessages(prev => prev.map((m, idx) => 
      idx === msgIndex ? { ...m, loadingAction: true } : m
    ))

    try {
      if (actionType === 'list_leads') {
        const queryParams = new URLSearchParams()
        if (params.category) queryParams.append('category', params.category)
        if (params.barangay) queryParams.append('barangay', params.barangay)
        if (params.city) queryParams.append('city', params.city)
        if (params.limit) queryParams.append('limit', params.limit.toString())

        const res = await fetch(`/api/v1/leads?${queryParams.toString()}`)
        const data = await res.json()

        if (data.success) {
          setMessages(prev => prev.map((m, idx) => 
            idx === msgIndex ? { ...m, loadingAction: false, leads: data.leads.slice(0, 5) } : m
          ))
        } else {
          throw new Error(data.error || 'Failed to fetch leads')
        }
      } 
      else if (actionType === 'launch_campaign') {
        const res = await fetch('/api/v1/discovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: params.category,
            barangay: params.barangay,
            city: params.city,
          })
        })
        const data = await res.json()

        if (data.success) {
          setMessages(prev => prev.map((m, idx) => 
            idx === msgIndex ? { 
              ...m, 
              loadingAction: false, 
              actionResult: `✓ Campaign started! Job ID: ${data.jobId}. You will see new leads appearing in the dashboard shortly.` 
            } : m
          ))
          
          // Optionally trigger global dashboard refresh event if there is one
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('refreshDashboard'))
          }
        } else {
          throw new Error(data.error || 'Failed to launch campaign')
        }
      }
    } catch (err: any) {
      console.error(err)
      setMessages(prev => prev.map((m, idx) => 
        idx === msgIndex ? { 
          ...m, 
          loadingAction: false, 
          actionResult: `✕ Action failed: ${err.message}` 
        } : m
      ))
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userText = inputValue.trim()
    setInputValue('')
    
    // Add user message
    const updatedMessages = [...messages, { role: 'user', content: userText } as Message]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        let reply = data.message
        let actionData = undefined

        // Parse actions if any, format is [ACTION: {"type": "...", "params": {...}}]
        const actionRegex = /\[ACTION:\s*({.*?})\]/
        const match = reply.match(actionRegex)
        
        if (match && match[1]) {
          try {
            actionData = JSON.parse(match[1])
            // Remove the action tag from display content
            reply = reply.replace(actionRegex, '').trim()
          } catch (pErr) {
            console.error('Failed to parse action JSON:', pErr)
          }
        }

        const newMsgIndex = updatedMessages.length
        
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: reply,
            actionData,
          } as Message
        ])

        // Automatically trigger action if found
        if (actionData) {
          // Small delay for natural conversation flow
          setTimeout(() => {
            handleMessageAction(newMsgIndex, actionData.type, actionData.params)
          }, 600)
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `✕ Error: ${data.error || 'Failed to get response. Please check if your database dev server is running.'}`,
          } as Message
        ])
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `✕ Connection Error: ${err.message}. Please check if the local server is running.`,
        } as Message
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Predefined quick questions
  const quickReplies = [
    { text: 'How many total leads?', query: 'How many leads do we have?' },
    { text: 'List recent leads', query: 'List recent leads' },
    { text: 'Search dental in Lahug', query: 'Search for Dental Clinics in Lahug' },
    { text: 'Search food in Mabolo', query: 'Search for Restaurants in Mabolo' },
  ]

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-purple-500/25 hover:scale-105 cursor-pointer z-50 transition-all border border-purple-400/20 hover:border-purple-300/40 glow-animation hover:shadow-purple-500/35"
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-zinc-950/95 backdrop-blur-xl rounded-2xl flex flex-col shadow-2xl shadow-purple-500/5 border border-zinc-800/60 z-50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.03] to-transparent pointer-events-none" />
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/15 flex items-center justify-center text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Lead Growth Copilot</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cebu Finder AI</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg border border-zinc-800/60 bg-zinc-900/50 text-zinc-500 hover:text-white cursor-pointer transition-all hover:bg-zinc-800/50 relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] whitespace-pre-line leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-purple-500/10'
                        : 'bg-zinc-900/80 text-zinc-200 rounded-bl-sm border border-zinc-800/50'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Loading Action Spinner */}
                {msg.loadingAction && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 pl-4 py-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>Executing system query...</span>
                  </div>
                )}

                {/* Show Action Result Message if failed or custom text */}
                {msg.actionResult && (
                  <div className="text-xs font-semibold p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/80 text-zinc-400 pl-4">
                    {msg.actionResult}
                  </div>
                )}

                {/* Custom Lead Cards Slider */}
                {msg.leads && msg.leads.length > 0 && (
                  <div className="overflow-x-auto py-2 flex gap-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pl-2">
                    {msg.leads.map((lead, lIdx) => (
                      <div
                        key={lIdx}
                        className="flex-shrink-0 w-64 bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-3.5 space-y-2.5 hover:border-purple-500/20 transition-all shadow-lg hover:shadow-purple-500/5"
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-xs text-white truncate max-w-[80%]">
                            {lead.name}
                          </h5>
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase truncate max-w-[40%]">
                            {lead.barangay}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[10px] text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{lead.businessCategory}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="truncate">
                              {lead.digitalPresence?.websiteUrl || lead.digitalPresence?.facebookUrl || 'No digital presence'}
                            </span>
                          </div>

                          {lead.contacts?.[0]?.contactValue && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{lead.contacts[0].contactValue}</span>
                            </div>
                          )}
                        </div>

                        <a
                          href={`/leads?id=${lead.id}`}
                          className="flex items-center justify-between text-[10px] text-purple-400 font-bold bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 px-2.5 py-1.5 rounded-lg w-full transition-colors cursor-pointer"
                        >
                          <span>Open in CRM</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 text-zinc-400 border border-zinc-800/80 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm flex items-center gap-1.5 shadow-inner">
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies chips */}
          {messages.length === 1 && !isLoading && (
            <div className="p-3 bg-zinc-950/40 border-t border-zinc-900/60 flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(reply.query)
                  }}
                  className="text-[10px] font-semibold px-2.5 py-1 border border-zinc-850 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900 rounded-full cursor-pointer transition-all duration-150"
                >
                  {reply.text}
                </button>
              ))}
            </div>
          )}

          {/* Chat Form Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask growth assistant..."
              className="flex-1 bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-200 focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-zinc-600"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-10 h-10 rounded-xl btn-primary text-white flex items-center justify-center cursor-pointer disabled:opacity-30 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
