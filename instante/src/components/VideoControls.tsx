"use client"

import { useEffect, useState } from "react"
import { Button } from "../components/ui/button"
import { Pause, Play, Square, Video } from "lucide-react"

interface VideoControlsProps {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onTimeUpdate: (time: number) => void
}

export function VideoControls({ isRecording, onStartRecording, onStopRecording, onTimeUpdate }: VideoControlsProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev + 1
          return newTime
        })
        // Mover onTimeUpdate fuera del setState
        onTimeUpdate(timer + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isPaused, onTimeUpdate, timer])

  const handleTogglePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    setTimer(0)
    setIsPaused(false)
    onTimeUpdate(0)
    onStopRecording()
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-[#000000]/10 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            className="bg-white text-[#000000] border border-[#000000]/20 hover:bg-[#1A3C34] hover:text-white"
            onClick={onStartRecording}
          >
            <Video className="mr-2 h-4 w-4" />
            Grabar
          </Button>
        ) : (
          <>
            <Button variant="outline" className="border-[#000000]/20" onClick={handleTogglePause}>
              {isPaused ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Continuar
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </>
              )}
            </Button>
            <Button className="bg-[#FF0000] text-white hover:bg-[#FF0000]/80" onClick={handleStop}>
              <Square className="mr-2 h-4 w-4" />
              Detener
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Botón de "Guardar fragmento" eliminado - no funcional */}
      </div>
    </div>
  )
} 