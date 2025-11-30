import { useState } from 'react';

interface TempVideo {
  tempVideoId: string;
  tempVideoPath: string;
  title: string;
  matchId: number;
  fileSize: string;
}

interface UseTempVideoReturn {
  tempVideo: TempVideo | null;
  loading: boolean;
  error: string | null;
  saveTempVideo: (file: File, matchId: number, title: string) => Promise<TempVideo>;
  getTempVideoUrl: (tempVideoId: string) => string;
  deleteTempVideo: (tempVideoId: string) => Promise<void>;
}

export function useTempVideo(): UseTempVideoReturn {
  const [tempVideo, setTempVideo] = useState<TempVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTempVideo = async (
    file: File,
    matchId: number,
    title: string
  ): Promise<TempVideo> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎬 Guardando video temporal:', {
        fileName: file.name,
        fileSize: file.size,
        matchId,
        title
      });

      const formData = new FormData();
      formData.append('video', file);
      formData.append('matchId', matchId.toString());
      formData.append('title', title);

      const response = await fetch('http://localhost:3001/recordings/temp-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error guardando video temporal');
      }

      const result = await response.json();
      console.log('✅ Video temporal guardado:', result);

      const newTempVideo: TempVideo = {
        tempVideoId: result.tempVideoId,
        tempVideoPath: result.tempVideoPath,
        title: result.title,
        matchId: result.matchId,
        fileSize: result.fileSize
      };

      setTempVideo(newTempVideo);
      return newTempVideo;

    } catch (err: any) {
      console.error('❌ Error guardando video temporal:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTempVideoUrl = (tempVideoId: string): string => {
    return `http://localhost:3001/recordings/temp-video/${tempVideoId}`;
  };

  const deleteTempVideo = async (tempVideoId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Eliminando video temporal:', tempVideoId);

      const response = await fetch(`http://localhost:3001/recordings/temp-video/${tempVideoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error eliminando video temporal');
      }

      console.log('✅ Video temporal eliminado');
      setTempVideo(null);

    } catch (err: any) {
      console.error('❌ Error eliminando video temporal:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    tempVideo,
    loading,
    error,
    saveTempVideo,
    getTempVideoUrl,
    deleteTempVideo
  };
}


