import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnectionStatus } from './useConnectionStatus';

export interface PendingUpload {
  id: string;
  file: File;
  matchId: number;
  matchTitle: string;
  videoType: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  error?: string;
  progress?: number;
}

export interface UploadQueueConfig {
  maxConcurrentUploads: number;
  retryDelay: number; // en milisegundos
  maxRetries: number;
  autoRetry: boolean;
}

export function useUploadQueue(config: UploadQueueConfig = {
  maxConcurrentUploads: 1,
  retryDelay: 5000,
  maxRetries: 3,
  autoRetry: true
}) {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { connectionStatus, isConnectionAdequateForUpload } = useConnectionStatus();
  const uploadQueueRef = useRef<PendingUpload[]>([]);
  const processingRef = useRef(false);

  // Actualizar referencia cuando cambien las subidas pendientes
  useEffect(() => {
    uploadQueueRef.current = pendingUploads;
  }, [pendingUploads]);

  // Función para agregar una subida a la cola
  const addToQueue = useCallback((
    file: File,
    matchId: number,
    matchTitle: string,
    videoType: string = 'Principal'
  ): string => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newUpload: PendingUpload = {
      id: uploadId,
      file,
      matchId,
      matchTitle,
      videoType,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: config.maxRetries,
      status: 'pending',
      progress: 0
    };

    setPendingUploads(prev => [...prev, newUpload]);
    
    // Convertir archivo a base64 para persistencia
    const reader = new FileReader();
    reader.onload = () => {
      const storedUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
      storedUploads.push({
        ...newUpload,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          data: reader.result // Guardar contenido en base64
        }
      });
      localStorage.setItem('pendingUploads', JSON.stringify(storedUploads));
      console.log('💾 Video guardado en localStorage:', uploadId);
    };
    reader.readAsDataURL(file);

    console.log('📤 Subida agregada a la cola:', uploadId);
    return uploadId;
  }, [config.maxRetries]);

  // Función para procesar la cola de subidas
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    
    const uploads = uploadQueueRef.current.filter(upload => 
      upload.status === 'pending' || upload.status === 'failed'
    );

    if (uploads.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Verificar si la conexión es adecuada
    const fileSizeMB = uploads[0].file.size / (1024 * 1024);
    if (!isConnectionAdequateForUpload(fileSizeMB)) {
      console.log('📴 Conexión no adecuada para subida, pausando...');
      setPendingUploads(prev => prev.map(upload => 
        upload.status === 'pending' ? { ...upload, status: 'paused' } : upload
      ));
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    // Procesar subidas concurrentemente (limitado por maxConcurrentUploads)
    const uploadPromises = uploads.slice(0, config.maxConcurrentUploads).map(upload => 
      processUpload(upload)
    );

    await Promise.allSettled(uploadPromises);
    
    processingRef.current = false;
    setIsProcessing(false);
  }, [isConnectionAdequateForUpload, config.maxConcurrentUploads]);

  // Función para procesar una subida individual
  const processUpload = useCallback(async (upload: PendingUpload) => {
    try {
      // Actualizar estado a "uploading"
      setPendingUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'uploading', progress: 0 } : u
      ));

      // Simular subida (aquí iría la lógica real de subida)
      const uploadPromise = simulateUpload(upload);
      
      // Monitorear progreso
      const progressInterval = setInterval(() => {
        setPendingUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, progress: Math.min((u.progress || 0) + 10, 90) } : u
        ));
      }, 1000);

      await uploadPromise;
      
      clearInterval(progressInterval);

      // Marcar como completado
      setPendingUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'completed', progress: 100 } : u
      ));

      // Remover de localStorage
      const storedUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
      const updatedStoredUploads = storedUploads.filter((stored: any) => stored.id !== upload.id);
      localStorage.setItem('pendingUploads', JSON.stringify(updatedStoredUploads));

      console.log('✅ Subida completada:', upload.id);

    } catch (error: any) {
      console.error('❌ Error en subida:', upload.id, error);
      
      const newRetryCount = upload.retryCount + 1;
      const shouldRetry = newRetryCount <= upload.maxRetries && config.autoRetry;

      setPendingUploads(prev => prev.map(u => 
        u.id === upload.id ? {
          ...u,
          status: shouldRetry ? 'pending' : 'failed',
          retryCount: newRetryCount,
          error: error.message
        } : u
      ));

      if (shouldRetry) {
        console.log(`🔄 Reintentando subida ${upload.id} (intento ${newRetryCount}/${upload.maxRetries})`);
        setTimeout(() => processQueue(), config.retryDelay);
      }
    }
  }, [config.autoRetry, config.retryDelay]);

  // Función real de subida
  const simulateUpload = async (upload: PendingUpload): Promise<void> => {
    try {
      // Obtener configuración de almacenamiento
      const storageConfig = JSON.parse(localStorage.getItem('storageConfig') || '{"provider":"google-drive","credentials":{}}')
      const provider: 'google-drive' | 'mega' = storageConfig.provider || 'google-drive'
      const credentials = storageConfig.credentials || {}

      // Validar credenciales según el proveedor
      if (provider === 'google-drive') {
        const savedTokens = localStorage.getItem('googleDriveTokens') || JSON.stringify(credentials.googleDrive || {})
        if (!savedTokens || savedTokens === '{}') {
          throw new Error('No hay tokens de Google Drive configurados')
        }
      } else if (provider === 'mega') {
        if (!credentials.mega?.email || !credentials.mega?.password) {
          throw new Error('No hay credenciales de MEGA configuradas')
        }
      }

      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('video', upload.file);
      formData.append('storageProvider', provider);
      formData.append('matchId', upload.matchId.toString());
      
      // Agregar credenciales según el proveedor
      if (provider === 'google-drive') {
        const savedTokens = localStorage.getItem('googleDriveTokens') || JSON.stringify(credentials.googleDrive || {})
        formData.append('tokens', savedTokens);
      } else if (provider === 'mega') {
        formData.append('megaEmail', credentials.mega.email);
        formData.append('megaPassword', credentials.mega.password);
      }
      
      if (upload.videoType) formData.append('videoType', upload.videoType);
      if (upload.matchTitle) formData.append('title', upload.matchTitle);

      // Subir archivo al backend
      const response = await fetch('http://localhost:3001/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error en la subida: ${response.status} - ${errorData.error || 'Error desconocido'}`);
      }

      const result = await response.json();
      console.log('✅ Video subido exitosamente desde cola:', result);

      // Guardar información del video en la base de datos
      if (result.matchId) {
        try {
          // Importar y usar addVideo desde el módulo de Supabase
          const { addVideo } = await import('../lib/supabase/matches');
          const savedVideo = await addVideo({
            match_id: result.matchId,
            video_url: result.embedUrl,
            video_type: result.videoType
          });
          console.log('💾 Video guardado exitosamente en la base de datos:', savedVideo);
          
          // Guardar información del video temporal en localStorage
          if (result.tempVideoId) {
            const tempVideoInfo = {
              tempVideoId: result.tempVideoId,
              tempVideoPath: result.tempVideoPath,
              matchId: result.matchId,
              title: upload.matchTitle || 'Video subido',
              createdAt: new Date().toISOString()
            };
            localStorage.setItem(`tempVideo_${result.matchId}`, JSON.stringify(tempVideoInfo));
            console.log('✅ Video temporal guardado en localStorage:', tempVideoInfo);
          }
        } catch (dbError) {
          console.error('❌ Error al guardar video en la base de datos:', dbError);
          // No fallar la subida si hay error en la base de datos
        }
      }

    } catch (error: any) {
      console.error('❌ Error en subida desde cola:', error);
      throw error;
    }
  };

  // Función para reintentar subidas fallidas
  const retryFailedUploads = useCallback(() => {
    setPendingUploads(prev => prev.map(upload => 
      upload.status === 'failed' ? { ...upload, status: 'pending', retryCount: 0 } : upload
    ));
    processQueue();
  }, [processQueue]);

  // Función para cancelar una subida
  const cancelUpload = useCallback((uploadId: string) => {
    setPendingUploads(prev => prev.filter(upload => upload.id !== uploadId));
    
    // Remover de localStorage
    const storedUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
    const updatedStoredUploads = storedUploads.filter((stored: any) => stored.id !== uploadId);
    localStorage.setItem('pendingUploads', JSON.stringify(updatedStoredUploads));
  }, []);

  // Función para limpiar subidas completadas
  const clearCompleted = useCallback(() => {
    setPendingUploads(prev => prev.filter(upload => upload.status !== 'completed'));
  }, []);

  // Cargar subidas pendientes desde localStorage al inicializar
  useEffect(() => {
    const storedUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
    if (storedUploads.length > 0) {
      console.log('📥 Cargando subidas pendientes desde localStorage:', storedUploads.length);
      
      // Reconstruir objetos PendingUpload desde localStorage
      const restoredUploads: PendingUpload[] = storedUploads.map((stored: any) => {
        let file: File;
        
        if (stored.file.data) {
          // Reconstruir archivo desde base64
          const byteCharacters = atob(stored.file.data.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          file = new File([byteArray], stored.file.name, {
            type: stored.file.type,
            lastModified: stored.file.lastModified
          });
        } else {
          // Fallback: crear File dummy si no hay datos
          file = new File([], stored.file.name, {
            type: stored.file.type,
            lastModified: stored.file.lastModified
          });
        }

        return {
          id: stored.id,
          file,
          matchId: stored.matchId,
          matchTitle: stored.matchTitle,
          videoType: stored.videoType,
          timestamp: stored.timestamp,
          retryCount: stored.retryCount || 0,
          maxRetries: stored.maxRetries || config.maxRetries,
          status: stored.status === 'completed' ? 'completed' : 'pending',
          progress: stored.progress || 0,
          error: stored.error
        };
      });
      
      setPendingUploads(restoredUploads);
      console.log('✅ Subidas restauradas:', restoredUploads.length);
    }
  }, []);

  // Procesar cola cuando cambie la conexión
  useEffect(() => {
    if (connectionStatus.isOnline && connectionStatus.connectionQuality !== 'offline') {
      console.log('🌐 Conexión mejorada, procesando cola...');
      processQueue();
    }
  }, [connectionStatus.isOnline, connectionStatus.connectionQuality, processQueue]);

  // Procesar cola automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (!processingRef.current && uploadQueueRef.current.some(u => u.status === 'pending')) {
        processQueue();
      }
    }, 10000); // Verificar cada 10 segundos

    return () => clearInterval(interval);
  }, [processQueue]);

  // Función para limpiar subidas fallidas
  const clearFailed = useCallback(() => {
    setPendingUploads(prev => prev.filter(upload => upload.status !== 'failed'));
    
    // Remover de localStorage
    const storedUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
    const updatedStoredUploads = storedUploads.filter((stored: any) => stored.status !== 'failed');
    localStorage.setItem('pendingUploads', JSON.stringify(updatedStoredUploads));
  }, []);

  return {
    pendingUploads,
    isProcessing,
    addToQueue,
    retryFailedUploads,
    cancelUpload,
    clearCompleted,
    clearFailed,
    processQueue,
    connectionStatus
  };
}
