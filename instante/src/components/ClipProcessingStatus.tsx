import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ClipProcessingStatusProps {
  totalClips: number;
  processedClips: number;
  processingClips: number;
  failedClips: number;
}

export function ClipProcessingStatus({ 
  totalClips, 
  processedClips, 
  processingClips, 
  failedClips 
}: ClipProcessingStatusProps) {
  const progress = totalClips > 0 ? (processedClips / totalClips) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Estado de procesamiento de clips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalClips}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{processedClips}</div>
            <div className="text-xs text-muted-foreground">Completados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{processingClips}</div>
            <div className="text-xs text-muted-foreground">Procesando</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{failedClips}</div>
            <div className="text-xs text-muted-foreground">Fallidos</div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {processingClips > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Procesando {processingClips} clip{processingClips > 1 ? 's' : ''}...
              </span>
            </div>
          </div>
        )}

        {processedClips === totalClips && totalClips > 0 && (
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                ¡Todos los clips han sido procesados!
              </span>
            </div>
          </div>
        )}

        {failedClips > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800 dark:text-red-200">
                {failedClips} clip{failedClips > 1 ? 's' : ''} falló en el procesamiento
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 