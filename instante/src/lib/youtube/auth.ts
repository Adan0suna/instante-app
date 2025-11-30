import { YOUTUBE_CONFIG } from './config'

export interface YouTubeTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
  obtained_at: number // Timestamp cuando se obtuvo el token
}

export class YouTubeAuthService {
  private static instance: YouTubeAuthService
  private tokens: YouTubeTokens | null = null

  static getInstance(): YouTubeAuthService {
    if (!YouTubeAuthService.instance) {
      YouTubeAuthService.instance = new YouTubeAuthService()
    }
    return YouTubeAuthService.instance
  }

  /**
   * Inicia el flujo de autenticación OAuth 2.0
   */
  initiateAuth(): void {
    // Limpiar tokens anteriores antes de iniciar nueva autenticación
    this.logout()
    
    const params = new URLSearchParams({
      client_id: YOUTUBE_CONFIG.CLIENT_ID,
      redirect_uri: YOUTUBE_CONFIG.REDIRECT_URI,
      response_type: 'code',
      scope: YOUTUBE_CONFIG.SCOPES,
      access_type: 'offline',
      prompt: 'consent'
    })

    const authUrl = `${YOUTUBE_CONFIG.AUTH_URL}?${params.toString()}`
    console.log('🔗 URL de autorización:', authUrl)
    
    // Abrir ventana más grande y con mejor control
    const authWindow = window.open(
      authUrl, 
      'youtube_auth', 
      'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    )
    
    // Verificar si la ventana se abrió correctamente
    if (!authWindow) {
      console.error('🚨 No se pudo abrir la ventana de autorización')
      alert('Por favor, permite popups para este sitio y vuelve a intentar')
      return
    }
    
    console.log('✅ Ventana de autorización abierta')
    
    // Opcional: Agregar un listener para detectar cuando se cierra la ventana
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        console.log('🔒 Ventana de autorización cerrada')
        clearInterval(checkClosed)
      }
    }, 1000)
  }

  /**
   * Intercambia el código de autorización por tokens
   */
  async exchangeCodeForTokens(code: string): Promise<YouTubeTokens> {
    try {
      // Log de debugging
      console.log('🔍 Debug - Valores enviados:')
      console.log('Client ID:', YOUTUBE_CONFIG.CLIENT_ID)
      console.log('Client Secret:', YOUTUBE_CONFIG.CLIENT_SECRET ? '***' : 'NO DEFINIDO')
      console.log('Code:', code)
      console.log('Redirect URI:', YOUTUBE_CONFIG.REDIRECT_URI)
      console.log('Token URL:', YOUTUBE_CONFIG.TOKEN_URL)
      
      const bodyParams = new URLSearchParams({
        client_id: YOUTUBE_CONFIG.CLIENT_ID,
        client_secret: YOUTUBE_CONFIG.CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: YOUTUBE_CONFIG.REDIRECT_URI,
      })
      
      console.log('🔍 Body params:', bodyParams.toString())
      
      const response = await fetch(YOUTUBE_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🚨 Error response:', response.status, response.statusText)
        console.error('🚨 Error body:', errorText)
        throw new Error(`Error en la autenticación: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const tokens = await response.json()
      // Agregar timestamp de cuando se obtuvo el token
      const tokensWithTimestamp = {
        ...tokens,
        obtained_at: Date.now()
      }
      this.tokens = tokensWithTimestamp
      
      // Guardar tokens en localStorage
      localStorage.setItem('youtube_tokens', JSON.stringify(tokensWithTimestamp))
      
      return tokens
    } catch (error) {
      console.error('Error intercambiando código por tokens:', error)
      throw error
    }
  }

  /**
   * Obtiene los tokens almacenados
   */
  public getTokens(): YouTubeTokens | null {
    if (!this.tokens) {
      const stored = localStorage.getItem('youtube_tokens')
      if (stored) {
        this.tokens = JSON.parse(stored)
      }
    }
    return this.tokens
  }

  /**
   * Verifica si los tokens están válidos
   */
  isAuthenticated(): boolean {
    const tokens = this.getTokens()
    if (!tokens) return false
    
    // Verificar si el token ha expirado (con margen de 5 minutos)
    if (!tokens.obtained_at) {
      console.log('⚠️ Token sin timestamp, considerando como no válido')
      return false
    }
    
    const expiryTime = tokens.obtained_at + (tokens.expires_in * 1000) - (5 * 60 * 1000)
    const isValid = Date.now() < expiryTime
    
    console.log('🔍 Verificando token:', {
      obtained_at: new Date(tokens.obtained_at).toLocaleTimeString(),
      expires_in: tokens.expires_in,
      expiryTime: new Date(expiryTime).toLocaleTimeString(),
      now: new Date().toLocaleTimeString(),
      isValid
    })
    
    return isValid
  }

  /**
   * Refresca el token de acceso
   */
  async refreshAccessToken(): Promise<string> {
    const tokens = this.getTokens()
    if (!tokens?.refresh_token) {
      throw new Error('No hay refresh token disponible')
    }

    try {
      const response = await fetch(YOUTUBE_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: YOUTUBE_CONFIG.CLIENT_ID,
          client_secret: YOUTUBE_CONFIG.CLIENT_SECRET,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        throw new Error(`Error refrescando token: ${response.statusText}`)
      }

      const newTokens = await response.json()
      // Mantener el timestamp original y agregar timestamp de refresh
      this.tokens = { 
        ...tokens, 
        ...newTokens,
        obtained_at: tokens.obtained_at // Mantener timestamp original
      }
      
      // Actualizar en localStorage
      localStorage.setItem('youtube_tokens', JSON.stringify(this.tokens))
      
      return newTokens.access_token
    } catch (error) {
      console.error('Error refrescando token:', error)
      throw error
    }
  }

  /**
   * Obtiene el token de acceso válido
   */
  async getValidAccessToken(): Promise<string> {
    console.log('🔍 getValidAccessToken llamado...')
    console.log('🔍 Estado de autenticación:', this.isAuthenticated())
    console.log('🔍 Tokens en memoria:', this.tokens ? 'SÍ' : 'NO')
    
    if (this.isAuthenticated()) {
      console.log('✅ Token válido encontrado, retornando...')
      return this.tokens!.access_token
    }

    console.log('🔄 Token no válido, intentando refrescar...')
    // Intentar refrescar el token
    try {
      const newToken = await this.refreshAccessToken()
      console.log('✅ Token refrescado exitosamente')
      return newToken
    } catch (error) {
      console.error('🚨 Error refrescando token:', error)
      // Si falla, limpiar tokens y pedir nueva autenticación
      this.logout()
      throw new Error('Sesión expirada, requiere nueva autenticación')
    }
  }

  /**
   * Cierra la sesión
   */
  logout(): void {
    this.tokens = null
    localStorage.removeItem('youtube_tokens')
  }
}

export const youtubeAuth = YouTubeAuthService.getInstance()
