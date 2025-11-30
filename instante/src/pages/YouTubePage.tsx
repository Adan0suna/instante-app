import React, { useState } from 'react'
import { SidebarNav } from '../components/SidebarNav'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  Youtube, 
  Upload, 
  Video, 
  Settings, 
  TrendingUp, 
  Users,
  Play,
  Clock
} from 'lucide-react'
import { youtubeAuth } from '../lib/youtube/auth'
import { youtubeUpload } from '../lib/youtube/upload'

export default function YouTubePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [uploadStats, setUploadStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0
  })

  // Verificar estado de autenticación al cargar
  React.useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    const authenticated = youtubeAuth.isAuthenticated()
    setIsAuthenticated(authenticated)
  }

  const handleConnect = () => {
    youtubeAuth.initiateAuth()
  }

  const handleDisconnect = () => {
    youtubeUpload.logout()
    checkAuthStatus()
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SidebarNav />
      <div className="flex-1 flex flex-col ml-16 md:ml-64">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-600" />
            <h1 className="text-lg font-semibold">YouTube Integration</h1>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="grid gap-6">
            {/* Hero Section */}
            <div className="rounded-lg bg-gradient-to-r from-red-600 to-red-800 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <Youtube className="h-12 w-12" />
                <div>
                  <h2 className="text-3xl font-bold">Conecta con YouTube</h2>
                  <p className="text-lg opacity-90">Sube y gestiona tus videos directamente desde Instante</p>
                </div>
              </div>
              
              {!isAuthenticated ? (
                <Button 
                  onClick={handleConnect} 
                  size="lg" 
                  className="bg-white text-red-600 hover:bg-gray-100"
                >
                  <Youtube className="h-5 w-5 mr-2" />
                  Conectar con YouTube
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✅ Conectado
                  </Badge>
                  <Button 
                    onClick={handleDisconnect} 
                    variant="outline" 
                    size="sm"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Desconectar
                  </Button>
                </div>
              )}
            </div>

            {/* Stats Grid - Eliminado por no ser funcional */}
            {/* Las estadísticas reales se pueden ver en la página de Estadísticas */}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Subir Videos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Sube videos directamente desde Instante a tu canal de YouTube con metadatos completos.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-green-500" />
                      Títulos y descripciones personalizables
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Etiquetas y categorías automáticas
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-purple-500" />
                      Control de privacidad (público, no listado, privado)
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Monitorea el rendimiento de tus videos subidos desde Instante.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-red-500" />
                      Conteo de vistas en tiempo real
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Seguimiento de likes y comentarios
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      Historial de subidas
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How to use */}
            <Card>
              <CardHeader>
                <CardTitle>¿Cómo usar la integración con YouTube?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-red-100 text-red-800">1</Badge>
                    <div>
                      <h4 className="font-medium">Conecta tu cuenta</h4>
                      <p className="text-sm text-muted-foreground">
                        Haz clic en "Conectar con YouTube" y autoriza la aplicación.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-red-100 text-red-800">2</Badge>
                    <div>
                      <h4 className="font-medium">Ve a un partido</h4>
                      <p className="text-sm text-muted-foreground">
                        Navega a cualquier partido y haz clic en "Subir a YouTube".
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-red-100 text-red-800">3</Badge>
                    <div>
                      <h4 className="font-medium">Configura y sube</h4>
                      <p className="text-sm text-muted-foreground">
                        Personaliza título, descripción, etiquetas y privacidad, luego sube.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 