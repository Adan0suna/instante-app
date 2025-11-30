"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "./ui/scroll-area"
import { Slider } from "./ui/slider"
import { Button } from "./ui/button"
import { Play, Pause, Square } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Input } from "./ui/input"

interface TimelineProps {
  duration: number
  currentTime: number
  highlights: Array<{
    id: number
    start_time: number
    end_time: number
    color: string
    label?: string
  }>
  onSeek: (time: number) => void
  isRecording: boolean
  isPaused: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onTogglePause: () => void
  onAddClip?: (start: number, end: number, label: string) => void
}

export function Timeline({ duration, currentTime, highlights, onSeek, isRecording, isPaused, onStartRecording, onStopRecording, onTogglePause, onAddClip }: TimelineProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selectStart, setSelectStart] = useState<number | null>(null)
  const [selectEnd, setSelectEnd] = useState<number | null>(null)
  const [showLabelDialog, setShowLabelDialog] = useState(false)
  const [label, setLabel] = useState("")
  const timelineRef = useRef<HTMLDivElement>(null)

  const getTimeFromPosition = (clientX: number) => {
    if (!timelineRef.current) return 0
    const rect = timelineRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return (x / rect.width) * duration
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isRecording) return
    setSelecting(true)
    const t = getTimeFromPosition(e.clientX)
    setSelectStart(t)
    setSelectEnd(t)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selecting) return
    const t = getTimeFromPosition(e.clientX)
    setSelectEnd(t)
  }

  const handleMouseUp = () => {
    if (selecting && selectStart !== null && selectEnd !== null && Math.abs(selectEnd - selectStart) > 2) {
      setShowLabelDialog(true)
    }
    setSelecting(false)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selecting) return
    const t = getTimeFromPosition(e.clientX)
    onSeek(t)
  }

  const handleSaveClip = () => {
    if (onAddClip && selectStart !== null && selectEnd !== null && label.trim()) {
      const start = Math.min(selectStart, selectEnd)
      const end = Math.max(selectStart, selectEnd)
      onAddClip(start, end, label)
    }
    setShowLabelDialog(false)
    setLabel("")
    setSelectStart(null)
    setSelectEnd(null)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (selecting) handleMouseUp()
    }
    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp)
  }, [])

  return (
    <div className="relative h-14 flex flex-col items-center">
      <div
        ref={timelineRef}
        className="absolute inset-0 bg-[#000000]/5 rounded-full cursor-pointer h-4 top-2"
        onClick={handleTimelineClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{ userSelect: 'none' }}
      >
        <div
          className="absolute h-full bg-[#1A3C34] rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        {highlights.map((hl) => (
          <div
            key={hl.id}
            className="absolute top-0 h-full rounded-full opacity-80"
            style={{
              left: `${(hl.start_time / duration) * 100}%`,
              width: `${((hl.end_time - hl.start_time) / duration) * 100}%`,
              backgroundColor: hl.color,
              minWidth: 3,
              cursor: 'pointer',
            }}
            title={hl.label || ''}
          />
        ))}
        {selecting && selectStart !== null && selectEnd !== null && (
          <div
            className="absolute top-0 h-full bg-yellow-400/60 rounded-full pointer-events-none"
            style={{
              left: `${(Math.min(selectStart, selectEnd) / duration) * 100}%`,
              width: `${(Math.abs(selectEnd - selectStart) / duration) * 100}%`,
              minWidth: 3,
            }}
          />
        )}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#1A3C34] rounded-full -translate-x-1/2"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      <div className="flex justify-between w-full px-2 mt-6 text-xs text-[#1A3C34] font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Clip</DialogTitle>
            <DialogDescription>
              Agrega una etiqueta para identificar este clip
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Etiqueta para el clip</label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej: Gol, Tarjeta..." />
            <Button onClick={handleSaveClip} disabled={!label.trim()}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 