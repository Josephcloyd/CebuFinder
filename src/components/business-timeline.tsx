'use client'

import { useEffect, useState } from 'react'
import { Clock, Loader2 } from 'lucide-react'

interface TimelineEvent {
  id: string
  type: string
  label: string
  icon: string
  color: string
  timestamp: string
}

const colorMap: Record<string, string> = {
  purple: 'border-primary/50 bg-primary/10',
  blue: 'border-blue-500/40 bg-blue-500/10',
  indigo: 'border-primary/40 bg-primary/10',
  emerald: 'border-emerald-500/40 bg-emerald-500/10',
  green: 'border-green-500/40 bg-green-500/10',
  amber: 'border-amber-500/40 bg-amber-500/10',
  zinc: 'border-border/60 bg-secondary',
}

const lineColorMap: Record<string, string> = {
  purple: 'bg-primary/15',
  blue: 'bg-blue-500/30',
  indigo: 'bg-primary/30',
  emerald: 'bg-emerald-500/30',
  green: 'bg-green-500/30',
  amber: 'bg-amber-500/30',
  zinc: 'bg-muted-foreground/30',
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function BusinessTimeline({ businessId }: { businessId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/v1/leads/${businessId}/timeline`)
        const data = await res.json()
        if (data.success) setEvents(data.events)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [businessId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-10 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity recorded yet</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {events.map((event, i) => (
        <div key={event.id} className="relative flex gap-4">
          {/* Vertical line */}
          {i < events.length - 1 && (
            <div className={`absolute left-[19px] top-10 w-0.5 h-full ${lineColorMap[event.color] || lineColorMap.zinc} -z-0`} />
          )}

          {/* Icon bubble */}
          <div className={`relative z-10 w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-base border ${colorMap[event.color] || colorMap.zinc}`}>
            {event.icon}
          </div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <p className="text-sm text-foreground font-semibold leading-snug">{event.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatRelative(event.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
