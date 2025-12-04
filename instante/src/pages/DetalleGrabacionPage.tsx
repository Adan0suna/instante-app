"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { ArrowLeft, Calendar, List, Play, Star, Trash2, Video, Scissors, Youtube, Pause, Upload, Wand2, Eye, Download, MessageCircle } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useMatch } from '../hooks/useMatch'
import type { MatchWithDetails, ClipWithDetails, UserAlias } from '../lib/supabase/types'
import { VideoPlayer } from '../components/VideoPlayer'
import { VideoStatus } from '../components/VideoStatus'
import { QueueInlinePlayer } from "../components/QueueInlinePlayer";
import { SeparateQueuePlayer } from "../components/SeparateQueuePlayer";

import { ClipVideoPlayer } from "../components/ClipVideoPlayer";
import { ClipTimeSelector } from "../components/ClipTimeSelector";
import { ClipQueuePlayer } from "../components/ClipQueuePlayer";
import { TempVideoUploader } from "../components/TempVideoUploader";
import { YouTubeUploader } from "../components/YouTubeUploader";
import { VideoEditor } from "../components/VideoEditor";
import { WhatsAppShare } from "../components/WhatsAppShare";
import { useClips } from "../hooks/useClips";
import { useTempVideo } from "../hooks/useTempVideo";
import { useUploadQueue } from "../hooks/useUploadQueue";
import { getBackendUrl, isBackendUrl } from '../lib/config';


