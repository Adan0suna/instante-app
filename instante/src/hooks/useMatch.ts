import { useState, useCallback } from 'react'
import { Match, MatchVideo, Clip, UserAlias, ClipCategory, MatchWithDetails, ClipWithDetails } from '../lib/supabase/types'
import { getMatches, getMatchesWithDetails, createMatch, addClip, getMatch, getUserAliases, getClipCategories, addVideo, deleteMatch } from '../lib/supabase/matches'
import { useStorage } from './useStorage'
import type { StorageProviderType } from '../lib/storage/types'
import { getBackendUrl } from '../lib/config'

export function useMatch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getMatchesList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const matches = await getMatches()
      return matches
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getMatchesWithDetailsList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const matches = await getMatchesWithDetails()
      return matches
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createNewMatch = useCallback(async (match: Omit<Match, 'id'>) => {
    setLoading(true)
    setError(null)
    try {
      const newMatch = await createMatch(match)
      return newMatch
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getMatchDetailsById = useCallback(async (matchId: number) => {
    setLoading(true)
    setError(null)
    try {
      const match = await getMatch(matchId)
      return match
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getAliasesList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const aliases = await getUserAliases()
      return aliases
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getCategoriesList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const categories = await getClipCategories()
      return categories
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const addClipToMatch = useCallback(async (clip: Omit<Clip, 'id'>) => {
    setLoading(true)
    setError(null)
    try {
      const newClip = await addClip(clip)
      return newClip
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadVideo = useCallback(async (
    matchId: number, 
    file: File, 
    videoType?: string, 
    matchTitle?: string, 
    onProgress?: (progress: number) => void,
    storageProvider?: StorageProviderType
  ) => {
    setLoading(true)
    setError(null)
    try {
      // Obtener configuración de almacenamiento
      const storageConfig = JSON.parse(localStorage.getItem('storageConfig') || '{"provider":"google-drive","credentials":{}}')
      const provider: StorageProviderType = storageProvider || storageConfig.provider || 'google-drive'
      const credentials = storageConfig.credentials || {}

      console.log('📤 Iniciando subida de video:', { 
        matchId, 
        fileName: file.name, 
        fileSize: file.size,
        provider 
      })

      // Validar credenciales según el proveedor
      if (provider === 'google-drive') {
        const savedTokens = localStorage.getItem('googleDriveTokens') || JSON.stringify(credentials.googleDrive || {})
        if (!savedTokens || savedTokens === '{}') {
          throw new Error('No hay tokens de Google Drive configurados. Por favor, conecta tu cuenta de Google Drive primero.')
        }
      } else if (provider === 'mega') {
        if (!credentials.mega?.email || !credentials.mega?.password) {
          throw new Error('No hay credenciales de MEGA configuradas. Por favor, configura tus credenciales de MEGA.')
        }
      }

      // Crear FormData para la subida
      const formData = new FormData()
      formData.append('video', file)
      formData.append('storageProvider', provider)
      formData.append('matchId', matchId.toString())
      
      // Agregar credenciales según el proveedor
      if (provider === 'google-drive') {
        const savedTokens = localStorage.getItem('googleDriveTokens') || JSON.stringify(credentials.googleDrive || {})
        formData.append('tokens', savedTokens)
      } else if (provider === 'mega') {
        formData.append('megaEmail', credentials.mega.email)
        formData.append('megaPassword', credentials.mega.password)
      }
      
      if (videoType) formData.append('videoType', videoType)
      if (matchTitle) formData.append('title', matchTitle)
      
      console.log('📤 Datos a enviar al backend:', {
        matchId,
        videoType,
        title: matchTitle,
        fileName: file.name
      })

      // Simular progreso de subida
      if (onProgress) {
        let progress = 0
        const interval = setInterval(() => {
          progress += Math.random() * 20
          if (progress >= 100) {
            progress = 100
            clearInterval(interval)
          }
          onProgress(progress)
        }, 200)
      }

      // Subir archivo al backend
      const response = await fetch(getBackendUrl('/recordings/upload'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Error en la subida: ${response.status} - ${errorData.error || 'Error desconocido'}`)
      }

      const result = await response.json()
      console.log('✅ Video subido exitosamente:', result)

      // Guardar información del video en la base de datos si se proporcionó matchId
      if (result.matchId) {
        try {
          console.log('💾 Guardando video en la base de datos...')
          const savedVideo = await addVideo({
            match_id: result.matchId,
            video_url: result.embedUrl,
            video_type: result.videoType
            // No incluir drive_url ya que no existe en la tabla
          })
          console.log('✅ Video guardado en la base de datos:', savedVideo)
          
          // Guardar información del video temporal en localStorage para acceso inmediato
          if (result.tempVideoId) {
            const tempVideoInfo = {
              tempVideoId: result.tempVideoId,
              tempVideoPath: result.tempVideoPath,
              matchId: result.matchId,
              title: matchTitle || 'Video subido',
              createdAt: new Date().toISOString()
            };
            localStorage.setItem(`tempVideo_${result.matchId}`, JSON.stringify(tempVideoInfo));
            console.log('✅ Video temporal guardado en localStorage:', tempVideoInfo);
          } else {
            console.log('⚠️ No se recibió tempVideoId en la respuesta:', result);
          }
        } catch (dbError) {
          console.error('❌ Error al guardar video en la base de datos:', dbError)
          // No fallar la subida si hay error en la base de datos
        }
      }

      return result
    } catch (err: any) {
      console.error('❌ Error en la subida:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteMatchById = useCallback(async (matchId: number) => {
    setLoading(true)
    setError(null)
    try {
      await deleteMatch(matchId)
      return true
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getMatches: getMatchesList,
    getMatchesWithDetails: getMatchesWithDetailsList,
    createMatch: createNewMatch,
    uploadVideo,
    getMatchDetails: getMatchDetailsById,
    getAliases: getAliasesList,
    getCategories: getCategoriesList,
    addClip: addClipToMatch,
    deleteMatch: deleteMatchById
  }
} 