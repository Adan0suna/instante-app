import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, X, Maximize2, Clock } from 'lucide-react';

interface Clip {
  id?: number;
  clipId?: string;
  description: string;
  start_time?: string | number;
  end_time?: string | number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  fileSize?: string;
  clipPath?: string;
  matchId: number;
  created_at?: string;
}

interface ClipPlayerProps {
  clip: Clip;
  onClose: () => void;
}

export function ClipPlayer({ clip, onClose }: ClipPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseInterval = (interval: string | number): number => {
    if (typeof interval === 'number') return interval;
    if (!interval || typeof interval !== 'string') return 0;
    
    // Parse PostgreSQL interval format (e.g., "00:00:30")
    const parts = interval.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  // Manejar tanto clips de Drive (start_time/end_time) como clips automáticos (startTime/endTime)
  const startTime = parseInterval(clip.startTime || clip.start_time || 0);
  const endTime = parseInterval(clip.endTime || clip.end_time || 0);
  const clipDuration = endTime - startTime;

  const getClipVideoUrl = () => {
    // Para clips locales, usar el archivo del clip generado
    if (clip.clipId) {
      const clipUrl = `https://instante-app-23g2.vercel.app/recortes/file/${clip.clipId}`;
      console.log('🎬 URL del clip generado:', clipUrl);
      return clipUrl;
    }
    // Si es un clip de Drive, usar la URL del clip
    return clip.clipPath || '';
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('🎬 Configurando video para clip:', {
      clipId: clip.clipId,
      videoUrl: getClipVideoUrl()
    });

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      console.log('📹 Video cargado, duración:', video.duration);
    };

    const handlePlay = () => {
      console.log('▶️ Video iniciado');
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('⏸️ Video pausado');
      setIsPlaying(false);
    };

    const handleError = (error: any) => {
      console.error('❌ Error en video:', error);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [clip.clipId]);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : 'w-full max-w-4xl mx-auto'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          {clip.description}
          {clip.clipId && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              LOCAL
            </span>
          )}
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
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Información del clip
            </span>
          </div>
                     <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
             <p><strong>Duración del clip:</strong> {formatTime(clipDuration)}</p>
             <p><strong>Rango original:</strong> {formatTime(startTime)} - {formatTime(endTime)}</p>
             {clip.fileSize && <p><strong>Tamaño:</strong> {clip.fileSize}</p>}
             {clip.created_at && (
               <p><strong>Creado:</strong> {new Date(clip.created_at).toLocaleString()}</p>
             )}
           </div>
        </div>

        {/* Reproductor de video */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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
        </div>

        {/* Controles adicionales */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Clip de {formatTime(startTime)} a {formatTime(endTime)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isPlaying ? 'Pausar' : 'Reproducir'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}