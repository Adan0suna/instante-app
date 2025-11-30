import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { Tag, Settings } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

interface CameraProps {
  onAddHighlight: (label: string) => void
  isRecording: boolean
  onVideoRecorded: (videoBlob: Blob) => void
}

export function Camera({ onAddHighlight, isRecording, onVideoRecorded }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([]) // Usar ref en lugar de estado
  const [error, setError] = useState<string>("")
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [showRecordedVideo, setShowRecordedVideo] = useState(false)


  // Log para verificar que el componente recibe el callback
  console.log('[DEBUG][Camera] Componente renderizado con onVideoRecorded:', !!onVideoRecorded)

  useEffect(() => {
    getAvailableCameras()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl)
      }
    }
  }, [])

  useEffect(() => {
    console.log('[DEBUG][Camera] useEffect isRecording cambió a:', isRecording)
    if (isRecording) {
      // Ocultar video grabado cuando se inicia nueva grabación
      setShowRecordedVideo(false)
      startCamera()
      // NO llamar startRecording aquí, se llamará cuando el stream esté listo
    } else {
      stopCamera()
      stopRecording()
    }
  }, [isRecording, selectedCamera])

  // Nuevo useEffect para iniciar la grabación cuando el stream esté disponible
  useEffect(() => {
    if (isRecording && stream) {
      console.log('[DEBUG][Camera] Stream disponible, iniciando grabación')
      startRecording()
    }
  }, [isRecording, stream])

  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error("Error al obtener cámaras:", err)
    }
  }

  const startCamera = async () => {
    try {
      console.log('[DEBUG][Camera] startCamera llamado')
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "environment",
          frameRate: { ideal: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }

      console.log('[DEBUG][Camera] Obteniendo getUserMedia con constraints:', constraints)
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('[DEBUG][Camera] Stream obtenido:', newStream)
      setStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        await videoRef.current.play()
        console.log('[DEBUG][Camera] Video iniciado correctamente')
      }
    } catch (err) {
      console.error('[DEBUG][Camera] Error en startCamera:', err)
      setError("No se pudo acceder a la cámara. Por favor, asegúrate de dar los permisos necesarios.")
      console.error("Error al acceder a la cámara:", err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const startRecording = () => {
    console.log('[DEBUG][Camera] startRecording llamado, stream disponible:', !!stream)
    if (!stream) {
      console.error('[DEBUG][Camera] No hay stream disponible para grabar')
      return
    }

    recordedChunksRef.current = [] // Limpiar chunks antes de grabar
    setRecordedChunks([]) // También limpiar el estado

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    })

    mediaRecorder.ondataavailable = (event) => {
      console.log('[DEBUG][Camera] ondataavailable llamado, data size:', event.data.size)
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data) // Agregar al ref inmediatamente
        setRecordedChunks(prev => {
          const newChunks = [...prev, event.data]
          console.log('[DEBUG][Camera] Chunks acumulados:', newChunks.length, 'total size:', newChunks.reduce((acc, chunk) => acc + chunk.size, 0))
          return newChunks
        })
      }
    }

    mediaRecorder.onstop = () => {
      // Cuando se detiene la grabación y todos los datos están disponibles
      console.log('[DEBUG][Camera] onstop llamado, recordedChunks length:', recordedChunksRef.current.length)
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
      console.log('[DEBUG][Camera] onVideoRecorded llamado con blob:', blob, 'size:', blob.size)
      
      // Crear URL del video grabado para mostrarlo
      const videoUrl = URL.createObjectURL(blob)
      setRecordedVideoUrl(videoUrl)
      setShowRecordedVideo(true)
      
      onVideoRecorded(blob)
      recordedChunksRef.current = [] // Limpiar después de grabar
      setRecordedChunks([])
    }

    mediaRecorder.start(1000) // Guardar datos cada segundo
    mediaRecorderRef.current = mediaRecorder
    console.log('[DEBUG][Camera] startRecording completado, mediaRecorder iniciado, estado:', mediaRecorder.state)
  }

  const stopRecording = () => {
    console.log('[DEBUG][Camera] stopRecording llamado, mediaRecorder estado:', mediaRecorderRef.current?.state)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      console.log('[DEBUG][Camera] stopRecording completado, mediaRecorder detenido')
      // Ya no generamos el blob aquí, solo esperamos el evento onstop
    } else {
      console.error('[DEBUG][Camera] No hay mediaRecorder activo para detener')
    }
  }

  const handleAddHighlight = () => {
    if (!isRecording) return

    const currentTime = videoRef.current?.currentTime || 0
    onAddHighlight(`Momento destacado - ${formatTime(currentTime)}`)
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center p-8">
          <p className="text-white mb-4">{error}</p>
          <Button
            className="bg-white text-black border border-black/20 hover:bg-[#1A3C34] hover:text-white"
            onClick={() => setError("")}
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {showRecordedVideo && recordedVideoUrl && (
        <video
          src={recordedVideoUrl}
          controls
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-10"
          onLoadStart={() => console.log('[DEBUG][Camera] Video grabado cargando...')}
          onCanPlay={() => console.log('[DEBUG][Camera] Video grabado listo para reproducir')}
        />
      )}
      {recordedVideoUrl && (
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-black/50 text-white border-white/20 hover:bg-black/70"
            onClick={() => setShowRecordedVideo(!showRecordedVideo)}
          >
            {showRecordedVideo ? 'Ver cámara' : 'Ver grabado'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-red-500/50 text-white border-red-300/20 hover:bg-red-500/70"
            onClick={() => {
              setShowRecordedVideo(false)
              if (recordedVideoUrl) {
                URL.revokeObjectURL(recordedVideoUrl)
                setRecordedVideoUrl(null)
              }
            }}
          >
            Limpiar
          </Button>
        </div>
      )}
      
      {isRecording && !showRecordedVideo && (
        <>
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="bg-[#FF0000] text-white px-2 py-1 rounded animate-pulse">
              REC
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-black/50 text-white border-white/20 hover:bg-black/70"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          {showSettings && (
            <div className="absolute top-16 right-4 bg-black/80 p-4 rounded-lg border border-white/20">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white text-sm">Cámara</label>
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger className="w-[200px] bg-black/50 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera) => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Cámara ${camera.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 right-4">
            <Button
              size="sm"
              className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80 transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={handleAddHighlight}
              title="Haz clic para marcar un momento destacado en el video"
            >
              <Tag className="h-4 w-4 mr-1" />
              Marcar momento
            </Button>
            <div className="text-xs text-white/70 mt-1 text-center">
              Haz clic para marcar
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatTime(seconds: number | string) {
  const numSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  const minutes = Math.floor(numSeconds / 60)
  const remainingSeconds = Math.floor(numSeconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
} 