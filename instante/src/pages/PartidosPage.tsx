"use client"


import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { useNavigate } from "react-router-dom"
import { useMatch } from '../hooks/useMatch'
import { useUploadQueue } from '../hooks/useUploadQueue'
import { UploadQueueManager } from '../components/UploadQueueManager'
import type { Match, MatchWithDetails } from '../lib/supabase/types'
import { Calendar, Plus, Upload, Clock, CheckCircle, Play, Pause, Video, Star, Users, Trophy, TrendingUp, Filter, Search, AlertTriangle } from "lucide-react"

export default function PartidosPage() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const { loading, error, getMatchesWithDetails } = useMatch()
  const { pendingUploads, isProcessing, processQueue, retryFailedUploads } = useUploadQueue()
  const navigate = useNavigate()

  // Debug temporal para ver el estado de la cola
  console.log('🔍 Debug PartidosPage:', {
    pendingUploads: pendingUploads.length,
    isProcessing,
    uploads: pendingUploads
  })

  useEffect(() => {
    async function fetchMatches() {
      try {
        const data = await getMatchesWithDetails()
        setMatches(data)
      } catch (error) {
        console.error('Error al cargar los partidos:', error)
      }
    }

    fetchMatches()
  }, [])

  // Filtrar y ordenar partidos
  const filteredMatches = matches
    .filter(match => 
      match.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })

  const totalMatches = matches.length
  const totalVideos = matches.reduce((acc, match) => acc + (match.videos?.length || 0), 0)
  const totalClips = matches.reduce((acc, match) => acc + (match.clips?.length || 0), 0)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1A3C34] min-h-screen">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-[#D4AF37]/20 rounded-full animate-pulse mx-auto shadow-xl border border-[#D4AF37]/30"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-[#D4AF37]/40 rounded-full animate-spin mx-auto"></div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Cargando partidos...</h3>
          <p className="text-white/90 text-lg">Preparando tu biblioteca de grabaciones</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1A3C34] min-h-screen">
        <Card className="bg-white/20 backdrop-blur-sm border-white/30 shadow-xl max-w-md hover:border-[#D4AF37]/30 transition-colors">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-[#D4AF37]/30">
              <AlertTriangle className="h-10 w-10 text-[#D4AF37]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Error al cargar partidos</h3>
            <p className="text-white/90 mb-8 text-lg">{error}</p>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30 hover:border-[#D4AF37]/50 font-medium py-3"
              >
                Reintentar
              </Button>
              <Button 
                onClick={() => navigate("/")}
                className="flex-1 bg-[#D4AF37] text-black border-0 hover:bg-[#D4AF37]/80 font-medium py-3"
              >
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#1A3C34]">
      <div className="flex-1">
        {/* Header con estilo de la app */}
        <header className="bg-[#1A3C34] border-b border-[#000000]/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Mis Partidos</h1>
              <p className="text-white/80 mt-1">Gestiona tus grabaciones y momentos destacados</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Botón para procesar cola de subidas */}
              {pendingUploads.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => processQueue()}
                  disabled={isProcessing}
                  className="bg-[#D4AF37] text-black border-0 hover:bg-[#D4AF37]/80 shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Subir Videos ({pendingUploads.length})
                    </>
                  )}
                </Button>
              )}
              <Button 
                onClick={() => navigate("/grabar")}
                className="bg-[#D4AF37] text-black border-0 hover:bg-[#D4AF37]/80 shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Partido
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="space-y-6">
            {/* Estadísticas con toques dorados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-white shadow-xl hover:border-[#D4AF37]/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Total Partidos</p>
                      <p className="text-2xl font-bold text-white">{totalMatches}</p>
                    </div>
                    <div className="bg-[#D4AF37]/20 p-3 rounded-full border border-[#D4AF37]/30">
                      <Trophy className="h-8 w-8 text-[#D4AF37]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-white shadow-xl hover:border-[#D4AF37]/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Videos</p>
                      <p className="text-2xl font-bold text-white">{totalVideos}</p>
                    </div>
                    <div className="bg-[#D4AF37]/20 p-3 rounded-full border border-[#D4AF37]/30">
                      <Video className="h-8 w-8 text-[#D4AF37]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-white shadow-xl hover:border-[#D4AF37]/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Clips</p>
                      <p className="text-2xl font-bold text-white">{totalClips}</p>
                    </div>
                    <div className="bg-[#D4AF37]/20 p-3 rounded-full border border-[#D4AF37]/30">
                      <Star className="h-8 w-8 text-[#D4AF37]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-white shadow-xl hover:border-[#D4AF37]/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Subiendo</p>
                      <p className="text-2xl font-bold text-white">{pendingUploads.length}</p>
                    </div>
                    <div className="bg-[#D4AF37]/20 p-3 rounded-full border border-[#D4AF37]/30">
                      <TrendingUp className="h-8 w-8 text-[#D4AF37]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gestor de cola de subidas */}
            <UploadQueueManager />
            
            {/* Barra de búsqueda y filtros con toques dorados */}
            {matches.length > 0 && (
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 shadow-xl hover:border-[#D4AF37]/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#D4AF37] h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Buscar partidos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/80 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:outline-none font-medium"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant={sortBy === "date" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("date")}
                        className={sortBy === "date" ? "bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80 font-medium" : "bg-white/20 text-white border-white/30 hover:bg-white/30 hover:border-[#D4AF37]/50 font-medium"}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Por Fecha
                      </Button>
                      <Button
                        variant={sortBy === "title" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("title")}
                        className={sortBy === "title" ? "bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80 font-medium" : "bg-white/20 text-white border-white/30 hover:bg-white/30 hover:border-[#D4AF37]/50 font-medium"}
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Por Nombre
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Lista de partidos */}
            {filteredMatches.length === 0 ? (
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 shadow-xl hover:border-[#D4AF37]/30 transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-[#D4AF37]/30">
                      <Trophy className="h-12 w-12 text-[#D4AF37]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {searchTerm ? "No se encontraron partidos" : "No hay partidos registrados"}
                    </h3>
                    <p className="text-white/90 mb-8 text-lg">
                      {searchTerm 
                        ? "Intenta con otros términos de búsqueda" 
                        : "Comienza grabando tu primer partido"
                      }
                    </p>
                  <Button 
                    onClick={() => navigate("/grabar")}
                      className="bg-[#D4AF37] text-black border-0 hover:bg-[#D4AF37]/80 shadow-xl font-medium px-8 py-3 text-lg"
                  >
                      <Plus className="mr-2 h-5 w-5" />
                      Crear Primer Partido
                  </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.map((match) => {
                  const pendingUpload = pendingUploads.find(upload => upload.matchId === match.id);
                  const hasPendingUpload = !!pendingUpload;
                  
                  return (
                <Card 
                  key={match.id}
                      className="group cursor-pointer bg-white/20 backdrop-blur-sm border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/30 hover:border-[#D4AF37]/30"
                  onClick={() => navigate(`/partidos/${match.id}`)}
                >
                      <CardContent className="p-6">
                        <div className="space-y-5">
                          {/* Header del partido */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-xl text-white group-hover:text-[#D4AF37] transition-colors">
                                {match.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="bg-[#D4AF37]/20 p-1 rounded-full border border-[#D4AF37]/30">
                                  <Calendar className="h-4 w-4 text-[#D4AF37]" />
                                </div>
                                <span className="text-white/90 text-sm font-medium">
                                  {new Date(match.date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            {/* Estados de subida */}
                            <div className="flex flex-col gap-2">
                              {hasPendingUpload && (
                                <Badge className="bg-[#D4AF37] text-black border-0 shadow-lg font-medium">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Subiendo
                                </Badge>
                              )}
                              {isProcessing && hasPendingUpload && (
                                <Badge className="bg-white/30 text-white border-white/40 shadow-lg font-medium">
                                  <Upload className="h-3 w-3 mr-1" />
                                  Procesando
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Estadísticas del partido */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-[#D4AF37]/10 transition-colors">
                              <div className="bg-[#D4AF37]/20 p-2 rounded-full border border-[#D4AF37]/30">
                                <Video className="h-4 w-4 text-[#D4AF37]" />
                              </div>
                              <span className="text-sm font-bold text-white">
                                {match.videos?.length || 0} Videos
                              </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-[#D4AF37]/10 transition-colors">
                              <div className="bg-[#D4AF37]/20 p-2 rounded-full border border-[#D4AF37]/30">
                                <Star className="h-4 w-4 text-[#D4AF37]" />
                              </div>
                              <span className="text-sm font-bold text-white">
                                {match.clips?.length || 0} Clips
                      </span>
                            </div>
                          </div>

                          {/* Botón de acción */}
                          <div className="pt-2">
                            <div className="w-full bg-[#D4AF37] text-black text-center py-3 px-4 rounded-lg font-bold text-lg group-hover:bg-[#D4AF37]/80 transition-all duration-300 shadow-lg">
                              Ver Detalles
                            </div>
                          </div>
                        </div>
                      </CardContent>
                </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Footer con estilo de la app */}
        <footer className="bg-[#1A3C34] border-t border-[#000000]/20 mt-12">
          <div className="px-6 py-4 text-center">
            <p className="text-white/60 text-sm">
          © 2025 Instante. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
} 