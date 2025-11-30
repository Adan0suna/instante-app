import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Scissors, Clock, FileVideo, Trash2, Eye, Wand2 } from 'lucide-react';
import { VideoEditor } from './VideoEditor';

interface Clip {
  id?: number;
  clipId?: string;
  description: string;
  start_time: string | number;
  end_time: string | number;
  duration?: number;
  fileSize?: string;
  clipPath?: string;
  matchId: number;
  created_at?: string;
}

interface ClipsListProps {
  clips: Clip[];
  onPlayClip?: (clip: Clip) => void;
  onDeleteClip?: (clipId: string | number) => void;
  onViewClip?: (clip: Clip) => void;
  onEditClip?: (clip: Clip) => void;
  title?: string;
}

export function ClipsList({ clips, onPlayClip, onDeleteClip, onViewClip, onEditClip, title = "Clips" }: ClipsListProps) {
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseInterval = (interval: string): number => {
    if (typeof interval === 'number') return interval;
    
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

  const getClipThumbnailUrl = (videoUrl: string, startTime: number) => {
    // Para clips locales, usar la URL del servidor
    if (videoUrl.includes('localhost:3001')) {
      return videoUrl;
    }
    // Para videos de Drive, usar la URL de preview
    return videoUrl;
  };

  if (clips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay clips creados</p>
            <p className="text-sm mt-2">Crea clips desde el video del partido</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          {title} ({clips.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {clips.map((clip, index) => {
            const startTime = parseInterval(clip.start_time);
            const endTime = parseInterval(clip.end_time);
            const duration = endTime - startTime;
            
            return (
              <Card key={clip.id || clip.clipId || index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{clip.description}</h4>
                        {clip.clipId && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            LOCAL
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Play className="h-4 w-4" />
                          <span>{formatTime(duration)}</span>
                        </div>
                        {clip.fileSize && (
                          <div className="flex items-center gap-1">
                            <FileVideo className="h-4 w-4" />
                            <span>{clip.fileSize}</span>
                          </div>
                        )}
                      </div>
                      
                      {clip.created_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Creado: {new Date(clip.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {onEditClip && clip.clipId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClip(clip);
                            setShowEditor(true);
                          }}
                          className="text-purple-600 hover:text-purple-700"
                          title="Editar clip"
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {onViewClip && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewClip(clip)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {onPlayClip && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPlayClip(clip)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {onDeleteClip && clip.clipId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteClip(clip.clipId!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
      
      {/* Editor de video */}
      {showEditor && selectedClip && selectedClip.clipId && (
        <div className="mt-4">
          <VideoEditor
            videoUrl={`http://localhost:3001/recortes/file/${selectedClip.clipId}`}
            clipId={selectedClip.clipId}
            onSave={(editedVideoUrl) => {
              console.log('Video editado guardado:', editedVideoUrl);
              setShowEditor(false);
              setSelectedClip(null);
              if (onEditClip) onEditClip(selectedClip);
            }}
            onCancel={() => {
              setShowEditor(false);
              setSelectedClip(null);
            }}
          />
        </div>
      )}
    </Card>
  );
}


