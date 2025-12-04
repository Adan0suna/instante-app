import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, SkipBack, SkipForward, X, Clock, MapPin, Download } from 'lucide-react';
import type { ClipWithDetails } from '../lib/supabase/types';
import { getBackendUrl, isBackendUrl } from '../lib/config';

interface SeparateQueuePlayerProps {
  clips: ClipWithDetails[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export function SeparateQueuePlayer({
  clips,
  currentIndex,
  onNext,
  onPrevious,
  onClose
}: SeparateQueuePlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const currentClip = clips[currentIndex];

  // Construir URL completa del backend para clips
  const getFullClipUrl = (clipUrl: string) => {
    if (!clipUrl) return '';
    if (clipUrl.startsWith('http')) return clipUrl; // Ya es una URL completa
    return getBackendUrl(clipUrl); // Usar helper centralizado
  };

  // Debug info removed to prevent excessive re-renders



  const formatTime = (seconds: number | string) => {
    const numSeconds = typeof seconds === 'string' ? parseInterval(seconds) : seconds;
    const mins = Math.floor(numSeconds / 60);
    const secs = Math.floor(numSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseInterval = (interval: string): number => {
    // Convertir intervalo PostgreSQL (ej: "00:01:30") a segundos
    if (typeof interval === 'string') {
      const parts = interval.split(':').map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }
    return 0;
  };

  const handleDownload = () => {
    if (currentClip.clip_url) {
      const link = document.createElement('a');
      link.href = getFullClipUrl(currentClip.clip_url);
      link.download = `${currentClip.description.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!currentClip) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No hay clips disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full p-4">
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Reproduciendo en cola ({currentIndex + 1} de {clips.length})
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
          {/* Información del clip actual mejorada */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 text-lg">
                  {currentClip.description}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 dark:text-green-200">
                      <strong>Tiempo original:</strong> {formatTime(currentClip.start_time)} - {formatTime(currentClip.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 dark:text-green-200">
                      <strong>Duración:</strong> {formatTime(parseInterval(currentClip.end_time) - parseInterval(currentClip.start_time))}
                    </span>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <div className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full text-xs font-medium text-green-800 dark:text-green-200">
                  ✅ Clip Separado
                </div>
              </div>
            </div>
          </div>

          {/* Reproductor de video */}
          <div className="relative aspect-video w-full max-w-2xl mx-auto bg-black rounded-lg overflow-hidden shadow-lg">
            {!currentClip.clip_url ? (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center text-white">
                  <div className="animate-pulse mb-4">
                    <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">📹</span>
                    </div>
                  </div>
                  <p className="mb-2 font-medium">Clip no disponible</p>
                  <p className="text-sm text-gray-300">Este clip aún no ha sido procesado</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-red-900/20 to-red-800/20">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-red-600/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <p className="mb-4 font-medium">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => setError(null)}
                    className="text-white border-white hover:bg-white hover:text-black transition-colors"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : (
              <video
                src={getFullClipUrl(currentClip.clip_url)}
                className="w-full h-full"
                controls
                autoPlay
                onError={(e) => {
                  console.error('🚨 Error cargando video:', {
                    originalUrl: currentClip.clip_url,
                    fullUrl: getFullClipUrl(currentClip.clip_url),
                    error: e,
                    videoElement: e.target
                  });
                  setError(`Error al cargar el video: ${getFullClipUrl(currentClip.clip_url)}`);
                }}
                onLoadStart={() => {
                  console.log('🎬 Iniciando carga de video:', getFullClipUrl(currentClip.clip_url));
                  setError(null);
                }}
                onCanPlay={() => {
                  console.log('✅ Video listo para reproducir:', getFullClipUrl(currentClip.clip_url));
                }}
                onEnded={() => {
                  console.log('🎬 Clip terminado, avanzando al siguiente...');
                  if (currentIndex < clips.length - 1) {
                    onNext();
                  } else {
                    console.log('🎬 Último clip terminado, cerrando reproductor');
                    onClose();
                  }
                }}
                title={currentClip.description}
              />
            )}
          </div>

          {/* Controles de navegación mejorados */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clip anterior"
              >
                <SkipBack className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={!currentClip.clip_url}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Descargar clip"
              >
                <Download className="h-4 w-4 mr-1" />
                Descargar
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onNext}
                disabled={currentIndex === clips.length - 1}
                className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Siguiente clip"
              >
                Siguiente
                <SkipForward className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground font-medium">
                {currentIndex + 1} de {clips.length}
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Clip separado disponible"></div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="text-green-600 dark:text-green-400 mt-0.5">
                <Play className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  ✅ Clips separados disponibles
                </p>
                <p className="mt-1 text-green-800 dark:text-green-200">
                  Cada clip es un video separado que puedes reproducir y descargar directamente.
                </p>
                <p className="mt-2 text-green-700 dark:text-green-300 font-medium">
                  🔄 Reproducción automática: Los clips avanzan automáticamente al terminar
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 