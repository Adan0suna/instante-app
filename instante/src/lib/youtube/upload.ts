import { youtubeAuth } from './auth'
import { YOUTUBE_API_ENDPOINTS } from './config'

export interface YouTubeVideoMetadata {
  title: string
  description: string
  tags: string[]
  categoryId: string
  privacyStatus: 'private' | 'unlisted' | 'public'
  language?: string
  location?: string
  recordingDate?: string
}

export interface YouTubeUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface YouTubeUploadResult {
  videoId: string
  title: string
  description: string
  privacyStatus: string
  publishedAt: string
  thumbnailUrl: string
  viewCount: string
  likeCount: string
}

export class YouTubeUploadService {
  private static instance: YouTubeUploadService

  static getInstance(): YouTubeUploadService {
    if (!YouTubeUploadService.instance) {
      YouTubeUploadService.instance = new YouTubeUploadService()
    }
    return YouTubeUploadService.instance
  }

  /**
   * Sube un video a YouTube
   */
  async uploadVideo(
    videoFile: File,
    metadata: YouTubeVideoMetadata,
    onProgress?: (progress: YouTubeUploadProgress) => void
  ): Promise<YouTubeUploadResult> {
    try {
      console.log('🚀 Iniciando subida de video...')
      console.log('📁 Archivo:', videoFile.name, '(', (videoFile.size / (1024 * 1024)).toFixed(2), 'MB)')
      console.log('📝 Metadata:', metadata)
      
      // Verificar autenticación
      console.log('🔍 Obteniendo token de acceso...')
      const accessToken = await youtubeAuth.getValidAccessToken()
      console.log('🔑 Token obtenido:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NO TOKEN')
      
      // Verificar scopes del token
      const tokens = youtubeAuth.getTokens()
      if (tokens) {
        console.log('🔍 Scopes del token:', tokens.scope)
        console.log('🔍 Scopes requeridos:', 'https://www.googleapis.com/auth/youtube.upload')
        console.log('🔍 ¿Tiene scope de upload?', tokens.scope.includes('youtube.upload') ? '✅ SÍ' : '❌ NO')
        console.log('🔍 Tipo de token:', tokens.token_type)
        console.log('🔍 Token expira en:', tokens.expires_in, 'segundos')
        console.log('🔍 Token obtenido en:', new Date(tokens.obtained_at).toLocaleString())
      }
      
      // Verificar estado del canal antes de subir
      console.log('🔍 Verificando estado del canal...')
      try {
        const channelInfo = await this.getChannelInfo()
        console.log('📺 Información del canal:', channelInfo)
      } catch (channelError) {
        console.warn('⚠️ No se pudo obtener información del canal:', channelError)
      }
      
      // Crear metadata del video
      const videoMetadata = {
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          categoryId: metadata.categoryId,
          defaultLanguage: metadata.language,
          recordingDate: metadata.recordingDate
        },
        status: {
          privacyStatus: metadata.privacyStatus,
          selfDeclaredMadeForKids: false
        }
      }

      // Crear FormData para la subida
      const formData = new FormData()
      formData.append('metadata', new Blob([JSON.stringify(videoMetadata)], {
        type: 'application/json'
      }))
      formData.append('video', videoFile)

      // Realizar la subida
      console.log('🌐 Enviando petición a YouTube API...')
      console.log('🔗 URL:', `${YOUTUBE_API_ENDPOINTS.UPLOAD}?part=snippet,status&uploadType=multipart`)
      console.log('📤 Headers completos:', { 
        'Authorization': `Bearer ${accessToken ? accessToken.substring(0, 20) + '...' : 'NO TOKEN'}`,
        'Content-Type': 'multipart/form-data'
      })
      console.log('📁 FormData contents:')
      for (const [key, value] of formData.entries()) {
        if (key === 'video') {
          console.log(`  ${key}:`, (value as File).name, `(${(value as File).size} bytes)`)
        } else {
          console.log(`  ${key}:`, value)
        }
      }
      
      const response = await fetch(`${YOUTUBE_API_ENDPOINTS.UPLOAD}?part=snippet,status&uploadType=multipart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData
      })

      console.log('📥 Respuesta recibida:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('🚨 Error HTTP:', response.status, response.statusText)
        console.error('🚨 Response headers:', Object.fromEntries(response.headers.entries()))
        
        let errorData
        try {
          errorData = await response.json()
          console.error('🚨 Error response completo:', errorData)
          console.error('🚨 Error details:', errorData.error)
          console.error('🚨 Error message:', errorData.error?.message)
          console.error('🚨 Error code:', errorData.error?.code)
          console.error('🚨 Error status:', errorData.error?.status)
          console.error('🚨 Error reason:', errorData.error?.errors?.[0]?.reason)
          console.error('🚨 Error domain:', errorData.error?.errors?.[0]?.domain)
        } catch (parseError) {
          console.error('🚨 No se pudo parsear el error como JSON')
          const errorText = await response.text()
          console.error('🚨 Error text:', errorText)
        }
        
        throw new Error(`Error subiendo video: ${errorData?.error?.message || response.statusText}`)
      }

      const result = await response.json()
      
      // Obtener información adicional del video
      const videoInfo = await this.getVideoInfo(result.id)
      
      return {
        videoId: result.id,
        title: result.snippet.title,
        description: result.snippet.description,
        privacyStatus: result.status.privacyStatus,
        publishedAt: result.snippet.publishedAt,
        thumbnailUrl: videoInfo.thumbnailUrl,
        viewCount: videoInfo.viewCount,
        likeCount: videoInfo.likeCount
      }
    } catch (error) {
      console.error('Error subiendo video a YouTube:', error)
      throw error
    }
  }

  /**
   * Obtiene información de un video subido
   */
  private async getVideoInfo(videoId: string) {
    try {
      const accessToken = await youtubeAuth.getValidAccessToken()
      
      const response = await fetch(
        `${YOUTUBE_API_ENDPOINTS.VIDEOS}?part=snippet,statistics&id=${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Error obteniendo información del video: ${response.statusText}`)
      }

      const data = await response.json()
      const video = data.items[0]

      return {
        thumbnailUrl: video.snippet.thumbnails?.default?.url || '',
        viewCount: video.statistics?.viewCount || '0',
        likeCount: video.statistics?.likeCount || '0'
      }
    } catch (error) {
      console.error('Error obteniendo información del video:', error)
      return {
        thumbnailUrl: '',
        viewCount: '0',
        likeCount: '0'
      }
    }
  }

  /**
   * Obtiene información del canal del usuario
   */
  async getChannelInfo(): Promise<any> {
    try {
      const accessToken = await youtubeAuth.getValidAccessToken()
      
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,status&mine=true',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Error obteniendo información del canal: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const channel = data.items[0]
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          status: channel.status,
          statistics: channel.statistics,
          isLinked: channel.status?.isLinked || false,
          privacyStatus: channel.status?.privacyStatus || 'unknown'
        }
      } else {
        throw new Error('No se encontró información del canal')
      }
    } catch (error) {
      console.error('Error obteniendo información del canal:', error)
      throw error
    }
  }

  /**
   * Obtiene las categorías de video disponibles
   */
  async getVideoCategories(): Promise<Array<{ id: string; title: string }>> {
    try {
      const accessToken = await youtubeAuth.getValidAccessToken()
      
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=ES',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Error obteniendo categorías: ${response.statusText}`)
      }

      const data = await response.json()
      return data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title
      }))
    } catch (error) {
      console.error('Error obteniendo categorías:', error)
      // Retornar categorías básicas como fallback
      return [
        { id: '17', title: 'Deportes' },
        { id: '22', title: 'Personas y blogs' },
        { id: '23', title: 'Comedia' },
        { id: '24', title: 'Entretenimiento' },
        { id: '25', title: 'Noticias y política' },
        { id: '26', title: 'Cómo hacer y estilo' },
        { id: '27', title: 'Educación' },
        { id: '28', title: 'Ciencia y tecnología' }
      ]
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return youtubeAuth.isAuthenticated()
  }

  /**
   * Cierra la sesión
   */
  logout(): void {
    youtubeAuth.logout()
  }
}

export const youtubeUpload = YouTubeUploadService.getInstance()
