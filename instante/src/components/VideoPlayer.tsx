import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Play, Download, ExternalLink, AlertTriangle, Pause, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  onStatusChange?: (status: 'loading' | 'error' | 'success') => void;
  onError?: (error: string) => void;
}

export function VideoPlayer({ videoUrl, title, className = '', onStatusChange, onError }: VideoPlayerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detectar si es una URL temporal local
  const isTempVideo = videoUrl.includes('localhost:3001') || videoUrl.includes('temp-video');
  
  // Debug logging
  console.log('[VideoPlayer] URL recibida:', videoUrl);
  console.log('[VideoPlayer] Es video temporal:', isTempVideo);
  
  // Extraer el fileId de la URL de Google Drive (solo si no es temporal)
  const getFileId = (url: string) => {
    if (isTempVideo) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const fileId = getFileId(videoUrl);

  // Generar diferentes URLs para Google Drive
  const getDriveUrls = (fileId: string) => ({
    embed: `https://drive.google.com/file/d/${fileId}/preview`,
    view: `https://drive.google.com/file/d/${fileId}/view`,
    download: `https://drive.google.com/uc?export=download&id=${fileId}`,
    thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
  });

  const urls = fileId ? getDriveUrls(fileId) : null;

  useEffect(() => {
    setError(null);
    setIsLoading(true);
    onStatusChange?.('loading');
    
    if (isTempVideo) {
      // Para videos temporales, simular carga completada
      const timer = setTimeout(() => {
        setIsLoading(false);
        onStatusChange?.('success');
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Para videos de Drive, simular carga completada
      const timer = setTimeout(() => {
        setIsLoading(false);
        onStatusChange?.('success');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [videoUrl, onStatusChange, isTempVideo]);

  const handleVideoLoad = () => {
    setIsLoading(false);
    onStatusChange?.('success');
  };

  const handleVideoError = () => {
    const errorMessage = 'Error al cargar el video';
    setError(errorMessage);
    setIsLoading(false);
    onStatusChange?.('error');
    onError?.(errorMessage);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const openInNewTab = () => {
    if (urls?.view) {
      window.open(urls.view, '_blank');
    }
  };

  const downloadVideo = () => {
    if (urls?.download) {
      window.open(urls.download, '_blank');
    }
  };

  const openInEmbed = () => {
    if (urls?.embed) {
      window.open(urls.embed, '_blank');
    }
  };

  // Si es un video temporal, usar reproductor HTML5 nativo
  if (isTempVideo) {
    console.log('[VideoPlayer] Renderizando video temporal con URL:', videoUrl);
    return (
      <>
        {/* Reproductor de video temporal */}
        <div
          className={`relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg bg-black ${className}`}
          onClick={() => setIsModalOpen(true)}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Cargando video...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <div className="text-center text-white">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p className="mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover cursor-pointer"
            controls
            preload="metadata"
            onLoadStart={() => console.log('[VideoPlayer] Video empezando a cargar')}
            onLoadedData={() => {
              console.log('[VideoPlayer] Video datos cargados');
              handleVideoLoad();
            }}
            onCanPlay={() => console.log('[VideoPlayer] Video puede reproducirse')}
            onError={(e) => {
              console.error('[VideoPlayer] Error en video:', e);
              handleVideoError();
            }}
            onPlay={() => {
              console.log('[VideoPlayer] Video empezó a reproducir');
              setIsPlaying(true);
            }}
            onPause={() => {
              console.log('[VideoPlayer] Video pausado');
              setIsPlaying(false);
            }}
          />
          
          {/* Botón de pantalla completa */}
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="bg-black/70 hover:bg-black/80 text-white"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          {title && (
            <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-md text-xs">
              {title}
            </div>
          )}
        </div>

        {/* Modal para video temporal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-5xl w-full p-0 bg-black">
            <DialogHeader>
              <DialogTitle className="sr-only">Reproductor de Video</DialogTitle>
            </DialogHeader>
            <div className="relative w-full aspect-video">
              <video
                src={videoUrl}
                className="w-full h-full"
                controls
                autoPlay
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Si no es temporal y no tiene fileId válido
  if (!fileId) {
    return (
      <Card className={`aspect-video w-80 h-44 ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>URL de video no válida</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Para videos de Google Drive, usar el sistema de miniaturas y enlaces
  return (
    <>
      {/* Miniatura principal */}
      <div
        className={`relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg cursor-pointer group bg-black ${className}`}
        onClick={() => setIsModalOpen(true)}
        title="Clic para ver opciones de reproducción"
      >
        {/* Thumbnail de vista previa */}
        <img
          src={urls?.thumbnail}
          alt={title || 'Vista previa del video'}
          className="w-full h-full object-cover"
          onError={e => { 
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* Fallback si la imagen no carga */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center hidden">
          <div className="text-center text-white">
            <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-300 font-medium">{title || 'Video del partido'}</p>
            <p className="text-gray-400 text-sm mt-2">Clic para reproducir</p>
          </div>
        </div>
        
        {/* Overlay con botón de reproducción siempre visible */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Button
            size="lg"
            className="bg-white/80 hover:bg-white text-black hover:text-black border-0 shadow-lg"
          >
            <Play className="h-8 w-8 mr-2" />
            Reproducir Video
          </Button>
        </div>
        
        {/* Controles flotantes */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={e => { e.stopPropagation(); openInNewTab(); }}
            className="bg-black/70 hover:bg-black/80 text-white"
            title="Abrir en Google Drive"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={e => { e.stopPropagation(); downloadVideo(); }}
            className="bg-black/70 hover:bg-black/80 text-white"
            title="Descargar video"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Información del video */}
        {title && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
            {title}
          </div>
        )}
      </div>

      {/* Modal expandible */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-full p-6 bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{title || 'Video del partido'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Información del video */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Información del video:</h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p><strong>Plataforma:</strong> Google Drive</p>
                <p><strong>Estado:</strong> Video disponible para reproducción</p>
                <p><strong>Acceso:</strong> Se abrirá en una nueva pestaña para evitar problemas de seguridad</p>
              </div>
            </div>

            {/* Opciones de reproducción */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={openInNewTab}
                className="w-full h-16 text-lg"
                size="lg"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Ver en Google Drive
              </Button>
              <Button
                onClick={openInEmbed}
                variant="outline"
                className="w-full h-16 text-lg"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Reproducir en nueva pestaña
              </Button>
              <Button
                onClick={downloadVideo}
                variant="outline"
                className="w-full h-16 text-lg"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Descargar video
              </Button>
            </div>

            {/* Explicación del error de CSP */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    ¿Por qué no se reproduce directamente aquí?
                  </p>
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Google Drive implementa políticas de seguridad (CSP) que impiden que los videos se muestren 
                    directamente en iframes desde otros dominios. Por eso te ofrecemos opciones para abrir el video 
                    en una nueva pestaña o descargarlo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 