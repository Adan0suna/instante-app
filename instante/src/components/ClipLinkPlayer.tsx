import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, ExternalLink, Clock, MapPin, X, Copy } from 'lucide-react';
import type { ClipWithDetails } from '../lib/supabase/types';

interface ClipLinkPlayerProps {
  clip: ClipWithDetails;
  videoUrl: string;
  onClose: () => void;
}

export function ClipLinkPlayer({ clip, videoUrl, onClose }: ClipLinkPlayerProps) {
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

  const openInDrive = () => {
    if (fileId) {
      // Intentar abrir con parámetro de tiempo
      const timeUrl = `https://drive.google.com/file/d/${fileId}/view?t=${Math.floor(clip.start_time)}s`;
      window.open(timeUrl, '_blank');
    }
  };

  const openInDriveEmbed = () => {
    if (fileId) {
      // Abrir en modo embed
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview?t=${Math.floor(clip.start_time)}s`;
      window.open(embedUrl, '_blank');
    }
  };

  const copyTimeInfo = () => {
    const timeInfo = `Tiempo: ${formatTime(clip.start_time)} - ${formatTime(clip.end_time)} (Duración: ${formatTime(clip.end_time - clip.start_time)})`;
    navigator.clipboard.writeText(timeInfo);
  };

  if (!fileId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">URL de video no válida</p>
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

        {/* Enlaces de acción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="default"
            onClick={openInDrive}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir en Google Drive
          </Button>
          <Button
            variant="outline"
            onClick={openInDriveEmbed}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Reproducir en Drive
          </Button>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                💡 Cómo ver este clip:
              </p>
              <ul className="mt-1 text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Haz clic en "Abrir en Google Drive"</li>
                <li>• Navega manualmente al tiempo {formatTime(clip.start_time)}</li>
                <li>• Reproduce hasta {formatTime(clip.end_time)}</li>
                <li>• O usa "Reproducir en Drive" para intentar saltar automáticamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Acciones adicionales */}
        <div className="flex items-center justify-between">
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
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 