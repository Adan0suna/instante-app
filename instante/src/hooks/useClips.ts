import { useState } from 'react';
import { addClip } from '../lib/supabase/matches';

interface Clip {
  clipId: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  fileSize: string;
  clipPath: string;
  matchId: number;
}

interface UseClipsReturn {
  clips: Clip[];
  loading: boolean;
  error: string | null;
  createClip: (videoPath: string, startTime: number, endTime: number, description: string, matchId: number, aliasId: number, tempVideoId?: string) => Promise<Clip>;
  getClipsForMatch: (matchId: number) => Promise<Clip[]>;
  deleteClip: (clipId: string) => Promise<void>;
}

export function useClips(): UseClipsReturn {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClip = async (
    videoPath: string,
    startTime: number,
    endTime: number,
    description: string,
    matchId: number,
    aliasId: number,
    tempVideoId?: string
  ): Promise<Clip> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎬 Creando clip:', {
        videoPath,
        startTime,
        endTime,
        description,
        matchId,
        aliasId,
        tempVideoId
      });

      // Primero crear el clip en la base de datos
      const clipData = {
        match_id: matchId,
        alias_id: aliasId,
        description,
        start_time: startTime.toString(),
        end_time: endTime.toString()
      };

      const createdClip = await addClip(clipData);
      console.log('✅ Clip creado en la base de datos:', createdClip);

      // Ahora procesar el clip con FFmpeg
      const response = await fetch('http://localhost:3001/recortes/process-clip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoPath,
          tempVideoId,
          startTime,
          endTime,
          description,
          matchId,
          clipId: createdClip.id // Enviar el ID del clip creado
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error procesando el clip');
      }

      const result = await response.json();
      console.log('✅ Clip procesado exitosamente:', result);

      const newClip: Clip = {
        clipId: result.clipId,
        description: result.description,
        startTime,
        endTime,
        duration: result.duration,
        fileSize: result.fileSize,
        clipPath: result.clipPath,
        matchId: result.matchId
      };

      setClips(prev => [...prev, newClip]);
      return newClip;

    } catch (err: any) {
      console.error('❌ Error creando clip:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getClipsForMatch = async (matchId: number): Promise<Clip[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 Obteniendo clips para partido:', matchId);

      // Usar el nuevo endpoint que obtiene clips desde la base de datos
      const response = await fetch(`http://localhost:3001/recortes/db/${matchId}`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo clips');
      }

      const clipsData = await response.json();
      console.log('📋 Clips obtenidos desde la base de datos:', clipsData);

      // Filtrar solo clips que tienen archivos físicos
      const availableClips = clipsData.filter((clip: any) => clip.fileExists);
      console.log('📋 Clips disponibles con archivos:', availableClips);

      // Convertir los datos del servidor al formato de Clip
      const formattedClips: Clip[] = availableClips.map((clip: any) => ({
        clipId: clip.clipId,
        description: clip.description || 'Clip procesado',
        startTime: clip.startTime || 0,
        endTime: clip.endTime || 0,
        duration: clip.duration || 0,
        fileSize: clip.fileSize || 'No disponible',
        clipPath: clip.clipPath || '',
        matchId: clip.matchId || matchId
      }));

      setClips(formattedClips);
      return formattedClips;

    } catch (err: any) {
      console.error('❌ Error obteniendo clips:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteClip = async (clipId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Eliminando clip:', clipId);

      // Por ahora, solo eliminamos del estado local
      // En el futuro, podríamos agregar un endpoint para eliminar del servidor
      setClips(prev => prev.filter(clip => clip.clipId !== clipId));

    } catch (err: any) {
      console.error('❌ Error eliminando clip:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    clips,
    loading,
    error,
    createClip,
    getClipsForMatch,
    deleteClip
  };
} 