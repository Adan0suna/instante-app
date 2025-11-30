import { useState, useEffect, useCallback } from 'react';

export interface ConnectionStatus {
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  uploadSpeed?: number;
  downloadSpeed?: number;
}

export function useConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    connectionQuality: 'excellent'
  });

  // Función para medir la velocidad de conexión
  const measureConnectionSpeed = useCallback(async (): Promise<{ upload: number; download: number }> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const testData = new Array(1000).fill('test').join('');
      
      // Simular medición de velocidad
      const uploadSpeed = Math.random() * 10 + 1; // 1-11 Mbps
      const downloadSpeed = Math.random() * 20 + 5; // 5-25 Mbps
      
      setTimeout(() => {
        resolve({ upload: uploadSpeed, download: downloadSpeed });
      }, 1000);
    });
  }, []);

  // Función para determinar la calidad de conexión
  const determineConnectionQuality = useCallback((uploadSpeed: number, downloadSpeed: number): ConnectionStatus['connectionQuality'] => {
    if (uploadSpeed < 1 || downloadSpeed < 2) return 'poor';
    if (uploadSpeed < 3 || downloadSpeed < 5) return 'good';
    return 'excellent';
  }, []);

  // Función para verificar si la conexión es adecuada para subidas
  const isConnectionAdequateForUpload = useCallback((fileSizeMB: number): boolean => {
    const { connectionQuality, uploadSpeed } = connectionStatus;
    
    if (connectionQuality === 'offline' || connectionQuality === 'poor') {
      return false;
    }
    
    // Si el archivo es muy grande y la velocidad es baja, no es adecuado
    if (fileSizeMB > 100 && uploadSpeed && uploadSpeed < 2) {
      return false;
    }
    
    return true;
  }, [connectionStatus]);

  // Función para obtener el tiempo estimado de subida
  const getEstimatedUploadTime = useCallback((fileSizeMB: number): number => {
    const { uploadSpeed } = connectionStatus;
    if (!uploadSpeed) return 0;
    
    // Tiempo en minutos
    return Math.ceil((fileSizeMB * 8) / (uploadSpeed * 60));
  }, [connectionStatus]);

  useEffect(() => {
    const updateConnectionStatus = async () => {
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        try {
          const speeds = await measureConnectionSpeed();
          const quality = determineConnectionQuality(speeds.upload, speeds.download);
          
          setConnectionStatus({
            isOnline: true,
            connectionQuality: quality,
            uploadSpeed: speeds.upload,
            downloadSpeed: speeds.download
          });
        } catch (error) {
          console.error('Error midiendo velocidad:', error);
          setConnectionStatus({
            isOnline: true,
            connectionQuality: 'poor'
          });
        }
      } else {
        setConnectionStatus({
          isOnline: false,
          connectionQuality: 'offline'
        });
      }
    };

    // Verificar conexión inicial
    updateConnectionStatus();

    // Escuchar cambios de conexión
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      updateConnectionStatus();
    };

    const handleOffline = () => {
      console.log('📴 Conexión perdida');
      setConnectionStatus({
        isOnline: false,
        connectionQuality: 'offline'
      });
    };

    // Verificar conexión periódicamente (cada 30 segundos)
    const interval = setInterval(updateConnectionStatus, 30000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [measureConnectionSpeed, determineConnectionQuality]);

  return {
    connectionStatus,
    isConnectionAdequateForUpload,
    getEstimatedUploadTime,
    refreshConnectionStatus: () => {
      const updateConnectionStatus = async () => {
        const isOnline = navigator.onLine;
        
        if (isOnline) {
          try {
            const speeds = await measureConnectionSpeed();
            const quality = determineConnectionQuality(speeds.upload, speeds.download);
            
            setConnectionStatus({
              isOnline: true,
              connectionQuality: quality,
              uploadSpeed: speeds.upload,
              downloadSpeed: speeds.download
            });
          } catch (error) {
            console.error('Error midiendo velocidad:', error);
            setConnectionStatus({
              isOnline: true,
              connectionQuality: 'poor'
            });
          }
        } else {
          setConnectionStatus({
            isOnline: false,
            connectionQuality: 'offline'
          });
        }
      };
      updateConnectionStatus();
    }
  };
}
