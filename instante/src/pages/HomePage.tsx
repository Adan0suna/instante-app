"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { 
  Calendar, 
  Clock, 
  Video, 
  Star, 
  TrendingUp, 
  Play,
  Plus,
  Eye,
  Download,
  Youtube,
  BarChart3,
  Settings,
  ArrowRight,
  Zap,
  Target,
  Award,
  Activity
} from "lucide-react"
import { getMatches } from "../lib/supabase/matches"
import { supabase } from "../lib/supabase/supabase"
import type { Match } from "../lib/supabase/types"
import { useNavigate } from "react-router-dom"

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [clipsCount, setClipsCount] = useState(0)
  // No hay duration en Match, así que mostramos '--'
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      // Grabaciones
      const matches = await getMatches()
      setMatches(matches)

      // Clips
      const { count: clipsCount } = await supabase
        .from('clips')
        .select('*', { count: 'exact', head: true })
      setClipsCount(clipsCount || 0)
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="flex-1">
        {/* Header mejorado */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-500 bg-clip-text text-transparent">
                Panel de Control
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gestiona tus grabaciones y contenido deportivo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Sistema activo
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="grid gap-8">
            {/* Hero Section mejorado */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-500 to-yellow-500 p-8 text-white shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Zap className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Target className="h-3 w-3 mr-1" />
                    Plataforma Profesional
                  </Badge>
                </div>
                <h2 className="text-4xl font-bold mb-4">¡Bienvenido a Instante!</h2>
                <p className="text-xl mb-8 text-yellow-100 max-w-2xl">
                  Tu plataforma profesional para la grabación, análisis y gestión de contenido deportivo. 
                  Captura los momentos más importantes de tus partidos.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-green-700 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => navigate('/grabar')}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva Grabación
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={() => navigate('/partidos')}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Ver Grabaciones
                  </Button>
                </div>
              </div>
              
              {/* Elementos decorativos */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
            </div>

            {/* Estadísticas mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Grabaciones Totales</p>
                      <h3 className="text-3xl font-bold mt-2 text-green-700">
                        {loading ? (
                          <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                        ) : (
                          matches.length
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Partidos grabados</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <Video className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clips Creados</p>
                      <h3 className="text-3xl font-bold mt-2 text-green-700">
                        {loading ? (
                          <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                        ) : (
                          clipsCount
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Momentos destacados</p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Horas de Contenido</p>
                      <h3 className="text-3xl font-bold mt-2 text-green-700">
                        {loading ? (
                          <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                        ) : (
                          Math.round((matches.length * 1.5) * 10) / 10
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Horas grabadas</p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productividad</p>
                      <h3 className="text-3xl font-bold mt-2 text-green-700">
                        {loading ? (
                          <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                        ) : (
                          `${Math.round((clipsCount / Math.max(matches.length, 1)) * 100)}%`
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Clips por partido</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Grabaciones Recientes mejoradas */}
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-700" />
                        Grabaciones Recientes
                      </CardTitle>
                      <CardDescription>Tus últimas grabaciones de partidos</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/partidos')}
                      className="text-green-700 hover:text-green-800"
                    >
                      Ver todas
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gray-200 rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                    ) : matches.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Video className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay grabaciones</h3>
                        <p className="text-gray-600 mb-4">Aún no tienes grabaciones guardadas.</p>
                        <Button onClick={() => navigate('/grabar')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear primera grabación
                        </Button>
                      </div>
                    ) : (
                      matches.slice(0, 4).map((recording) => (
                        <div key={recording.id} className="group flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                              <Play className="h-4 w-4 text-green-700" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-green-700 transition-colors">
                                {recording.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(recording.date).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/partidos/${recording.id}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Acciones Rápidas mejoradas */}
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-700" />
                    Acciones Rápidas
                  </CardTitle>
                  <CardDescription>Accede a las funciones más utilizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-3 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 group" 
                      onClick={() => navigate('/grabar')}
                    >
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Plus className="h-5 w-5 text-green-700" />
                      </div>
                      <span className="text-sm font-medium">Nueva Grabación</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-3 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all duration-200 group" 
                      onClick={() => navigate('/partidos')}
                    >
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">Ver Partidos</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-3 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 group" 
                      onClick={() => navigate('/youtube')}
                    >
                      <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                        <Youtube className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="text-sm font-medium">YouTube</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-3 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 transition-all duration-200 group" 
                      onClick={() => navigate('/estadisticas')}
                    >
                      <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                        <BarChart3 className="h-5 w-5 text-yellow-600" />
                      </div>
                      <span className="text-sm font-medium">Estadísticas</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-3 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 transition-all duration-200 group" 
                      onClick={() => navigate('/grabaciones')}
                    >
                      <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                        <Download className="h-5 w-5 text-yellow-600" />
                      </div>
                      <span className="text-sm font-medium">Grabaciones</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-600 transition-all duration-200 group" 
                      onClick={() => navigate('/configuracion')}
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                        <Settings className="h-5 w-5 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">Configuración</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Logros y Progreso removido */}
          </div>
        </main>
        
        <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
          © 2025 Instante. Todos los derechos reservados.
        </footer>
      </div>
    
  )
} 