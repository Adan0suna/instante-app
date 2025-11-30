import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, SkipBack, SkipForward, Scissors, Clock } from 'lucide-react';

interface ClipTimeSelectorProps {
  videoUrl: string;
  onClipCreate: (startTime: number, endTime: number, description: string) => void;
  onCancel: () => void;
}

export function ClipTimeSelector({ videoUrl, onClipCreate, onCancel }: ClipTimeSelectorProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [description, setDescription] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setEndTime(Math.min(30, video.duration));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSetStartTime = () => {
    setStartTime(currentTime);
  };

  const handleSetEndTime = () => {
    setEndTime(currentTime);
  };

  const handleCreateClip = () => {
    if (startTime >= endTime) {
      alert('El tiempo de inicio debe ser menor al tiempo de fin');
      return;
    }
    if (!description.trim()) {
      alert('Por favor ingresa una descripción del clip');
      return;
    }
    onClipCreate(startTime, endTime, description);
  };

  const clipDuration = endTime - startTime;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Crear Clip
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reproductor de video */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
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
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Controles de tiempo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tiempo de inicio</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
                min="0"
                max={duration}
                step="0.1"
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSetStartTime}
              >
                <Clock className="h-4 w-4 mr-1" />
                Actual
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatTime(startTime)}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tiempo de fin</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
                min="0"
                max={duration}
                step="0.1"
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSetEndTime}
              >
                <Clock className="h-4 w-4 mr-1" />
                Actual
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatTime(endTime)}
            </div>
          </div>
        </div>

        {/* Información del clip */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Scissors className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Información del clip
            </span>
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Duración:</strong> {formatTime(clipDuration)}</p>
            <p><strong>Rango:</strong> {formatTime(startTime)} - {formatTime(endTime)}</p>
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción del clip</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Gol de Messi, Tarjeta roja, Falta importante..."
            className="w-full"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleCreateClip} disabled={!description.trim()}>
            <Scissors className="h-4 w-4 mr-2" />
            Crear Clip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 