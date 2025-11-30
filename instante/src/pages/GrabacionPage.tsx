"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { HighlightPanel } from "../components/HighlightPanel"
import { Camera } from "../components/Camera"
import { Badge } from "../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Alert } from "../components/ui/alert"
import { Progress } from "../components/ui/progress"
import { useMatchWithQueue } from '../hooks/useMatchWithQueue'
import { UploadQueueStatus } from '../components/UploadQueueStatus'
import { ConnectionNotification } from '../components/ConnectionNotification'
import type { Match, Clip, UserAlias } from '../lib/supabase/types'
import {
  Clock,
  Tag,
  Settings,
  Video,
  Play,
  Square,
  Pause,
  AlertTriangle,
  CheckCircle,
  Upload,
  Wifi,
  WifiOff,
  Monitor,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function GrabacionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [clips, setClips] = useState<Clip[]>([])
  const [matchId, setMatchId] = useState<number | null>(null)
  const [showTitleDialog, setShowTitleDialog] = useState(false)
  const [matchTitle, setMatchTitle] = useState("")
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [localVideoCopy, setLocalVideoCopy] = useState<string | null>(null)
  const [aliases, setAliases] = useState<UserAlias[]>([])
  const [selectedAliasId, setSelectedAliasId] = useState<number | null>(null)
  const [isDriveConnected, setIsDriveConnected] = useState(false)
  const [showCameraDialog, setShowCameraDialog] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingRedirect, setPendingRedirect] = useState(false)
  const [creatingClips, setCreatingClips] = useState(false)
  const [pendingClips, setPendingClips] = useState<Array<{
    clipId: number;
    startTime: number;
    endTime: number;
    description: string;
  }>>([]);
  
  // Estados para el nuevo sistema de etiquetas (inicio/fin)
  const [clipStartTime, setClipStartTime] = useState<number | null>(null)
  const [currentClipLabel, setCurrentClipLabel] = useState<string>('')

  const { createMatch, addClip, uploadVideo, getMatchDetails, getAliases, loading: matchLoading, error: matchError, connectionStatus, pendingUploads } = useMatchWithQueue()
  const navigate = useNavigate()

  const tagButtons = ["Gol", "Falta", "Tarjeta", "Tiro libre", "Penal", "Fuera de juego"]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getRandomColor = () => {
    const colors = ["#D4AF37", "#3B82F6", "#10B981", "#8B5CF6", "#F97316"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Verificar si Google Drive está conectado
  useEffect(() => {
    const driveTokens = localStorage.getItem('googleDriveTokens')
    setIsDriveConnected(!!driveTokens)
  }, [])

  // Cargar dispositivos de cámara disponibles
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setAvailableDevices(videoDevices)
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId)
        }
      } catch (error) {
        console.error('Error al cargar dispositivos:', error)
      }
    }
    loadDevices()
  }, [])

  // Cargar alias al iniciar
  useEffect(() => {
    async function loadAliases() {
      try {
        const aliasList = await getAliases()
        setAliases(aliasList)
        if (aliasList.length > 0 && !selectedAliasId) {
          setSelectedAliasId(aliasList[0].id)
        }
      } catch (error) {
        console.error("Error al cargar los alias:", error)
        alert("Error al cargar los alias. Por favor, recarga la página.")
      }
    }
    loadAliases()
  }, [])

  // Cargar clips cuando cambia el matchId
  useEffect(() => {
    async function loadClips() {
      if (!matchId) return

      try {
        const match = await getMatchDetails(matchId)
        setClips(match.clips)
      } catch (error) {
        console.error("Error al cargar los clips:", error)
      }
    }

    loadClips()
  }, [matchId])

  // Timer para la grabación
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isPaused])

  const startRecording = async () => {
    try {
      console.log("[DEBUG] Intentando crear partido con título:", matchTitle)
      // Crear el partido en Supabase
      const match = await createMatch({
        title: matchTitle,
        date: new Date().toISOString().split('T')[0]
      })
      console.log("[DEBUG] Partido creado:", match)
      setMatchId(match.id)
      setIsRecording(true)
      setIsPaused(false)
      setCurrentTime(0)
      setShowTitleDialog(false)
    } catch (error) {
      console.error("Error al iniciar la grabación:", error)
      alert("Error al iniciar la grabación: " + (typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error)))
    }
  }

  const handleTogglePause = () => {
    setIsPaused(!isPaused)
  }

  const handleCancelClip = () => {
    setClipStartTime(null)
    setCurrentClipLabel('')
    console.log('[DEBUG] Clip cancelado')
  }

  const handleAddHighlight = async (label: string) => {
    if (!isRecording || !matchId) return

    const currentVideoTime = currentTime

    // Si no hay clip iniciado, marcar inicio
    if (clipStartTime === null) {
      setClipStartTime(currentVideoTime)
      setCurrentClipLabel(label)
      console.log(`[DEBUG] Iniciando clip: ${label} en ${currentVideoTime}s`)
      return
    }

    // Si ya hay un clip iniciado, finalizarlo con la NUEVA etiqueta como nombre
    const startTime = clipStartTime
    const endTime = currentVideoTime
    const finalLabel = label // Usar la nueva etiqueta como nombre del clip
    console.log(`[DEBUG] Finalizando clip: ${finalLabel} de ${startTime}s a ${endTime}s`)

    try {
      const clip = await addClip({
        match_id: matchId,
        alias_id: selectedAliasId || 1,
        description: finalLabel, // Usar la etiqueta final como descripción
        start_time: startTime.toString(),
        end_time: endTime.toString()
      })
      console.log('[DEBUG] Clip creado:', clip)

      // Agregar a clips pendientes para procesamiento posterior
      setPendingClips(prev => [...prev, {
        clipId: clip.id,
        startTime: startTime,
        endTime: endTime,
        description: finalLabel
      }])

      // Actualizar la lista de clips
      const match = await getMatchDetails(matchId)
      setClips(match.clips)

      // Resetear para el siguiente clip
      setClipStartTime(null)
      setCurrentClipLabel('')
    } catch (error) {
      console.error("Error al añadir highlight:", error)
      alert("Error al añadir el momento destacado: " + (typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error)))
    }
  }

  // Función para procesar un clip
  const processClip = async (clipId: number, startTime: number, endTime: number, description: string) => {
    if (localVideoCopy || recordedVideo) {
      try {
        console.log('🎬 Procesando clip con FFmpeg...');
        
        let videoBlob;
        if (localVideoCopy) {
          // Usar la copia temporal local
          const response = await fetch(localVideoCopy);
          videoBlob = await response.blob();
        } else if (recordedVideo) {
          // Usar el video grabado directamente
          videoBlob = recordedVideo;
        } else {
          throw new Error('No hay video disponible para procesar el clip');
        }
        
        const videoFile = new File([videoBlob], 'temp_video.webm', { type: 'video/webm' });
        
        // Crear FormData para enviar al backend
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('startTime', startTime.toString());
        formData.append('endTime', endTime.toString());
        formData.append('description', description);
        formData.append('matchId', matchId!.toString());
        formData.append('clipId', clipId.toString());
        
        const processResponse = await fetch('http://localhost:3001/recortes/process-clip-file', {
          method: 'POST',
          body: formData,
        });
        
        if (processResponse.ok) {
          const processResult = await processResponse.json();
          console.log('✅ Clip procesado exitosamente:', processResult);
        } else {
          console.error('❌ Error procesando clip:', await processResponse.text());
        }
      } catch (processError) {
        console.error('❌ Error procesando clip con FFmpeg:', processError);
      }
    } else {
      console.log('⚠️ No hay video local disponible para procesar el clip');
    }
  };

  const handleVideoRecorded = (videoBlob: Blob) => {
    console.log('[DEBUG] handleVideoRecorded llamado', videoBlob);
    setRecordedVideo(videoBlob)
    
    // Crear copia temporal local del video para procesamiento de clips
    const localVideoUrl = URL.createObjectURL(videoBlob);
    setLocalVideoCopy(localVideoUrl);
    console.log('[DEBUG] Copia temporal local creada:', localVideoUrl);
    
    // Procesar clips pendientes
    if (pendingClips.length > 0) {
      console.log('🎬 Procesando clips pendientes:', pendingClips.length);
      pendingClips.forEach(async (pendingClip) => {
        await processClip(pendingClip.clipId, pendingClip.startTime, pendingClip.endTime, pendingClip.description);
      });
      setPendingClips([]); // Limpiar clips pendientes
    }
  }

  // Log para verificar que el estado recordedVideo cambia
  useEffect(() => {
    console.log('[DEBUG] recordedVideo cambió a:', recordedVideo);
  }, [recordedVideo])

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => setUploadSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  useEffect(() => {
    if (creatingClips) {
      const timer = setTimeout(() => setCreatingClips(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [creatingClips]);

  // Nuevo useEffect para manejar la subida cuando recordedVideo esté disponible
  useEffect(() => {
    if (recordedVideo && recordedVideo.size > 0 && matchId && !uploading) {
      console.log('[DEBUG] recordedVideo disponible, iniciando subida...');
      handleVideoUpload();
    }
  }, [recordedVideo, matchId]);

  const handleVideoUpload = async () => {
    if (!recordedVideo || !matchId) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setCreatingClips(false);
      const file = new File([recordedVideo], 'grabacion.webm', { type: 'video/webm' });
      console.log('[DEBUG] Llamando a uploadVideo con sistema de cola...');
      
      const result = await uploadVideo(matchId, file, 'Principal', matchTitle, (progress) => {
        console.log('[DEBUG] Progreso de subida:', progress);
        setUploadProgress(progress);
      });
      
      // Verificar si el video fue agregado a la cola o subido inmediatamente
      if (result.queued) {
        console.log('📤 Video agregado a la cola de subidas:', result.message);
        setUploadSuccess(true);
        setUploadError(null);
        
        // Mostrar mensaje de que fue agregado a la cola
        setTimeout(() => {
          setUploading(false);
          setPendingRedirect(true);
        }, 2000);
      } else {
        // Subida inmediata exitosa
      setUploadSuccess(true);
      
      // Procesar clips pendientes después de subir el video
      if (pendingClips.length > 0) {
        console.log('🎬 Procesando clips pendientes después de subir video:', pendingClips.length);
        for (const pendingClip of pendingClips) {
          await processClip(pendingClip.clipId, pendingClip.startTime, pendingClip.endTime, pendingClip.description);
        }
        setPendingClips([]); // Limpiar clips pendientes
      }
      
      // Mostrar mensaje de creación de clips
      setCreatingClips(true);
      setTimeout(() => {
        setCreatingClips(false);
        setPendingRedirect(true);
      }, 3000); // Mostrar por 3 segundos
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Error al subir el video a Drive');
    } finally {
      setUploading(false);
    }
  };

  const stopRecording = async () => {
    console.log('[DEBUG] stopRecording llamado');
    if (!matchId) return

    try {
      setIsRecording(false)
      setUploading(false)
      setUploadSuccess(false)
      setUploadError(null)
      setUploadProgress(0)
      setPendingRedirect(false)

      // Log para depuración
      console.log('[DEBUG] recordedVideo:', recordedVideo)

      // Ya no subimos aquí, se hará en el useEffect cuando recordedVideo cambie
    } catch (error) {
      console.error("Error:", error)
      alert("Error al detener la grabación")
    }
  }

  const handleAddClipFromTimeline = (start: number, end: number, label: string) => {
    if (!matchId || !selectedAliasId) {
      alert('No hay partido activo o alias seleccionado. No se puede guardar el clip.')
      return
    }
    
    if (!localVideoCopy) {
      alert('No hay video local disponible para procesar el clip.')
      return
    }
    
    console.log('[DEBUG] Añadiendo clip manual desde la barra:', { start, end, label, matchId, selectedAliasId })
    
    // Crear el clip en la base de datos primero
    const newClip: Omit<Clip, 'id' | 'created_at'> = {
      match_id: matchId,
      alias_id: selectedAliasId,
      description: label,
      start_time: start.toString(),
      end_time: end.toString(),
    }
    
    addClip(newClip)
      .then(async (createdClip) => {
        console.log('[DEBUG] Clip creado en BD:', createdClip);
        
        // Procesar el clip usando la copia temporal local
        try {
          console.log('[DEBUG] Procesando clip con video local...');
          
          // Crear un FormData con el video local
          const videoBlob = await fetch(localVideoCopy).then(r => r.blob());
          const formData = new FormData();
          formData.append('video', videoBlob, 'local_video.mp4');
          formData.append('startTime', start.toString());
          formData.append('endTime', end.toString());
          formData.append('clipId', createdClip.id.toString());
          
          // Enviar al backend para procesamiento
          const response = await fetch('http://localhost:3001/recortes/process-local', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Error al procesar clip: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('[DEBUG] Clip procesado:', result);
          
          // Actualizar la lista de clips
          const match = await getMatchDetails(matchId)
          setClips(match.clips)
          alert('Clip guardado y procesado correctamente')
          
        } catch (error) {
          console.error('[DEBUG] Error al procesar clip:', error);
          alert('Clip guardado pero error al procesar el video')
        }
      })
      .catch((error: any) => {
        console.error("Error detallado al añadir el momento destacado:", error)
        alert(`Error al añadir el momento destacado: ${typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error)}`)
        console.error('[DEBUG] Error al guardar clip manual:', error)
      })
  }

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    setShowCameraDialog(false)
    // Aquí podrías pasar el deviceId al componente Camera para cambiar la cámara
  }



  // Limpiar URL temporal cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (localVideoCopy) {
        URL.revokeObjectURL(localVideoCopy);
        console.log('[DEBUG] URL temporal liberada');
      }
    };
  }, [localVideoCopy]);

  return (
    <div className="min-h-screen flex-1 bg-[#1A3C34]">
      <div className="flex-1 flex flex-col">
        {/* Header mejorado */}
        <header className="bg-[#1A3C34] border-b border-[#000000]/20 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">Grabación en vivo</h1>
              {matchTitle && (
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  {matchTitle}
                </Badge>
              )}
      </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 text-white" />
                <span className="text-white font-mono text-lg">{formatTime(currentTime)}</span>
              </div>

              {/* Estado de grabación */}
              {isRecording && (
                <Badge className="bg-[#FF0000] text-white animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  REC
              </Badge>
              )}

              {/* Estado de conexión */}
              <div className="flex items-center gap-2">
              {isDriveConnected ? (
                <Badge className="bg-green-600 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Drive conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-400">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  Sin Drive
                </Badge>
              )}

                {/* Calidad de conexión */}
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  {connectionStatus.connectionQuality === "excellent" ? (
                    <Wifi className="h-3 w-3 mr-1" />
                  ) : (
                    <WifiOff className="h-3 w-3 mr-1" />
                  )}
                  {connectionStatus.connectionQuality === "excellent" ? "Excelente" : connectionStatus.connectionQuality === "good" ? "Buena" : "Lenta"}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Alerta de Drive desconectado */}
        {!isDriveConnected && (
          <div className="m-4 border-yellow-200 bg-yellow-50 border-l-4 p-4 rounded">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-800">
                <strong>Google Drive no conectado:</strong> Los videos se guardarán solo localmente.
                <Button variant="link" className="ml-2 p-0 h-auto text-yellow-700 underline">
                  Conectar ahora
              </Button>
              </span>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 space-y-4">
          {/* Layout con grabación y cards lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Área de grabación - 2/3 del ancho */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-[#000000]/10 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative bg-black rounded-t-lg" style={{ aspectRatio: '16/9', height: '60vh' }}>
                <Camera 
                  isRecording={isRecording}
                      onAddHighlight={handleAddHighlight}
                  onVideoRecorded={handleVideoRecorded}
                />
                
                    {/* Indicador de grabación */}
                    {isRecording && (
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-2 bg-[#FF0000]/90 px-3 py-1 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span className="text-white text-sm font-medium">EN VIVO</span>
                        </div>
                      </div>
                    )}
            </div>
              </CardContent>
            </Card>

              {/* Controles principales */}
              <div className="mt-4">
                <Card className="bg-white border-[#000000]/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {!isRecording ? (
                          <Button
                            onClick={() => setShowTitleDialog(true)}
                            className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Grabar
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={handleTogglePause}
                              variant="outline"
                              className="border-[#000000]/20 bg-transparent"
                            >
                              {isPaused ? (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Continuar
                                </>
                              ) : (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pausar
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={stopRecording}
                              className="bg-[#FF0000] text-white hover:bg-[#FF0000]/80"
                            >
                              <Square className="h-4 w-4 mr-2" />
                              Detener
                            </Button>
              </div>
                        )}

                <Button
                  variant="outline"
                          className="border-[#000000]/20 bg-transparent"
                  onClick={() => setShowCameraDialog(true)}
                >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar cámara
                </Button>
                      </div>

                      <div className="text-sm text-[#000000]/60">
                        {isRecording ? (
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Grabando - {clips.length} momentos marcados
                            {clipStartTime !== null && (
                              <span className="text-[#FF6B00] font-medium ml-2">
                                • Clip activo: {currentClipLabel}
                              </span>
                            )}
                          </span>
                        ) : (
                          `${clips.length} momentos guardados`
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Panel lateral: Etiquetas y Momentos destacados */}
            <div className="lg:col-span-1 space-y-4">
              {/* Etiquetas para marcar momentos */}
              <Card className="bg-white border-[#000000]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#000000] text-lg">Marcar momentos importantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {tagButtons.map((tag) => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          className={`border-[#000000]/20 hover:bg-[#1A3C34] hover:text-white transition-colors ${
                            !isRecording ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() => handleAddHighlight(tag)}
                          disabled={!isRecording}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Botón para cancelar clip actual */}
                    {clipStartTime !== null && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50 w-full"
                          onClick={handleCancelClip}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar clip actual
                        </Button>
                      </div>
                    )}
                    
                    {!isRecording && (
                      <p className="text-xs text-[#000000]/60 text-center">Inicia la grabación para marcar momentos</p>
                    )}
                    
                    {isRecording && clipStartTime === null && (
                      <p className="text-xs text-[#000000]/60 text-center">Presiona una etiqueta para iniciar un clip</p>
                    )}
                    
                    {isRecording && clipStartTime !== null && (
                      <p className="text-xs text-[#FF6B00] text-center font-medium">
                        Clip activo: {currentClipLabel} - Presiona otra etiqueta para finalizar con ese nombre
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Momentos destacados */}
              <Card className="bg-white border-[#000000]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#000000] text-lg flex items-center">
                    <Tag className="h-5 w-5 mr-2" />
                    Momentos destacados ({clips.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HighlightPanel highlights={clips.map(clip => ({
                    id: clip.id,
                    time: parseFloat(clip.start_time),
                    label: clip.description,
                    color: getRandomColor(),
                    type: clip.description
                  }))} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Diálogo para elegir cámara */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Elegir fuente de cámara</DialogTitle>
            <DialogDescription>
              Selecciona la cámara que quieres usar para grabar el partido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Cámaras conectadas</h3>
              {availableDevices.length > 0 ? (
                <div className="space-y-2">
                  {availableDevices.map((device) => (
                    <Button
                      key={device.deviceId}
                      variant={selectedDeviceId === device.deviceId ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleDeviceChange(device.deviceId)}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      {device.label || `Cámara ${device.deviceId.slice(0, 8)}...`}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No se detectaron cámaras</p>
              )}
            </div>
            

          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para título del partido */}
      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar nueva grabación</DialogTitle>
            <DialogDescription>Ingresa el título del partido para comenzar la grabación</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título del partido</label>
              <Input
                placeholder="Ej: Real Madrid vs Barcelona"
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && matchTitle.trim() && startRecording()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTitleDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={startRecording}
                disabled={!matchTitle.trim()}
                className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80"
              >
                Iniciar grabación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overlay de subida */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Upload className="h-5 w-5" />
                {connectionStatus.connectionQuality === 'poor' || !connectionStatus.isOnline 
                  ? 'Agregando a cola de subidas' 
                  : 'Subiendo grabación'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={uploadProgress} className="w-full" />
              <div className="text-center text-sm text-[#000000]/60">{uploadProgress}% completado</div>
              <p className="text-center text-sm">
                {connectionStatus.connectionQuality === 'poor' || !connectionStatus.isOnline 
                  ? 'El video se subirá automáticamente cuando la conexión mejore' 
                  : 'Subiendo a Google Drive...'}
              </p>
              {connectionStatus.connectionQuality === 'poor' || !connectionStatus.isOnline ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm text-center">
                    ⚠️ Conexión lenta detectada. El video se guardará localmente y se subirá cuando la conexión mejore.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
      {pendingRedirect && (
        <div className="fixed top-0 left-0 w-full z-50">
          <div className="bg-black/80 text-white p-4 flex flex-col items-center">
            {uploadSuccess && (
              <div className="mb-2">
                {connectionStatus.connectionQuality === 'poor' || !connectionStatus.isOnline 
                  ? '¡Grabación guardada! Se subirá automáticamente cuando la conexión mejore.'
                  : '¡Grabación subida exitosamente a Google Drive!'}
              </div>
            )}
            {uploadError && <div className="mb-2 text-red-400">{uploadError}</div>}
            <Button className="mt-2" onClick={() => navigate(`/partidos/${matchId}`)}>
              Ir a partidos
            </Button>
          </div>
        </div>
      )}
      {/* Mensajes discretos */}
      {uploadSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Video subido exitosamente</span>
          </div>
        </div>
      )}
      {creatingClips && (
        <div className="fixed top-4 right-4 z-50 bg-blue-100 border border-blue-300 text-blue-800 px-3 py-2 rounded-lg text-sm shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Creando clips...</span>
          </div>
        </div>
      )}
      {uploadError && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded-lg text-sm shadow-lg max-w-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="truncate">{uploadError}</span>
          </div>
        </div>
      )}
      
      {/* Componente de estado de la cola de subidas */}
      {pendingUploads.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 max-w-md">
          <UploadQueueStatus />
        </div>
      )}
      
      {/* Notificaciones de conexión */}
      <ConnectionNotification />
    </div>
  )
}

function getRandomColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
  return colors[Math.floor(Math.random() * colors.length)]
} 