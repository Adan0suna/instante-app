import React from 'react';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { Loader2, AlertCircle, Play, ExternalLink } from 'lucide-react';

interface VideoStatusProps {
  status: 'loading' | 'error' | 'success' | 'idle';
  error?: string;
  onRetry?: () => void;
  onOpenInDrive?: () => void;
  className?: string;
}

export function VideoStatus({ 
  status, 
  error, 
  onRetry, 
  onOpenInDrive, 
  className = '' 
}: VideoStatusProps) {
  if (status === 'idle') return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
      {status === 'loading' && (
        <Alert variant="info">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando video...</span>
          </div>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="error">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error || 'Error al cargar el video'}</span>
            </div>
            <div className="flex gap-2">
              {onRetry && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onRetry}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  Reintentar
                </Button>
              )}
              {onOpenInDrive && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onOpenInDrive}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Abrir en Drive
                </Button>
              )}
            </div>
          </div>
        </Alert>
      )}

      {status === 'success' && (
        <Alert variant="success">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            <span>Video cargado correctamente</span>
          </div>
        </Alert>
      )}
    </div>
  );
} 