export default function DetalleGrabacionPage() {
  const [match, setMatch] = useState<MatchWithDetails | null>(null)
  const [localLoading, setLocalLoading] = useState(true)
  const [videoStatus, setVideoStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [videoError, setVideoError] = useState<string | null>(null)
  const [queuePlaying, setQueuePlaying] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [selectedClip, setSelectedClip] = useState<ClipWithDetails | null>(null);
  const [showAllClips, setShowAllClips] = useState(false);
  const [showClipCreator, setShowClipCreator] = useState(false);
  const [showClipQueue, setShowClipQueue] = useState(false);
  const [showTempVideoUploader, setShowTempVideoUploader] = useState(false);
  const [showYouTubeUploader, setShowYouTubeUploader] = useState(false);
  const [youtubeUploaderVideo, setYoutubeUploaderVideo] = useState<File | null>(null);
  const [youtubeUploaderTitle, setYoutubeUploaderTitle] = useState<string>('');
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [editingClip, setEditingClip] = useState<ClipWithDetails | null>(null);
  const [currentTempVideoId, setCurrentTempVideoId] = useState<string | null>(null);
  const [aliases, setAliases] = useState<UserAlias[]>([]);
  const [selectedAliasId, setSelectedAliasId] = useState<number | null>(null);
  const [editedVideos, setEditedVideos] = useState<any[]>([]);
  const [loadingEditedVideos, setLoadingEditedVideos] = useState(false);
  const [showWhatsAppShare, setShowWhatsAppShare] = useState(false);
  const [whatsappShareVideoUrl, setWhatsAppShareVideoUrl] = useState<string>('');
  const [whatsappShareTitle, setWhatsAppShareTitle] = useState<string>('');
  const { error, getMatchDetails, getAliases, deleteMatch } = useMatch()
  const { clips: localClips, createClip, getClipsForMatch } = useClips()
  const { getTempVideoUrl } = useTempVideo()
  const { pendingUploads, isProcessing, processQueue, retryFailedUploads } = useUploadQueue()

  const navigate = useNavigate()
  const { id } = useParams()

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
      }
    }
    loadAliases()
  }, [getAliases])

  useEffect(() => {
    async function fetchMatch() {
      if (!id) {
        console.log('No hay ID en los parámetros')
        setLocalLoading(false)
        return
      }
      console.log('Intentando obtener partido con ID:', id)
      setLocalLoading(true)
      try {
        const matchData = await getMatchDetails(parseInt(id as string))
        setMatch(matchData)
        console.log('📊 Datos del partido obtenidos:', {
          id: matchData.id,
          title: matchData.title,
          videosCount: matchData.videos.length,
          clipsCount: matchData.clips.length,
          videos: matchData.videos,
          clips: matchData.clips
        })

        // Verificar si hay un video temporal para este partido
        try {
          const stored = localStorage.getItem(`tempVideo_${matchData.id}`);
          if (stored) {
            const tempVideoInfo = JSON.parse(stored);
            console.log('🎬 Video temporal encontrado:', tempVideoInfo);
            setCurrentTempVideoId(tempVideoInfo.tempVideoId);
          }
        } catch (err) {
          console.error('❌ Error obteniendo video temporal:', err);
        }

        // Configurar el estado del video
        const hasTempVideo = localStorage.getItem(`tempVideo_${matchData.id}`) !== null;
        if (matchData.videos.length > 0 || hasTempVideo) {
          console.log('🎥 Videos encontrados:', matchData.videos.length, 'temporales:', hasTempVideo ? 1 : 0)
          setVideoStatus('loading')
        } else {
          console.log('⚠️ No se encontraron videos para este partido')
        }

        // Cargar clips locales para este partido
        try {
          console.log('🎬 Cargando clips locales para el partido:', matchData.id);
          const clipsResult = await getClipsForMatch(matchData.id);
          console.log('🎬 Resultado de getClipsForMatch:', clipsResult);
          console.log('🎬 Estado de localClips después de cargar:', localClips);
        } catch (err) {
          console.error('❌ Error cargando clips locales:', err);
        }
      } catch (error) {
        console.error('Error al cargar el partido:', error)
      } finally {
        setLocalLoading(false)
      }
    }

    fetchMatch()
  }, [id, getMatchDetails])

  // Monitorear cambios en localClips
  useEffect(() => {
    // Debug logs removed for cleaner code
  }, [localClips]);

  // Cargar videos editados
  useEffect(() => {
    async function loadEditedVideos() {
      try {
        setLoadingEditedVideos(true);
        const response = await fetch(getBackendUrl('/recortes/edited'));
        if (response.ok) {
          const videos = await response.json();
          setEditedVideos(videos);
        }
      } catch (error) {
        console.error('Error cargando videos editados:', error);
      } finally {
        setLoadingEditedVideos(false);
      }
    }
    loadEditedVideos();
  }, [showVideoEditor]);

  // Monitorear cambios en queuePlaying
  useEffect(() => {
    // Debug logs removed for cleaner code
  }, [queuePlaying, queueIndex, match]);



  // Asegurarse de que no se renderice nada hasta que los datos estén listos
  if (localLoading || !match) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/partidos")}
          >
            Volver
          </Button>
        </div>
      </div>
    )
  }





  function handleCreateClip(startTime: number, endTime: number, description: string) {
    if (!match) {
      alert('No hay partido disponible');
      return;
    }

    if (!selectedAliasId) {
      alert('Por favor, selecciona un alias antes de crear clips');
      return;
    }

    // Usar video temporal si está disponible, sino usar video de Drive
    let videoPath = '';
    let tempVideoId: string | undefined = undefined;

    if (currentTempVideoId) {
      videoPath = getTempVideoUrl(currentTempVideoId);
      tempVideoId = currentTempVideoId;
    } else if (match.videos.length > 0) {
      videoPath = match.videos[0].video_url;
    } else {
      alert('No hay video disponible para crear clips. Sube un video temporal primero.');
      return;
    }

    createClip(videoPath, startTime, endTime, description, match.id, selectedAliasId, tempVideoId)
      .then(async () => {
        setShowClipCreator(false);
        alert('Clip creado exitosamente');

        // Refrescar los datos del partido para obtener los clips actualizados
        try {
          const updatedMatch = await getMatchDetails(match.id);
          setMatch(updatedMatch);
          console.log('✅ Datos del partido actualizados:', updatedMatch);
        } catch (error) {
          console.error('❌ Error actualizando datos del partido:', error);
        }
      })
      .catch((error) => {
        console.error('Error creando clip:', error);
        alert('Error creando el clip: ' + error.message);
      });
  }

  function handleTempVideoUploaded(tempVideoId: string) {
    setCurrentTempVideoId(tempVideoId);
    setShowTempVideoUploader(false);
    alert('Video temporal subido exitosamente. Ahora puedes crear clips.');
  }

  // Función para descargar video
  async function handleDownloadVideo(videoUrl: string, filename: string) {
    try {
      const fullUrl = videoUrl.startsWith('http')
        ? videoUrl
        : getBackendUrl(videoUrl);

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Error descargando el video');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando video:', error);
      alert('Error al descargar el video: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  // Función para preparar video para subir a YouTube
  async function handleUploadToYouTube(videoUrl: string, filename: string) {
    try {
      const fullUrl = videoUrl.startsWith('http')
        ? videoUrl
        : getBackendUrl(videoUrl);

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Error obteniendo el video');

      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'video/mp4' });

      setYoutubeUploaderVideo(file);
      setYoutubeUploaderTitle(filename.replace('.mp4', '').replace(/_/g, ' '));
      setShowYouTubeUploader(true);
    } catch (error) {
      console.error('Error preparando video para YouTube:', error);
      alert('Error al preparar el video para YouTube: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  async function handleDeleteMatch() {
    if (!match) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el partido "${match.title}"? Esta acción no se puede deshacer y eliminará todos los clips y videos asociados.`
    );

    if (confirmDelete) {
      try {
        await deleteMatch(match.id);
        alert('Partido eliminado exitosamente');
        navigate('/partidos');
      } catch (error) {
        console.error('Error al eliminar el partido:', error);
        alert('Error al eliminar el partido. Por favor, inténtalo de nuevo.');
      }
    }
  }

  function handlePlayLocalClips() {
    console.log('🎬 handlePlayLocalClips llamado');
    console.log('🎬 localClips:', localClips);
    console.log('🎬 localClips.length:', localClips.length);

    if (localClips.length > 0) {
      console.log('🎬 Activando reproductor en cola con clips:', localClips);
      setShowClipQueue(true);
      console.log('🎬 showClipQueue establecido en true');
    } else {
      console.log('🎬 No hay clips locales, mostrando alerta');
      alert('No hay clips locales para reproducir');
    }
  }

  function getClipThumbnailUrl(videoUrl: string, startTime: number) {
    // Si es un video temporal, no podemos generar thumbnail, así que retornamos null
    if (isBackendUrl(videoUrl)) {
      return null;
    }

    // Para videos de Google Drive
    const match = videoUrl.match(/\/d\/([^/]+)/);
    if (!match) return null;
    const fileId = match[1];
    // Usar thumbnail estándar de Google Drive (el parámetro t no funciona como esperábamos)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }

  return (
    <div className="flex-1">
      <div className="flex-1">
        <VideoStatus
          status={videoStatus}
          error={videoError || undefined}
          onRetry={() => {
            setVideoStatus('loading')
            setVideoError(null)
          }}
          onOpenInDrive={() => {
            if (match && match.videos.length > 0 && match.videos[0]?.video_url) {
              const fileId = match.videos[0].video_url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
              if (fileId) {
                window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank')
              }
            }
          }}
        />
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{match.title}</h1>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalles del partido</CardTitle>
                <CardDescription>
                  Información y controles del partido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => navigate("/partidos")}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTempVideoUploader(true)}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Subir Video Temporal
                    </Button>
                    {/* Botón para forzar subida si hay videos pendientes */}
                    {(() => {
                      const pendingUpload = pendingUploads.find(upload => upload.matchId === match.id);
                      if (pendingUpload) {
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => processQueue()}
                            disabled={isProcessing}
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          >
                            {isProcessing ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Forzar Subida
                              </>
                            )}
                          </Button>
                        );
                      }
                      return null;
                    })()}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClipCreator(true)}
                      disabled={!match || (!match.videos.length && !currentTempVideoId)}
                    >
                      <Scissors className="mr-2 h-4 w-4" />
                      Crear Clip
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowYouTubeUploader(true)}
                      disabled={!match || (!match.videos.length && !currentTempVideoId)}
                    >
                      <Youtube className="mr-2 h-4 w-4" />
                      Subir a YouTube
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (match.clips.length > 0) {
                          setQueuePlaying(true);
                          setQueueIndex(0);
                        } else {
                          alert('No hay clips para reproducir');
                        }
                      }}
                      disabled={match.clips.length === 0}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Reproducir Clips ({match.clips.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (match.clips.length > 0) {
                          setShowClipQueue(true);
                        } else {
                          alert('No hay clips para procesar');
                        }
                      }}
                      disabled={match.clips.length === 0}
                    >
                      <Scissors className="mr-2 h-4 w-4" />
                      Generar Video Completo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('🔍 Debug completo del partido:', match)
                        alert(`Debug info:\nVideos: ${match?.videos?.length || 0}\nClips: ${match?.clips?.length || 0}\n\nRevisa la consola para más detalles.`)
                      }}
                    >
                      Debug
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteMatch}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Fecha:</span>
                        <span className="text-sm">{match.date}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Videos:</span>
                        <span className="text-sm">{match.videos.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Clips:</span>
                        <span className="text-sm">{match.clips.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reproductor de video principal */}
            {match && (match.videos.length > 0 || currentTempVideoId) ? (
              <Card>
                <CardHeader>
                  <CardTitle>Video del partido</CardTitle>
                  <CardDescription>
                    {currentTempVideoId
                      ? 'Video temporal del partido'
                      : `Video principal del partido - ${match.videos[0]?.video_type || 'Video principal'}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Información de depuración */}
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Información del video:</h4>
                      <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                        {currentTempVideoId ? (
                          <>
                            <p><strong>Tipo:</strong> Video temporal local</p>
                            <p><strong>ID:</strong> {currentTempVideoId}</p>
                            <p><strong>URL:</strong> {getTempVideoUrl(currentTempVideoId)}</p>
                          </>
                        ) : (
                          <>
                            <p><strong>URL:</strong> {match.videos[0]?.video_url || 'No disponible'}</p>
                            <p><strong>Tipo:</strong> {match.videos[0]?.video_type || 'No especificado'}</p>
                            <p><strong>ID:</strong> {match.videos[0]?.id}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Estado de subida */}
                    {(() => {
                      const pendingUpload = pendingUploads.find(upload => upload.matchId === match.id);
                      if (pendingUpload) {
                        return (
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Estado de subida:</h4>
                            <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                              <p><strong>Estado:</strong> {pendingUpload.status === 'pending' ? 'En cola' : pendingUpload.status}</p>
                              <p><strong>Progreso:</strong> {pendingUpload.progress}%</p>
                              <p><strong>Reintentos:</strong> {pendingUpload.retryCount} / {pendingUpload.maxRetries}</p>
                              {isProcessing && (
                                <p className="text-blue-600 dark:text-blue-400"><strong>Procesando:</strong> Subiendo automáticamente...</p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Reproductor de video */}
                    <div className="flex justify-center">
                      {(() => {
                        const videoUrl = currentTempVideoId
                          ? getTempVideoUrl(currentTempVideoId)
                          : (match.videos[0]?.video_url || '');



                        return (
                          <VideoPlayer
                            videoUrl={videoUrl}
                            title={currentTempVideoId
                              ? 'Video temporal del partido'
                              : (match.videos[0]?.video_type || 'Video del partido')
                            }
                            onStatusChange={setVideoStatus}
                            onError={setVideoError}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Video del partido</CardTitle>
                  <CardDescription>
                    No hay videos subidos para este partido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay videos disponibles para este partido</p>
                    <p className="text-sm mt-2">Sube un video desde la página de subida de videos</p>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>Debug info:</strong> match.videos.length = {match?.videos?.length || 0}, tempVideoId = {currentTempVideoId || 'null'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clips como videos del partido */}
            {match && match.clips.length > 0 ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Momentos destacados del partido</CardTitle>
                  <CardDescription>
                    Clips y momentos importantes extraídos del video principal
                  </CardDescription>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAllClips(true)}>
                      <List className="h-4 w-4 mr-1" />
                      Navegador
                    </Button>

                  </div>
                </CardHeader>
                <CardContent>
                  {/* Información de depuración */}
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Información de clips:</h4>
                    <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <p><strong>Total de clips:</strong> {match.clips.length}</p>
                      <p><strong>Clips con URL:</strong> {match.clips.filter(c => c.clip_url).length}</p>
                      <p><strong>Clips sin URL:</strong> {match.clips.filter(c => !c.clip_url).length}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {match.clips.map((clip, idx) => {
                      const isSelected = queuePlaying && queueIndex === idx;

                      return (
                        <div
                          key={clip.id}
                          className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 ${isSelected ? 'ring-4 ring-green-600 bg-green-50' : 'hover:shadow-lg'
                            }`}
                          onClick={() => setSelectedClip(clip)} // <-- aqui modificacion para repro individual
                        >
                          {/* Indicador de selección MUY visible */}
                          {isSelected && (
                            <div className="absolute top-0 left-0 w-full bg-green-700 text-white text-center py-1 z-10">
                              <span className="font-bold text-sm">▶ CLIP ACTIVO {idx + 1} ▶</span>
                            </div>
                          )}
                          {(() => {
                            // Usar video temporal si está disponible, sino usar video de Drive
                            const videoUrl = currentTempVideoId
                              ? getTempVideoUrl(currentTempVideoId)
                              : (match.videos[0]?.video_url || '');

                            const thumbnailUrl = videoUrl ? getClipThumbnailUrl(videoUrl, parseInterval(clip.start_time)) : null;
                            return (
                              <>
                                {thumbnailUrl && (
                                  <img
                                    src={thumbnailUrl}
                                    alt={clip.description}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${thumbnailUrl ? 'hidden' : ''}`}>
                                  <div className="text-center">
                                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">{clip.description}</p>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center text-white">
                              <p className="text-sm font-medium">{clip.description}</p>
                              <span className="text-xs">{formatTime(parseInterval(clip.start_time))} - {formatTime(parseInterval(clip.end_time))}</span>
                              {clip.clip_url && (
                                <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                    ✅ Clip separado
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingClip(clip);
                                      setShowVideoEditor(true);
                                    }}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Wand2 className="h-3 w-3 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const clipFileName = clip.clip_url.split('/').pop() || `clip_${clip.id}.mp4`;
                                      handleDownloadVideo(clip.clip_url, clipFileName);
                                    }}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Descargar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const clipFileName = clip.clip_url.split('/').pop() || `clip_${clip.id}.mp4`;
                                      const clipTitle = clip.description || `Clip ${clip.id}`;
                                      handleUploadToYouTube(clip.clip_url, clipFileName);
                                    }}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Youtube className="h-3 w-3 mr-1" />
                                    YouTube
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const clipUrl = clip.clip_url.startsWith('http')
                                        ? clip.clip_url
                                        : getBackendUrl(clip.clip_url);
                                      setWhatsAppShareVideoUrl(clipUrl);
                                      setWhatsAppShareTitle(clip.description || `Clip del partido`);
                                      setShowWhatsAppShare(true);
                                    }}
                                    className="h-6 px-2 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    WhatsApp
                                  </Button>
                                </div>
                              )}


                            </div>
                          </div>
                          {queuePlaying && queueIndex === idx && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <Play className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Momentos destacados del partido</CardTitle>
                  <CardDescription>
                    No hay clips creados para este partido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay clips disponibles para este partido</p>
                    <p className="text-sm mt-2">Los clips se crean automáticamente cuando procesas el video</p>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>Debug info:</strong> match.clips.length = {match?.clips?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Videos Editados */}
            <Card className="mt-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-purple-600" />
                    Videos Editados
                  </CardTitle>
                  <CardDescription>
                    Videos con ediciones aplicadas (filtros, efectos, texto, etc.)
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loadingEditedVideos ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Cargando videos editados...</p>
                  </div>
                ) : editedVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {editedVideos.map((video) => (
                      <div
                        key={video.id}
                        className="relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg group"
                        onClick={() => {
                          const videoUrl = video.videoUrl.startsWith('http')
                            ? video.videoUrl
                            : getBackendUrl(video.videoUrl);
                          window.open(videoUrl, '_blank');
                        }}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                          <Play className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                          <div className="text-center text-white">
                            <p className="text-sm font-medium mb-1">Video Editado</p>
                            <p className="text-xs opacity-90">{video.filename}</p>
                            <p className="text-xs mt-2">Tamaño: {video.fileSize} MB</p>
                            <p className="text-xs">
                              {new Date(video.createdAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                const videoUrl = video.videoUrl.startsWith('http')
                                  ? video.videoUrl
                                  : getBackendUrl(video.videoUrl);
                                window.open(videoUrl, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadVideo(video.videoUrl, video.filename);
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUploadToYouTube(video.videoUrl, video.filename);
                              }}
                            >
                              <Youtube className="h-4 w-4 mr-2" />
                              YouTube
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                const videoUrl = video.videoUrl.startsWith('http')
                                  ? video.videoUrl
                                  : getBackendUrl(video.videoUrl);
                                setWhatsAppShareVideoUrl(videoUrl);
                                setWhatsAppShareTitle(video.filename || 'Video editado');
                                setShowWhatsAppShare(true);
                              }}
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay videos editados aún</p>
                    <p className="text-sm mt-2">Los videos editados aparecerán aquí después de aplicar ediciones</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diálogo de compartir por WhatsApp */}
            {showWhatsAppShare && (
              <WhatsAppShare
                videoUrl={whatsappShareVideoUrl}
                videoTitle={whatsappShareTitle}
                onClose={() => {
                  setShowWhatsAppShare(false);
                  setWhatsAppShareVideoUrl('');
                  setWhatsAppShareTitle('');
                }}
              />
            )}

            {/* Reproductor en cola */}
            {queuePlaying && match && match.clips.length > 0 && (
              <div className="w-full">
                {/* Indicador visual de prueba */}
                <div className="w-full p-4 border-4 border-green-500 bg-green-100 rounded-lg mb-4">
                  <p className="text-green-700 font-bold text-center">🎬 REPRODUCTOR EN COLA ACTIVO - VISIBLE</p>
                  <p className="text-green-600 text-center">
                    Clip actual: {queueIndex + 1} de {match.clips.length}
                  </p>
                  <p className="text-green-600 text-center">
                    Tipo: {match.clips[queueIndex]?.clip_url ? 'SeparateQueuePlayer' : 'QueueInlinePlayer'}
                  </p>
                </div>

                {/* Reproductor real */}
                {(() => {
                  const currentClip = match.clips[queueIndex];
                  const hasClipUrl = currentClip?.clip_url;

                  if (hasClipUrl) {
                    console.log('🎬 Datos del clip actual:', {
                      currentClip,
                      clipUrl: currentClip?.clip_url,
                      description: currentClip?.description,
                      startTime: currentClip?.start_time,
                      endTime: currentClip?.end_time
                    });
                    return (
                      <SeparateQueuePlayer
                        clips={match.clips}
                        currentIndex={queueIndex}
                        onNext={() => {
                          console.log('🚨 SeparateQueuePlayer onNext llamado - queueIndex actual:', queueIndex);
                          if (queueIndex < match.clips.length - 1) {
                            console.log('🚨 Avanzando de', queueIndex, 'a', queueIndex + 1);
                            setQueueIndex(queueIndex + 1);
                          } else {
                            console.log('🚨 Fin de la cola, cerrando reproductor');
                            setQueuePlaying(false);
                            setQueueIndex(0);
                          }
                        }}
                        onPrevious={() => {
                          console.log('🚨 SeparateQueuePlayer onPrevious llamado - queueIndex actual:', queueIndex);
                          if (queueIndex > 0) {
                            console.log('🚨 Retrocediendo de', queueIndex, 'a', queueIndex - 1);
                            setQueueIndex(queueIndex - 1);
                          }
                        }}
                        onClose={() => {
                          console.log('🚨 SeparateQueuePlayer onClose llamado');
                          setQueuePlaying(false);
                          setQueueIndex(0);
                        }}
                      />
                    );
                  } else {
                    console.log('🎬 RENDERIZANDO QueueInlinePlayer');
                    return (
                      <QueueInlinePlayer
                        clips={match.clips}
                        currentIndex={queueIndex}
                        videoUrl={currentTempVideoId
                          ? getTempVideoUrl(currentTempVideoId)
                          : (match.videos[0]?.video_url || '')
                        }
                        onNext={() => {
                          if (queueIndex < match.clips.length - 1) {
                            setQueueIndex(queueIndex + 1);
                          } else {
                            setQueuePlaying(false);
                            setQueueIndex(0);
                          }
                        }}
                        onPrevious={() => {
                          if (queueIndex > 0) {
                            setQueueIndex(queueIndex - 1);
                          }
                        }}
                        onClose={() => {
                          setQueuePlaying(false);
                          setQueueIndex(0);
                        }}
                      />
                    );
                  }
                })()}
              </div>
            )}



            {/* Reproductor de clip seleccionado */}
            {selectedClip && match && (
              <ClipVideoPlayer
                clip={selectedClip}
                onClose={() => setSelectedClip(null)}
              />
            )}



            {/* Subida de video temporal */}
            {showTempVideoUploader && match && (
              <TempVideoUploader
                matchId={match.id}
                onVideoUploaded={handleTempVideoUploaded}
                onCancel={() => setShowTempVideoUploader(false)}
              />
            )}

            {/* Creador de clips */}
            {showClipCreator && match && (
              <ClipTimeSelector
                videoUrl={
                  currentTempVideoId
                    ? getTempVideoUrl(currentTempVideoId)
                    : match.videos[0]?.video_url || ''
                }
                onClipCreate={handleCreateClip}
                onCancel={() => setShowClipCreator(false)}
              />
            )}

            {/* Reproductor de clips locales */}
            {showClipQueue && localClips.length > 0 && (
              <ClipQueuePlayer
                clips={localClips}
                onClose={() => setShowClipQueue(false)}
              />
            )}

            {/* Subida説明 (?).a YouTube */}
            {showYouTubeUploader && (
              <YouTubeUploader
                onClose={() => {
                  setShowYouTubeUploader(false);
                  setYoutubeUploaderVideo(null);
                  setYoutubeUploaderTitle('');
                }}
                videoFile={youtubeUploaderVideo || undefined}
                initialTitle={youtubeUploaderTitle || (match ? `${match.title} - Partido completo` : '')}
                initialDescription={match ? `Grabación del partido ${match.title} del ${match.date}` : ''}
              />
            )}

            {/* Editor de Video en modal */}
            <Dialog open={showVideoEditor} onOpenChange={setShowVideoEditor}>
              <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 gap-0">
                <DialogTitle className="sr-only">Editor de Video</DialogTitle>
                <DialogDescription className="sr-only">Editar clip de video</DialogDescription>
                {editingClip && editingClip.clip_url && (
                  <div className="h-full overflow-auto p-4">
                    <VideoEditor
                      videoUrl={editingClip.clip_url.startsWith('http') ? editingClip.clip_url : getBackendUrl(editingClip.clip_url)}
                      clipId={(() => {
                        // Extraer el clipId del clip_url (ej: /recortes/file/abc123 -> abc123)
                        if (editingClip.clip_url?.includes('/recortes/file/')) {
                          return editingClip.clip_url.split('/recortes/file/')[1] || editingClip.id.toString();
                        }
                        return editingClip.id.toString();
                      })()}
                      onSave={async (editedVideoUrl) => {
                        console.log('Video editado:', editedVideoUrl);
                        setShowVideoEditor(false);
                        setEditingClip(null);
                        // Refrescar lista de videos editados
                        try {
                          const response = await fetch(getBackendUrl('/recortes/edited'));
                          if (response.ok) {
                            const videos = await response.json();
                            setEditedVideos(videos);
                          }
                        } catch (error) {
                          console.error('Error refrescando videos editados:', error);
                        }
                      }}
                      onCancel={() => {
                        setShowVideoEditor(false);
                        setEditingClip(null);
                      }}
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>

          </div>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © 2025 Instante. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
}
// aqui no esta el perro error me cago en tooodo lso cagabole
function formatTime(seconds: number | string) {
  const numSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  const minutes = Math.floor(numSeconds / 60)
  const remainingSeconds = Math.floor(numSeconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function parseInterval(interval: string): number {
  // Convertir intervalo PostgreSQL (ej: "00:01:30") a segundos
  if (typeof interval === 'string') {
    const parts = interval.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  return 0;
}

