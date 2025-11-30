import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Clock, FileVideo, Trash2, Eye, Star } from 'lucide-react';

interface AutoClip {
  clipId: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  fileSize: string;
  clipPath: string;
  matchId: number;
  createdAt: string;
}

interface AutoClipsDisplayProps {
  clips: AutoClip[];
  onPlayClip?: (clip: AutoClip) => void;
  onDeleteClip?: (clipId: string) => void;
  onViewClip?: (clip: AutoClip) => void;
  title?: string;
}

export function AutoClipsDisplay({ 
  clips, 
  onPlayClip, 
  onDeleteClip, 
  onViewClip, 
  title = "Momentos Destacados" 
}: AutoClipsDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  console.log('🎬 AutoClipsDisplay recibió clips:', clips);
  console.log('🎬 Funciones disponibles:', { onPlayClip: !!onPlayClip, onViewClip: !!onViewClip, onDeleteClip: !!onDeleteClip });

  if (clips.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50 text-yellow-600" />
            <p>No hay momentos destacados</p>
            <p className="text-sm mt-2">Los clips se crearán automáticamente durante la presentación</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-600" />
          {title} ({clips.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {clips.map((clip) => (
            <Card key={clip.clipId} className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{clip.description}</h4>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        AUTO
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(clip.startTime || 0)} - {formatTime(clip.endTime || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        <span>{formatTime(clip.duration || 0)}</span>
                      </div>
                      {clip.fileSize && (
                        <div className="flex items-center gap-1">
                          <FileVideo className="h-4 w-4" />
                          <span>{clip.fileSize}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Creado: {new Date(clip.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
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
                        onClick={() => {
                          console.log('🎬 Reproduciendo clip automático:', clip);
                          onPlayClip(clip);
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onDeleteClip && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteClip(clip.clipId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
