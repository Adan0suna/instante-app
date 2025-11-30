import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, X, Clock, MapPin, Copy, Maximize2, ExternalLink, Download } from 'lucide-react';
import type { ClipWithDetails } from '../lib/supabase/types';

interface ClipVideoPlayerProps {
  clip: ClipWithDetails;
  onClose: () => void;
}

export function ClipVideoPlayer({ clip, onClose }: ClipVideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyTimeInfo = () => {
    const timeInfo = `Tiempo: ${formatTime(clip.start_time)} - ${formatTime(clip.end_time)} (Duración: ${formatTime(clip.end_time - clip.start_time)})`;
    navigator.clipboard.writeText(timeInfo);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    if (clip.clip_url) {
      window.open(clip.clip_url, '_blank');
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const getClipVideoUrl = () => {
    // Si el clip_url es una ruta relativa del backend, construir la URL completa
    if (clip.clip_url && clip.clip_url.startsWith('/recortes/file/')) {
      return `http://localhost:3001${clip.clip_url}`;
    }
    // Si es una URL completa, usarla tal como está
    return clip.clip_url || '';
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const handleDownload = () => {
    const videoUrl = getClipVideoUrl();
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `clip_${clip.description.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          {clip.description}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del clip */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Tiempo:</span>
                <span>{formatTime(clip.start_time)} - {formatTime(clip.end_time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Duración:</span>
                <span>{formatTime(clip.end_time - clip.start_time)}</span>
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium">Descripción:</span>
              <p className="mt-1 text-muted-foreground">{clip.description}</p>
            </div>
          </div>
        </div>

        {/* Reproductor de video */}
        <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-black">
          {clip.clip_url ? (
            // Si hay clip procesado, mostrar el reproductor de video
            <>
              <video
                ref={videoRef}
                src={getClipVideoUrl()}
                className="w-full h-full"
                controls={false}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              
              {/* Controles personalizados */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handlePlayPause}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <div className="flex-1 text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div className="relative h-2 bg-white/20 rounded-full">
                  <div 
                    className="absolute h-full bg-blue-500 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </>
          ) : (
            // Si no hay clip separado, mostrar mensaje
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Clip no procesado aún</p>
                <p className="text-sm opacity-75">Este clip aún no ha sido procesado por FFmpeg</p>
              </div>
            </div>
          )}
        </div>

        {/* Controles adicionales */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            onClick={copyTimeInfo}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar tiempo
          </Button>
          <div className="flex items-center gap-2">
            {clip.clip_url && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openInNewTab}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir en Drive
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        {clip.clip_url && (
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-green-600 dark:text-green-400 mt-0.5">
                <Play className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  🎬 Clip procesado por FFmpeg - Reproduciendo directamente
                </p>
                <ul className="mt-1 text-green-800 dark:text-green-200 space-y-1">
                  <li>• El clip se está reproduciendo directamente desde el servidor</li>
                  <li>• Usa los controles personalizados para reproducir/pausar</li>
                  <li>• Puedes descargar el clip o abrirlo en Google Drive</li>
                  <li>• El video se procesó con FFmpeg para optimizar el tamaño</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 