import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Upload, 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Trash2,
  Pause,
  Play,
  AlertTriangle
} from 'lucide-react';
import { useUploadQueue } from '../hooks/useUploadQueue';
import type { PendingUpload } from '../hooks/useUploadQueue';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

interface UploadQueueStatusProps {
  className?: string;
}

export function UploadQueueStatus({ className = '' }: UploadQueueStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { connectionStatus } = useConnectionStatus();
  const { 
    pendingUploads, 
    isProcessing, 
    retryFailedUploads, 
    cancelUpload, 
    clearCompleted,
    clearFailed
  } = useUploadQueue();

  const getStatusIcon = (status: PendingUpload['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: PendingUpload['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      uploading: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      paused: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge variant="outline" className={colors[status]}>
        {status === 'pending' && 'Pendiente'}
        {status === 'uploading' && 'Subiendo'}
        {status === 'completed' && 'Completado'}
        {status === 'failed' && 'Fallido'}
        {status === 'paused' && 'Pausado'}
      </Badge>
    );
  };

  const getConnectionIcon = () => {
    if (!connectionStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    switch (connectionStatus.connectionQuality) {
      case 'excellent':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'good':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <Wifi className="h-4 w-4 text-orange-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionText = () => {
    if (!connectionStatus.isOnline) {
      return 'Sin conexión';
    }
    
    switch (connectionStatus.connectionQuality) {
      case 'excellent':
        return 'Conexión excelente';
      case 'good':
        return 'Conexión buena';
      case 'poor':
        return 'Conexión lenta';
      default:
        return 'Verificando conexión...';
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const pendingCount = pendingUploads.filter(u => u.status === 'pending').length;
  const uploadingCount = pendingUploads.filter(u => u.status === 'uploading').length;
  const failedCount = pendingUploads.filter(u => u.status === 'failed').length;
  const completedCount = pendingUploads.filter(u => u.status === 'completed').length;
  const pausedCount = pendingUploads.filter(u => u.status === 'paused').length;

  if (pendingUploads.length === 0) {
    return null;
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <span>Cola de Subidas</span>
            <Badge variant="outline">
              {pendingUploads.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <span className="text-sm text-gray-600">
              {getConnectionText()}
            </span>
            {isExpanded ? '▼' : '▶'}
          </div>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Resumen de estados */}
          <div className="flex gap-2 flex-wrap">
            {pendingCount > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {uploadingCount > 0 && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {uploadingCount} subiendo
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {failedCount} fallido{failedCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {pausedCount > 0 && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                {pausedCount} pausado{pausedCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {completedCount} completado{completedCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            {failedCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={retryFailedUploads}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar Fallidos
              </Button>
            )}
            {completedCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearCompleted}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar Completados
              </Button>
            )}
            {failedCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearFailed}
                className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar Fallidos
              </Button>
            )}
          </div>

          {/* Lista de subidas */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {pendingUploads.map((upload) => (
              <div 
                key={upload.id} 
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(upload.status)}
                    <span className="font-medium text-sm">
                      {upload.matchTitle || 'Sin título'}
                    </span>
                    {getStatusBadge(upload.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(upload.timestamp)}
                    </span>
                    {upload.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelUpload(upload.id)}
                        className="h-6 w-6 p-0"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>{formatFileSize(upload.file.size)}</span>
                    <span>{upload.videoType}</span>
                  </div>
                </div>

                {upload.status === 'uploading' && upload.progress !== undefined && (
                  <div className="space-y-1">
                    <Progress value={upload.progress} className="h-2" />
                    <div className="text-xs text-gray-500 text-center">
                      {upload.progress}%
                    </div>
                  </div>
                )}

                {upload.status === 'failed' && upload.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{upload.error}</span>
                  </div>
                )}

                {upload.status === 'failed' && upload.retryCount > 0 && (
                  <div className="text-xs text-gray-500">
                    Reintentos: {upload.retryCount}/{upload.maxRetries}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Estado de procesamiento */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Procesando cola de subidas...</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
