"use client"

import { ScrollArea } from "./ui/scroll-area"
import { Clock } from "lucide-react"

interface Highlight {
  id: number
  time: number
  label: string
  color: string
}

interface HighlightPanelProps {
  highlights: Highlight[]
}

export function HighlightPanel({ highlights }: HighlightPanelProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="p-4 space-y-2">
        {highlights.length === 0 ? (
          <div className="text-center text-[#000000]/60 py-8">
            <p>No hay momentos destacados</p>
            <p className="text-sm">Marca momentos durante la grabación</p>
          </div>
        ) : (
          highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#000000]/10 hover:bg-[#1A3C34]/5"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: highlight.color }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{highlight.label}</p>
                <div className="flex items-center gap-1 text-xs text-[#000000]/60">
                  <Clock className="h-3 w-3" />
                  {formatTime(highlight.time)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
} 