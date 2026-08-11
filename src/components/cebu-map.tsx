'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapLead {
  id: string
  name: string
  category: string
  barangay: string
  city: string
  lat: number
  lng: number
  websiteUrl: string | null
  websiteStatus: string
  facebookUrl: string | null
  contactsCount: number
  leadScore: number
  primaryProblem: string
  recommendedOffer: string
}

interface CebuMapProps {
  leads: MapLead[]
  onSelectLead?: (lead: MapLead) => void
  height?: string
  viewMode?: 'pins' | 'heatmap'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'FULLY_FUNCTIONAL':
      return { bg: '#10b981', border: '#059669', shadow: 'rgba(16, 185, 129, 0.5)', text: 'Functional Site' }
    case 'FACEBOOK_ONLY':
    case 'OUTDATED_SITE':
      return { bg: '#f59e0b', border: '#d97706', shadow: 'rgba(245, 158, 11, 0.5)', text: 'FB Only / Outdated' }
    case 'NO_WEBSITE':
    case 'BROKEN_SITE':
    case 'PARKED_DOMAIN':
    default:
      return { bg: '#ef4444', border: '#dc2626', shadow: 'rgba(239, 68, 68, 0.5)', text: 'No Website / Broken' }
  }
}

export function CebuMap({ leads, onSelectLead, height = '100%', viewMode = 'pins' }: CebuMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersGroupRef = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<L.Layer | null>(null)
  const onSelectLeadRef = useRef(onSelectLead)
  const leadsRef = useRef<MapLead[]>([])
  const initialFitDoneRef = useRef(false)

  // Keep callback ref in sync without re-running marker effect
  useEffect(() => {
    onSelectLeadRef.current = onSelectLead
  }, [onSelectLead])

  // Initialize map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const cebuCenter: [number, number] = [10.3157, 123.8854]
    const map = L.map(mapContainerRef.current, {
      center: cebuCenter,
      zoom: 13,
      zoomControl: false,
      // Prevent scroll hijack when embedded in a scrollable page
      scrollWheelZoom: true,
    })

    // Zoom controls top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)

    mapInstanceRef.current = map
    markersGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersGroupRef.current = null
        heatLayerRef.current = null
        initialFitDoneRef.current = false
      }
    }
  }, [])

  // Heatmap rendering using canvas overlay
  const buildHeatmap = useCallback((heatLeads: MapLead[]) => {
    const map = mapInstanceRef.current
    if (!map || heatLeads.length === 0) return

    // Remove previous heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    const CanvasLayer = L.Layer.extend({
      onAdd(m: L.Map) {
        const canvas = document.createElement('canvas')
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.pointerEvents = 'none'
        canvas.style.zIndex = '500'
        m.getPanes().overlayPane!.appendChild(canvas)
        ;(this as any)._canvas = canvas
        ;(this as any)._map = m
        m.on('moveend zoomend', (this as any)._draw, this)
        ;(this as any)._draw()
      },
      onRemove(m: L.Map) {
        m.off('moveend zoomend', (this as any)._draw, this)
        const canvas = (this as any)._canvas
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas)
      },
      _draw() {
        const m: L.Map = (this as any)._map
        const canvas: HTMLCanvasElement = (this as any)._canvas
        const size = m.getSize()
        canvas.width = size.x
        canvas.height = size.y
        const topLeft = m.containerPointToLayerPoint([0, 0])
        L.DomUtil.setPosition(canvas, topLeft)

        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        heatLeads.forEach((lead) => {
          const pt = m.latLngToContainerPoint([lead.lat, lead.lng])
          const radius = Math.max(30, (lead.leadScore / 100) * 80)
          const intensity = Math.min(0.6, lead.leadScore / 100)

          const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius)
          if (lead.websiteStatus === 'FULLY_FUNCTIONAL') {
            grad.addColorStop(0, `rgba(16,185,129,${intensity})`)
            grad.addColorStop(0.5, `rgba(16,185,129,${intensity * 0.4})`)
          } else if (lead.websiteStatus === 'FACEBOOK_ONLY' || lead.websiteStatus === 'OUTDATED_SITE') {
            grad.addColorStop(0, `rgba(245,158,11,${intensity})`)
            grad.addColorStop(0.5, `rgba(245,158,11,${intensity * 0.4})`)
          } else {
            grad.addColorStop(0, `rgba(239,68,68,${intensity})`)
            grad.addColorStop(0.5, `rgba(239,68,68,${intensity * 0.4})`)
          }
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      },
    })

    const layer = new (CanvasLayer as any)()
    layer.addTo(map)
    heatLayerRef.current = layer
  }, [])

  // Update markers without touching zoom/center unless the dataset changed identity
  const buildMarkers = useCallback((newLeads: MapLead[], isNewDataset: boolean) => {
    const map = mapInstanceRef.current
    const markersGroup = markersGroupRef.current
    if (!map || !markersGroup) return

    markersGroup.clearLayers()
    if (newLeads.length === 0) return

    const bounds = L.latLngBounds([])

    newLeads.forEach((lead) => {
      const color = getStatusColor(lead.websiteStatus)

      const pinSize = lead.leadScore >= 70 ? 32 : 26
      const dotSize = lead.leadScore >= 70 ? 10 : 7

      const customIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            position: relative;
            width: ${pinSize}px;
            height: ${pinSize}px;
            background: ${color.bg};
            border: 2.5px solid ${color.border};
            border-radius: 50%;
            box-shadow: 0 0 0 4px ${color.bg}22, 0 0 18px ${color.shadow}, 0 4px 12px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          " onmouseenter="this.style.transform='scale(1.4)';this.style.zIndex='9999'"
             onmouseleave="this.style.transform='scale(1)';this.style.zIndex=''">
            <div style="width: ${dotSize}px; height: ${dotSize}px; background: rgba(255,255,255,0.9); border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [pinSize, pinSize],
        iconAnchor: [pinSize / 2, pinSize / 2],
      })

      const marker = L.marker([lead.lat, lead.lng], { icon: customIcon, zIndexOffset: lead.leadScore })

      // Tooltip on hover (quick preview without opening modal)
      marker.bindTooltip(`
        <div style="
          font-family: system-ui, sans-serif;
          background: #09090b;
          color: #fff;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #27272a;
          min-width: 180px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.8);
          pointer-events: none;
        ">
          <div style="font-size: 11px; font-weight: 800; color: ${color.bg}; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${color.text}</div>
          <div style="font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 2px;">${lead.name}</div>
          <div style="font-size: 10px; color: #71717a;">📍 ${lead.barangay}, ${lead.city}</div>
          <div style="font-size: 10px; color: #a1a1aa; margin-top: 6px; padding-top: 6px; border-top: 1px solid #27272a;">
            Score: <strong style="color: #a78bfa;">${lead.leadScore}/100</strong> &nbsp;•&nbsp; Click to view details
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -8],
        opacity: 1,
        className: 'cebu-tooltip',
      })

      // Click opens the centered modal in parent — NO map view change
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        if (onSelectLeadRef.current) {
          onSelectLeadRef.current(lead)
        }
      })

      marker.addTo(markersGroup)
      bounds.extend([lead.lat, lead.lng])
    })

    // Only fit bounds when the dataset filter changes, NOT on every render
    if (isNewDataset && !initialFitDoneRef.current) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true })
      initialFitDoneRef.current = true
    } else if (isNewDataset) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true })
    }
    // If NOT a new dataset (same filter results), keep current zoom/center intact
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Compare lead IDs to determine if this is a genuinely new dataset
    const newIds = leads.map((l) => l.id).join(',')
    const oldIds = leadsRef.current.map((l) => l.id).join(',')
    const isNewDataset = newIds !== oldIds

    leadsRef.current = leads

    if (viewMode === 'heatmap') {
      // Clear pins, show heatmap
      markersGroupRef.current?.clearLayers()
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
      buildHeatmap(leads)
      // Fit bounds once
      if (isNewDataset && leads.length > 0) {
        const bounds = L.latLngBounds(leads.map((l) => [l.lat, l.lng] as [number, number]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true })
      }
    } else {
      // Clear heatmap, show pins
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
      buildMarkers(leads, isNewDataset)
    }
  }, [leads, viewMode, buildMarkers, buildHeatmap])

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Inject tooltip styles */}
      <style>{`
        .cebu-tooltip .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip.cebu-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-container {
          background: #09090b;
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full z-0 rounded-2xl" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-zinc-950/95 backdrop-blur-xl p-4 rounded-2xl border border-zinc-800/80 shadow-2xl">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-2.5">Digital Gap Status</span>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.7)' }} />
            <span className="text-[11px] text-zinc-300 font-semibold">No Website / Broken</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" style={{ boxShadow: '0 0 8px rgba(245,158,11,0.7)' }} />
            <span className="text-[11px] text-zinc-300 font-semibold">Facebook Only / Outdated</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.7)' }} />
            <span className="text-[11px] text-zinc-300 font-semibold">Functional Website</span>
          </div>
          <div className="pt-2 border-t border-zinc-800 mt-1">
            <span className="text-[9px] text-zinc-600">Larger pin = higher opportunity score</span>
          </div>
        </div>
      </div>
    </div>
  )
}
