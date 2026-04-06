"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { SidebarNav } from "../components/SidebarNav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { 
  Upload, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Calendar, 
  Clock, 
  HardDrive, 
  Eye, 
  Trash2,
  MoreVertical,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  AlertCircle,
  CheckCircle,
  UploadCloud
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useMatchWithQueue } from '../hooks/useMatchWithQueue'
import type { MatchWithDetails } from '../lib/supabase/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Progress } from "../components/ui/progress"

export default function GrabacionesPage() {
  const navigate = useNavigate()
  const { loading, error, getMatchesWithDetails, createMatch, uploadVideo } = useMatchWithQueue()
  
  // Estados para la interfaz
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterStatus, setFilterStatus] = useState<"all" | "with-video" | "without-video">("all")
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [showTitleDialog, setShowTitleDialog] = useState(false)
  const [matchTitle, setMatchTitle] = useState("")
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Cargar datos reales
  useEffect(() => {
    async function fetchMatches() {
      try {
        const data = await getMatchesWithDetails()
        setMatches(data as MatchWithDetails[])
      } catch (error) {
        console.error('Error al cargar las grabaciones:', error)
      }
    }

    fetchMatches()
  }, [getMatchesWithDetails])

  // Filtrar y ordenar grabaciones
  const filteredMatches = matches
    .filter(match => {
      const matchesSearch = match.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === "all" || 
        (filterStatus === "with-video" && match.videos.length > 0) ||
        (filterStatus === "without-video" && match.videos.length === 0)
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        comparison = a.title.localeCompare(b.title)
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  const handleExport = (matchId: number) => {
    // Implementar exportación real
    console.log(`Exportando grabación ${matchId}`)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPendingFile(file)
      setMatchTitle(file.name.split('.').slice(0, -1).join('.') || 'Video Importado')
      setShowTitleDialog(true)
      // Limpiar el input
      event.target.value = ''
    }
  }

  const handleConfirmImport = async () => {
    if (!pendingFile || !matchTitle) return

    setIsImporting(true)
    setShowTitleDialog(false)
    setUploadProgress(0)

    try {
      console.log(`Creando partido: ${matchTitle}`)
      const match = await createMatch({
        title: matchTitle,
        date: new Date().toISOString().split('T')[0]
      })
      
      console.log(`Subiendo archivo: ${pendingFile.name}`)
      await uploadVideo(match.id, pendingFile, 'Principal', matchTitle, (progress) => {
        setUploadProgress(progress)
      })

      // Refrescar lista
      const data = await getMatchesWithDetails()
      setMatches(data as MatchWithDetails[])
      
    } catch (error) {
      console.error('Error importando archivo:', error)
      alert("Error al importar el video: " + (typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error)))
    } finally {
      setIsImporting(false)
      setPendingFile(null)
      setMatchTitle("")
      setUploadProgress(0)
    }
  }

  const handleDelete = async (matchId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta grabación?')) {
      try {
        // Implementar eliminación real
        console.log(`Eliminando grabación ${matchId}`)
        setMatches(matches.filter(m => m.id !== matchId))
      } catch (error) {
        console.error('Error eliminando grabación:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (match: MatchWithDetails) => {
    if (match.videos.length > 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Con video</Badge>
    }
    return <Badge variant="outline" className="text-gray-600">Sin video</Badge>
  }

  return (
    <div className="flex-1">
      <div className="flex-1">
        {/* Header mejorado */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex h-16 items-center gap-4 px-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mis Grabaciones
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredMatches.length} de {matches.length} grabaciones
              </p>
            </div>
            
            {/* Controles de búsqueda y filtros */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar grabaciones..."
                  className="pl-10 w-64 bg-white/50 border-gray-200 focus:bg-white transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Filtro de estado */}
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="with-video">Con video</option>
                <option value="without-video">Sin video</option>
              </select>
              
              {/* Ordenamiento */}
              <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200 p-1">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 text-sm border-none outline-none bg-transparent"
                >
                  <option value="date">Fecha</option>
                  <option value="title">Título</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="h-6 w-6 p-0"
                >
                  {sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                </Button>
              </div>
              
              {/* Modo de vista */}
              <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200 p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-6 w-6 p-0"
                >
                  <Grid3X3 className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-6 w-6 p-0"
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Importar */}
              <div className="relative">
                <input
                  type="file"
                  id="import-recording"
                  className="hidden"
                  accept="video/*"
                  onChange={handleImport}
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('import-recording')?.click()}
                  disabled={isImporting}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  {isImporting ? (
                    <UploadCloud className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Nueva grabación */}
              <Button 
                onClick={() => navigate("/grabacion")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Grabación
              </Button>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando grabaciones...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-2">Error al cargar las grabaciones</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay grabaciones</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'No se encontraron grabaciones con ese término.' : 'Aún no tienes grabaciones guardadas.'}
                </p>
                <Button 
                  onClick={() => navigate("/grabacion")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera grabación
                </Button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {filteredMatches.map((match) => (
                <Card 
                  key={match.id} 
                  className="group cursor-pointer bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/90"
                  onClick={() => navigate(`/partidos/${match.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-lg overflow-hidden">
                      {match.videos.length > 0 ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <div className="bg-black/70 rounded-full p-3 group-hover:scale-110 transition-transform">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Sin video</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Badge de estado */}
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(match)}
                      </div>
                      
                      {/* Overlay de acciones */}
                      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/partidos/${match.id}`)
                            }}
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExport(match.id)
                            }}
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información del partido */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {match.title}
                        </h3>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(match.date)}</span>
                        </div>
                        
                        {match.videos.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{match.videos.length} video{match.videos.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        
                        {match.clips && match.clips.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            <span>{match.clips.length} clip{match.clips.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Acciones rápidas */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/partidos/${match.id}`)
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExport(match.id)
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Exportar
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(match.id)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        
        <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
          © 2024 Instante. Todos los derechos reservados.
        </footer>
      </div>

      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Video Externo</DialogTitle>
            <DialogDescription>Ingresa el título para el nuevo partido o grabación del que procede este video.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título del partido</label>
              <Input
                placeholder="Ej: Final de torneo..."
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
              />
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Subiendo...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowTitleDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmImport} disabled={!matchTitle || isImporting}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 