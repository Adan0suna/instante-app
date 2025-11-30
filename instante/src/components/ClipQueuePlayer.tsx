import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, SkipBack, SkipForward, X, List, Maximize2 } from 'lucide-react';

interface Clip {
  clipId: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  fileSize: string;
  clipPath: string;
  matchId: number;
}

interface ClipQueuePlayerProps {
  clips: Clip[];
  onClose: () => void;
}

export function ClipQueuePlayer({ clips, onClose }: ClipQueuePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isConcatenating, setIsConcatenating] = useState(false);
  const [concatenatedVideo, setConcatenatedVideo] = useState<{
    videoId: string;
    videoUrl: string;
    fileSize: string;
    clipsCount: number;
  } | null>(null);
  const [showConcatenatedVideo, setShowConcatenatedVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const concatenatedVideoRef = useRef<HTMLVideoElement>(null);

  const currentClip = clips[currentIndex];

  // Debug: ver la estructura de los clips
  useEffect(() => {
    console.log('🎬 ClipQueuePlayer - Clips recibidos:', clips);
    console.log('🎬 ClipQueuePlayer - Clip actual:', currentClip);
  }, [clips, currentIndex]);

  // Función para construir la URL correcta del video
  const getVideoUrl = (clip: Clip) => {
    console.log('🎬 getVideoUrl - Clip recibido:', clip);
    
    // El servidor devuelve clipPath como ruta absoluta del servidor, no como URL
    // Por eso usamos clipId directamente para construir la URL del endpoint
    const videoUrl = `http://localhost:3001/recortes/file/${clip.clipId}`;
    console.log('🎬 getVideoUrl - URL generada:', videoUrl);
    return videoUrl;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (currentIndex < clips.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, clips.length]);

  // Reproducir automáticamente el primer clip cuando se abre el reproductor
  useEffect(() => {
    if (clips.length > 0 && videoRef.current) {
      console.log('🎬 ClipQueuePlayer - Reproduciendo primer clip automáticamente');
      setIsPlaying(true);
      videoRef.current.play().catch(error => {
        console.error(' Error reproduciendo video automáticamente:', error);
      });
    }
  }, [clips.length]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePlaylistItem = (index: number) => {
    setCurrentIndex(index);
    setShowPlaylist(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const concatenateClips = async () => {
    if (clips.length === 0) return;
    
    setIsConcatenating(true);
    try {
      // Obtener el matchId del primer clip
      const matchId = clips[0].matchId;
      
      console.log('🎬 Iniciando concatenación de clips para matchId:', matchId);
      
      const response = await fetch(`http://localhost:3001/recortes/concatenate/${matchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error concatenando clips');
      }

      const result = await response.json();
      console.log('✅ Clips concatenados exitosamente:', result);
      
      setConcatenatedVideo({
        videoId: result.videoId,
        videoUrl: `http://localhost:3001${result.videoUrl}`,
        fileSize: result.fileSize,
        clipsCount: result.clipsCount
      });
      
      setShowConcatenatedVideo(true);
      
    } catch (error) {
      console.error('❌ Error concatenando clips:', error);
      alert('Error concatenando clips: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsConcatenating(false);
    }
  };

  const downloadConcatenatedVideo = () => {
    if (!concatenatedVideo) return;
    
    const link = document.createElement('a');
    link.href = concatenatedVideo.videoUrl;
    link.download = `video_completo_${concatenatedVideo.videoId}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentClip) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Reproductor de Clips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay clips disponibles para reproducir</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'w-full max-w-4xl mx-auto'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Reproduciendo Clip {currentIndex + 1} de {clips.length}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={concatenateClips}
            disabled={isConcatenating || clips.length === 0}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Concatenar todos los clips en un video completo"
          >
            {isConcatenating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                Concatenando...
              </>
            ) : (
              <>
                🎬 Crear Video Completo
              </>
            )}
          </Button>
          
          {concatenatedVideo && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConcatenatedVideo(!showConcatenatedVideo)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 transition-all duration-200 hover:scale-105"
              title="Ver/ocultar video concatenado"
            >
              {showConcatenatedVideo ? '👁️ Ocultar Video' : '👁️ Ver Video Completo'}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="transition-all duration-200 hover:scale-105"
            title="Mostrar/ocultar lista de clips"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            className="transition-all duration-200 hover:scale-105"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-600"
            title="Cerrar reproductor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del clip actual mejorada */}
        <div className="bg-gradient-to-r from-green-50 to-yellow-50 dark:from-green-950/20 dark:to-yellow-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-lg">
                {currentClip.description}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800 dark:text-blue-200">
                    <strong>Duración:</strong> {formatTime(currentClip.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-blue-800 dark:text-blue-200">
                    <strong>Tamaño:</strong> {currentClip.fileSize}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-blue-800 dark:text-blue-200">
                    <strong>Clip:</strong> {currentIndex + 1} de {clips.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="ml-4">
              <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full text-xs font-medium text-blue-800 dark:text-blue-200">
                🎬 Clip Local
              </div>
            </div>
          </div>
        </div>

        {/* Reproductor de video */}
        <div className="relative aspect-video w-full max-w-2xl mx-auto bg-black rounded-lg overflow-hidden shadow-lg group">
          {(() => {
            const videoUrl = getVideoUrl(currentClip);
            console.log('🎬 Video - URL final para src:', videoUrl);
            return (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full"
                controls={false}
                autoPlay={isPlaying}
                onLoadStart={() => console.log('🎬 Video - onLoadStart para clip:', currentClip.clipId)}
                onLoadedData={() => console.log('🎬 Video - onLoadedData para clip:', currentClip.clipId)}
                onCanPlay={() => console.log('🎬 Video - onCanPlay para clip:', currentClip.clipId)}
                onError={(e) => {
                  console.error('❌ Video - Error para clip:', currentClip.clipId, e);
                  console.error('❌ Video - Error details:', e.currentTarget.error);
                }}
                onLoad={() => console.log('🎬 Video - onLoad para clip:', currentClip.clipId)}
                onLoadedMetadata={() => console.log('🎬 Video - onLoadedMetadata para clip:', currentClip.clipId)}
              />
            );
          })()}
          
          {/* Controles personalizados mejorados */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center justify-center gap-4 mb-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clip anterior"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                size="lg"
                variant="secondary"
                onClick={handlePlayPause}
                className="bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 shadow-lg"
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={handleNext}
                disabled={currentIndex === clips.length - 1}
                className="bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Siguiente clip"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Indicador de progreso de clips */}
            <div className="flex justify-center gap-1">
              {clips.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-white' 
                      : index < currentIndex 
                        ? 'bg-white/60' 
                        : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Overlay de información */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium">
            {currentIndex + 1} / {clips.length}
          </div>
        </div>

        {/* Playlist */}
        {showPlaylist && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Lista de clips</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {clips.map((clip, index) => (
                <div
                  key={clip.clipId}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    index === currentIndex
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handlePlaylistItem(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {index + 1}. {clip.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(clip.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Concatenado */}
        {showConcatenatedVideo && concatenatedVideo && (
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-green-900 dark:text-green-100">
                🎬 Video Completo Generado
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadConcatenatedVideo}
                className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
              >
                📥 Descargar Video
              </Button>
            </div>
            
            <div className="text-sm text-green-800 dark:text-green-200 space-y-1 mb-4">
              <p><strong>Clips incluidos:</strong> {concatenatedVideo.clipsCount}</p>
              <p><strong>Tamaño del archivo:</strong> {concatenatedVideo.fileSize}</p>
              <p><strong>ID del video:</strong> {concatenatedVideo.videoId}</p>
            </div>

            <div className="relative aspect-video w-full max-w-2xl mx-auto bg-black rounded-lg overflow-hidden">
              <video
                ref={concatenatedVideoRef}
                src={concatenatedVideo.videoUrl}
                className="w-full h-full"
                controls={true}
                onLoadStart={() => console.log('🎬 Video concatenado - onLoadStart')}
                onLoadedData={() => console.log('🎬 Video concatenado - onLoadedData')}
                onCanPlay={() => console.log('🎬 Video concatenado - onCanPlay')}
                onError={(e) => {
                  console.error('❌ Video concatenado - Error:', e);
                  console.error('❌ Video concatenado - Error details:', e.currentTarget.error);
                }}
              />
            </div>
            
            <div className="mt-4 text-xs text-green-700 dark:text-green-300">
              💡 Este video contiene todos los clips concatenados en secuencia. 
              Puedes descargarlo y subirlo directamente a YouTube.
            </div>
          </div>
        )}

        {/* Controles adicionales */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} de {clips.length} clips
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <SkipBack className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === clips.length - 1}
            >
              Siguiente
              <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 