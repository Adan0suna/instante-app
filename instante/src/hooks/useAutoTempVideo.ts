import { useState, useEffect } from 'react';

interface AutoTempVideo {
  tempVideoId: string;
  tempVideoPath: string;
  matchId: number;
  title: string;
  createdAt: string;
}

interface UseAutoTempVideoReturn {
  tempVideo: AutoTempVideo | null;
  loading: boolean;
  error: string | null;
  getTempVideoForMatch: (matchId: number) => AutoTempVideo | null;
  getTempVideoUrl: (tempVideoId: string) => string;
  clearTempVideo: (matchId: number) => void;
}

export function useAutoTempVideo(): UseAutoTempVideoReturn {
  const [tempVideo, setTempVideo] = useState<AutoTempVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTempVideoForMatch = (matchId: number): AutoTempVideo | null => {
    try {
      const stored = localStorage.getItem(`tempVideo_${matchId}`);
      if (stored) {
        const tempVideoInfo = JSON.parse(stored);
        setTempVideo(tempVideoInfo);
        return tempVideoInfo;
      }
      return null;
    } catch (err) {
      console.error('❌ Error obteniendo video temporal:', err);
      return null;
    }
  };

  const getTempVideoUrl = (tempVideoId: string): string => {
    return `http://localhost:3001/recordings/temp-video/${tempVideoId}`;
  };

  const clearTempVideo = (matchId: number) => {
    try {
      localStorage.removeItem(`tempVideo_${matchId}`);
      setTempVideo(null);
      console.log('🗑️ Video temporal eliminado del localStorage');
    } catch (err) {
      console.error('❌ Error eliminando video temporal:', err);
    }
  };

  // Cargar video temporal automáticamente al montar el componente
  useEffect(() => {
    // Este hook se puede usar para cargar automáticamente el video temporal
    // cuando se carga una página de detalles de partido
  }, []);

  return {
    tempVideo,
    loading,
    error,
    getTempVideoForMatch,
    getTempVideoUrl,
    clearTempVideo
  };
}


