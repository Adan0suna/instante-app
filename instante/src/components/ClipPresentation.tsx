import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, SkipBack, SkipForward, X, Clock, MapPin, Copy, Maximize2, List, ExternalLink, AlertTriangle } from 'lucide-react';
import type { ClipWithDetails } from '../lib/supabase/types';

interface ClipPresentationProps {
  clips: ClipWithDetails[];
  onClose: () => void;
}

export function ClipPresentation({ clips, onClose }: ClipPresentationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const currentClip = clips[currentIndex];

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

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };

  const nextClip = () => {
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousClip = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const playClip = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const openClipInNewTab = () => {
    if (currentClip.clip_url) {
      window.open(currentClip.clip_url, '_blank');
    }
  };

  if (!currentClip) {
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

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Presentación de Clips ({currentIndex + 1} de {clips.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlaylist}
          >
            <List className="h-4 w-4" />
          </Button>
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
          {currentClip.clip_url ? (
            // Si hay clip separado, mostrar miniatura y opciones
            <>
              <img
                src={currentClip.clip_url.replace('/preview', '/thumbnail')}
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
              
              {/* Overlay con información */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="text-center text-white">
                  <Play className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">{currentClip.description}</p>
                  <p className="text-sm opacity-75">
                    {formatTime(currentClip.start_time)} - {formatTime(currentClip.end_time)}
                  </p>
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

        {/* Opciones de reproducción para clips procesados */}
        {currentClip.clip_url && (
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={openClipInNewTab}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver clip en Google Drive
            </Button>
          </div>
        )}

        {/* Controles de navegación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={previousClip}
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
              onClick={nextClip}
              disabled={currentIndex === clips.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} de {clips.length}
          </div>
        </div>

        {/* Lista de reproducción */}
        {showPlaylist && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-3">Lista de reproducción</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {clips.map((clip, index) => (
                <div
                  key={clip.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
                    index === currentIndex ? 'bg-accent' : ''
                  }`}
                  onClick={() => playClip(index)}
                >
                  <div className="flex items-center gap-2">
                    <Play className="h-3 w-3" />
                    <span className="text-sm">{clip.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
              <Play className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                🎬 Presentación de clips procesados por FFmpeg
              </p>
              <ul className="mt-1 text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Cada clip es un video separado procesado por FFmpeg</li>
                <li>• Los clips se muestran como miniaturas para evitar problemas de seguridad</li>
                <li>• Haz clic en "Ver clip en Google Drive" para reproducir</li>
                <li>• Usa los controles de navegación para cambiar entre clips</li>
                <li>• Haz clic en "Lista" para ver todos los clips disponibles</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 