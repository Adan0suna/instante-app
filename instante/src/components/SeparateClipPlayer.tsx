import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, Download, X, Clock, MapPin } from 'lucide-react';
import type { ClipWithDetails } from '../lib/supabase/types';

interface SeparateClipPlayerProps {
  clip: ClipWithDetails;
  onClose: () => void;
}

export function SeparateClipPlayer({ clip, onClose }: SeparateClipPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (clip.clip_url) {
      const link = document.createElement('a');
      link.href = clip.clip_url;
      link.download = `${clip.description.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!clip.clip_url) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {clip.description}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Clip no disponible</p>
            <p className="text-sm">Este clip aún no ha sido procesado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          {clip.description}
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del clip */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Tiempo original:</span>
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
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <p className="mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => setError(null)}
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <video
              src={clip.clip_url}
              className="w-full h-full"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setError('Error al cargar el video')}
              title={clip.description}
            />
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>

        {/* Información adicional */}
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-green-600 dark:text-green-400 mt-0.5">
              <Play className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-green-900 dark:text-green-100">
                ✅ Clip separado disponible
              </p>
              <p className="mt-1 text-green-800 dark:text-green-200">
                Este clip es un video separado que puedes reproducir y descargar directamente.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 