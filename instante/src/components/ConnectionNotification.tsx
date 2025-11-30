import React, { useState, useEffect } from 'react';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useUploadQueue } from '../hooks/useUploadQueue';

interface ConnectionNotificationProps {
  className?: string;
}

export function ConnectionNotification({ className = '' }: ConnectionNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'warning' | 'error' | 'info'>('info');
  const [notificationMessage, setNotificationMessage] = useState('');
  const { connectionStatus } = useConnectionStatus();
  const { pendingUploads, isProcessing } = useUploadQueue();

  useEffect(() => {
    // Mostrar notificación cuando cambie el estado de conexión
    if (!connectionStatus.isOnline) {
      setNotificationType('error');
      setNotificationMessage('Conexión perdida. Las subidas se pausarán automáticamente.');
      setShowNotification(true);
    } else if (connectionStatus.connectionQuality === 'poor') {
      setNotificationType('warning');
      setNotificationMessage('Conexión lenta detectada. Los videos se agregarán a la cola de subidas.');
      setShowNotification(true);
    } else if (connectionStatus.connectionQuality === 'excellent' && pendingUploads.length > 0) {
      setNotificationType('success');
      setNotificationMessage('Conexión restaurada. Procesando cola de subidas...');
      setShowNotification(true);
    }

    // Auto-ocultar notificación después de 5 segundos
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus.isOnline, connectionStatus.connectionQuality, pendingUploads.length, showNotification]);

  useEffect(() => {
    // Mostrar notificación cuando se complete una subida
    const completedUploads = pendingUploads.filter(upload => upload.status === 'completed');
    if (completedUploads.length > 0) {
      setNotificationType('success');
      setNotificationMessage(`${completedUploads.length} video${completedUploads.length > 1 ? 's' : ''} subido${completedUploads.length > 1 ? 's' : ''} exitosamente.`);
      setShowNotification(true);
    }
  }, [pendingUploads]);

  const getIcon = () => {
    switch (notificationType) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getAlertVariant = () => {
    switch (notificationType) {
      case 'success':
        return 'success';
      case 'warning':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm ${className}`}>
      <Alert variant={getAlertVariant()}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="flex-1">
            {notificationMessage}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotification(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </Alert>
    </div>
  );
}
