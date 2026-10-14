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
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground shadow-md transition-colors hover:bg-[#355448] sm:bottom-6 sm:right-6"
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-18 right-3 z-50 flex h-[min(620px,calc(100vh-6rem))] w-[420px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:bottom-20 sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card p-4">
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Workspace assistant</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  <span className="text-[10px] text-muted-foreground">Ready to help</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-all hover:bg-secondary relative z-10"
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
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-[13px] whitespace-pre-line leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary text-foreground rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Loading Action Spinner */}
                {msg.loadingAction && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-4 py-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Executing system query...</span>
                  </div>
                )}

                {/* Show Action Result Message if failed or custom text */}
                {msg.actionResult && (
                  <div className="text-xs font-semibold p-2.5 rounded-lg border border-border bg-background text-muted-foreground pl-4">
                    {msg.actionResult}
                  </div>
                )}

                {/* Custom Lead Cards Slider */}
                {msg.leads && msg.leads.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto py-2 pl-2">
                    {msg.leads.map((lead, lIdx) => (
                      <div
                        key={lIdx}
                        className="w-64 flex-shrink-0 space-y-2.5 rounded-lg border border-border bg-background p-3.5 transition-colors hover:border-primary/30"
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-xs text-foreground truncate max-w-[80%]">
                            {lead.name}
                          </h5>
                          <span className="text-[9px] bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full font-bold uppercase truncate max-w-[40%]">
                            {lead.barangay}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{lead.businessCategory}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="truncate">
                              {lead.digitalPresence?.websiteUrl || lead.digitalPresence?.facebookUrl || 'No digital presence'}
                            </span>
                          </div>

                          {lead.contacts?.[0]?.contactValue && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{lead.contacts[0].contactValue}</span>
                            </div>
                          )}
                        </div>

                        <a
                          href={`/leads?id=${lead.id}`}
                          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-medium text-primary transition-colors hover:bg-secondary"
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
                <div className="bg-card text-muted-foreground border border-border rounded-xl rounded-bl-none px-4 py-2.5 text-sm flex items-center gap-1.5 shadow-inner">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies chips */}
          {messages.length === 1 && !isLoading && (
            <div className="p-3 bg-background/40 border-t border-border flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(reply.query)
                  }}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {reply.text}
                </button>
              ))}
            </div>
          )}

          {/* Chat Form Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-border bg-card/95 backdrop-blur-xl flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask growth assistant..."
              className="flex-1 bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-10 h-10 rounded-xl btn-primary text-foreground flex items-center justify-center cursor-pointer disabled:opacity-30 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
