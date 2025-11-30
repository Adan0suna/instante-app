import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, SkipBack, SkipForward, X, Clock, MapPin, Copy, Maximize2, ExternalLink, AlertTriangle } from 'lucide-react';
import type { ClipWithDetails } from '../lib/supabase/types';

interface QueueInlinePlayerProps {
  clips: ClipWithDetails[];
  currentIndex: number;
  videoUrl: string;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export function QueueInlinePlayer({ 
  clips, 
  currentIndex, 
  videoUrl, 
  onNext, 
  onPrevious, 
  onClose 
}: QueueInlinePlayerProps) {
  const currentClip = clips[currentIndex];
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extraer el fileId de la URL de Google Drive
  const getFileId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const fileId = getFileId(videoUrl);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyTimeInfo = () => {
    const timeInfo = `Tiempo: ${formatTime(currentClip.start_time)} - ${formatTime(currentClip.end_time)} (Duración: ${formatTime(currentClip.end_time - currentClip.start_time)})`;
    navigator.clipboard.writeText(timeInfo);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    if (fileId) {
      const timeUrl = `https://drive.google.com/file/d/${fileId}/view?t=${Math.floor(currentClip.start_time)}s`;
      window.open(timeUrl, '_blank');
    }
  };

  const openInEmbed = () => {
    if (fileId) {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview?t=${Math.floor(currentClip.start_time)}s`;
      window.open(embedUrl, '_blank');
    }
  };

  if (!fileId || !currentClip) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>No hay clips disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Crear URLs para diferentes opciones
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view?t=${Math.floor(currentClip.start_time)}s`;
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview?t=${Math.floor(currentClip.start_time)}s`;
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Reproduciendo en cola ({currentIndex + 1} de {clips.length})
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
        {/* Información del clip actual */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="space-y-3">
            <h4 className="font-medium">{currentClip.description}</h4>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Tiempo:</span>
                <span>{formatTime(currentClip.start_time)} - {formatTime(currentClip.end_time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Duración:</span>
                <span>{formatTime(currentClip.end_time - currentClip.start_time)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Miniatura del clip */}
        <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-black">
          <img
            src={thumbnailUrl}
            alt={`Clip: ${currentClip.description}`}
            className="w-full h-full object-cover"
            onError={e => { 
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback si la imagen no carga */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center hidden">
            <div className="text-center">
              <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">{currentClip.description}</p>
            </div>
          </div>
          
          {/* Overlay con información del tiempo */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="text-center text-white">
              <Play className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">{currentClip.description}</p>
              <p className="text-sm opacity-75">
                {formatTime(currentClip.start_time)} - {formatTime(currentClip.end_time)}
              </p>
            </div>
          </div>
        </div>

        {/* Opciones de reproducción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={openInNewTab}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver en Google Drive
          </Button>
          <Button
            onClick={openInEmbed}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            Reproducir en nueva pestaña
          </Button>
        </div>

        {/* Controles de navegación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyTimeInfo}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar tiempo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onNext}
              disabled={currentIndex === clips.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
              <Play className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                🎬 Reproducción en cola desde Google Drive
              </p>
              <ul className="mt-1 text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Clip {currentIndex + 1} de {clips.length} en la cola</li>
                <li>• Se abrirá en una nueva pestaña para evitar problemas de seguridad</li>
                <li>• El tiempo de inicio se configurará automáticamente</li>
                <li>• Usa los botones de navegación para cambiar entre clips</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 