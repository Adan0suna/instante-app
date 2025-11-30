import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { LogIn, Cloud } from "lucide-react"
import { SidebarNav } from "../components/SidebarNav"
import { StorageProviderSelector } from "../components/StorageProviderSelector"
import { useStorage } from "../hooks/useStorage"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

export default function ConectarDrivePage() {
  const { provider, hasCredentials, getCurrentCredentials } = useStorage()
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokens, setTokens] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  console.log('🔍 ConectarDrivePage renderizando...')

  // Detectar si estamos en el callback de Google usando useEffect
  useEffect(() => {
    console.log('🔍 useEffect ejecutándose...')
    
    const initializeTokens = async () => {
      console.log('🔍 Inicializando tokens...')
      
      // Primero verificar si ya hay tokens guardados en localStorage
      const savedTokens = localStorage.getItem('googleDriveTokens')
      console.log('🔍 Tokens guardados:', !!savedTokens)
      
      if (savedTokens && !isConnected && !tokens) {
        try {
          const tokenData = JSON.parse(savedTokens)
          setTokens(tokenData)
          setIsConnected(true)
          setDebugInfo('Tokens cargados desde localStorage')
          return
        } catch (error) {
          console.error('Error al parsear tokens guardados:', error)
          localStorage.removeItem('googleDriveTokens')
          setDebugInfo('Error al parsear tokens guardados')
        }
      }

      // Si no hay tokens guardados, verificar si estamos en el callback de Google
      const params = new URLSearchParams(window.location.search)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const expires_in = params.get('expires_in')
      const token_type = params.get('token_type')
      
      console.log('🔍 Parámetros de URL:', { access_token: !!access_token, refresh_token: !!refresh_token })
      
      if (access_token && !isConnected && !tokens && !loading) {
        console.log('🔍 Procesando tokens de callback...')
        setLoading(true)
        const tokenData = { access_token, refresh_token, expires_in, token_type }
        setTokens(tokenData)
        setIsConnected(true)
        setDebugInfo('Tokens obtenidos de callback')
        
        // Guardar tokens en localStorage para uso en grabaciones automáticas
        localStorage.setItem('googleDriveTokens', JSON.stringify(tokenData))
        
        // Enviar tokens al backend para que pueda acceder a Google Drive
        try {
          const response = await fetch(`${BACKEND_URL}/google-drive/set-tokens-from-frontend`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tokens: tokenData }),
          });
          
          if (response.ok) {
            console.log('✅ Tokens enviados al backend exitosamente');
            setDebugInfo('Tokens enviados al backend exitosamente')
          } else {
            console.warn('⚠️ No se pudieron enviar tokens al backend');
            setDebugInfo('Error al enviar tokens al backend')
          }
        } catch (error) {
          console.warn('⚠️ Error al enviar tokens al backend:', error);
          setDebugInfo('Error de red al enviar tokens')
        }
        
        setLoading(false)
        // Limpiar la URL sin recargar la página
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        setDebugInfo('No hay tokens en URL ni localStorage')
      }
    };

    initializeTokens();
  }, [isConnected, tokens, loading])

  const handleConnect = async () => {
    console.log('🔍 Iniciando conexión con Google Drive...')
    setLoading(true)
    setError(null)
    setDebugInfo('Obteniendo URL de autorización...')
    
    try {
      const res = await fetch(`${BACKEND_URL}/google-drive/auth-url`)
      const data = await res.json()
      console.log('🔍 URL de autorización obtenida:', data.authUrl)
      setDebugInfo('Redirigiendo a Google...')
      window.location.href = data.authUrl
    } catch (err) {
      console.error('❌ Error al obtener URL de autorización:', err)
      setError("Error al obtener la URL de Google Drive")
      setDebugInfo('Error al obtener URL de autorización')
      setLoading(false)
    }
  }

  console.log('🔍 Renderizando con estado:', { isConnected, loading, error, debugInfo })

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SidebarNav />
      <div className="flex-1 flex flex-col ml-16 md:ml-64">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-semibold">Almacenamiento en la nube</h1>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Selector de proveedor de almacenamiento */}
            <StorageProviderSelector showCredentials={true} />
            
            {/* Conexión de Google Drive */}
            {provider === 'google-drive' && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Conectar Google Drive</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 items-center">
                  <p className="text-center text-muted-foreground">
                    Conecta tu cuenta de Google Drive para guardar y gestionar tus videos de manera segura en la nube.
                  </p>
            
                  {isConnected ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <LogIn className="h-8 w-8 text-green-500" />
                <span className="text-green-600 font-semibold">¡Cuenta conectada!</span>
                <Button
                  variant="outline"
                  className="mt-2 text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    localStorage.removeItem('googleDriveTokens')
                    setTokens(null)
                    setIsConnected(false)
                    setDebugInfo('Desconectado')
                  }}
                >
                  Desconectar Google Drive
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleConnect} 
                disabled={loading} 
                className="bg-[#4285F4] text-white hover:bg-[#357ae8]"
              >
                <LogIn className="h-5 w-5 mr-2" />
                {loading ? "Conectando..." : "Conectar con Google Drive"}
              </Button>
            )}
                  
                  {error && <span className="text-red-500 text-sm">{error}</span>}
                </CardContent>
              </Card>
            )}

            {/* Información de MEGA */}
            {provider === 'mega' && hasCredentials() && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>MEGA Configurado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 items-center">
                    <Cloud className="h-12 w-12 text-purple-600" />
                    <p className="text-center text-muted-foreground">
                      ✅ MEGA está configurado y listo para usar. Tus videos se subirán automáticamente a MEGA cuando uses la función de subida.
                    </p>
                    <p className="text-sm text-center text-muted-foreground">
                      Para cambiar las credenciales, selecciona MEGA nuevamente en el selector de arriba.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug info - solo mostrar en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-sm">Debug Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded w-full">
                    <strong>Debug:</strong> {debugInfo}
                    <br />
                    <strong>Proveedor seleccionado:</strong> {provider}
                    <br />
                    <strong>Tiene credenciales:</strong> {hasCredentials() ? 'Sí' : 'No'}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 