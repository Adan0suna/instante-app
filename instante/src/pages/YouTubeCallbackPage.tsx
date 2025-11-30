import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { youtubeAuth } from '../lib/youtube/auth'

export default function YouTubeCallbackPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      
      console.log('🔍 Callback recibido:')
      console.log('Code:', code)
      console.log('Error:', error)
      console.log('URL completa:', window.location.href)

      if (error) {
        setStatus('error')
        setError(`Error de autorización: ${error}`)
        return
      }

      if (!code) {
        setStatus('error')
        setError('No se recibió código de autorización')
        return
      }

      console.log('🔄 Iniciando intercambio de código por tokens...')
      
      // Intercambiar código por tokens
      await youtubeAuth.exchangeCodeForTokens(code)
      
      setStatus('success')
      
      // NO cerrar automáticamente - dejar que el usuario vea el resultado
      console.log('✅ Autenticación exitosa - Tokens obtenidos')
      
             // Notificar a la ventana principal que la autenticación fue exitosa
       // Usar localStorage en lugar de postMessage debido a políticas de seguridad
       const timestamp = Date.now().toString()
       localStorage.setItem('youtube_auth_status', 'success')
       localStorage.setItem('youtube_auth_timestamp', timestamp)
       console.log('📡 Estado de autenticación guardado en localStorage')
       console.log('📡 Clave: youtube_auth_status = success')
       console.log('📡 Clave: youtube_auth_timestamp =', timestamp)
       console.log('📡 Tiempo actual:', new Date().toLocaleTimeString())
      
             // La ventana se quedará abierta por más tiempo para que puedas ver los cambios
       // Solo se cerrará si el usuario hace clic en "Cerrar ventana"
       console.log('⏰ Ventana abierta - puedes ver los cambios en la consola')

    } catch (error) {
      console.error('🚨 Error en callback:', error)
      setStatus('error')
      setError(`Error en la autenticación: ${(error as Error).message}`)
    }
  }

  const handleClose = () => {
    window.close()
  }

  const handleRetry = () => {
    setStatus('loading')
    setError(null)
    handleCallback()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <CardTitle>Procesando autenticación...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Estamos configurando tu conexión con YouTube
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-600">¡Autenticación exitosa!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
                         <p className="text-muted-foreground">
               Tu cuenta de YouTube ha sido conectada exitosamente.
             </p>
             <p className="text-sm text-muted-foreground">
               ✅ Tokens guardados en localStorage
             </p>
             <p className="text-sm text-muted-foreground">
               📡 Mensaje enviado a la ventana principal
             </p>
             <p className="text-sm text-muted-foreground">
               🔍 Revisa la consola para ver los detalles
             </p>
             <p className="text-sm text-muted-foreground">
               ⏰ Esta ventana permanecerá abierta
             </p>
            <Button onClick={handleClose} className="w-full">
              Cerrar ventana
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <CardTitle className="text-red-600">Error de autenticación</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {error || 'Ocurrió un error durante la autenticación.'}
          </p>
          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="outline" className="flex-1">
              Reintentar
            </Button>
            <Button onClick={handleClose} className="flex-1">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
