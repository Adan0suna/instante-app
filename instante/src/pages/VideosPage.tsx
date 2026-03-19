"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  Upload,
  Download,
  FileVideo,
  Play,
  Trash2,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Video,
} from "lucide-react"

export default function VideosPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState("mp4")
  const [importedVideos, setImportedVideos] = useState<Array<{
    id: number
    name: string
    size: string
    duration: string
    status: 'ready' | 'processing' | 'error'
    importDate: string
    format: string
  }>>([]) // Array vacío para videos reales importados


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = (files: FileList) => {
    console.log("Archivos seleccionados:", files)
    setIsUploading(true)
    setUploadProgress(0)

    // Simular progreso de importación
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          
          // Agregar videos a la biblioteca después de "importar"
          const newVideos = Array.from(files).map((file, index) => ({
            id: Date.now() + index,
            name: file.name,
            size: (file.size / (1024 * 1024 * 1024)).toFixed(1) + ' GB',
            duration: 'Calculando...', // Se podría calcular la duración real
            status: 'ready' as const,
            importDate: new Date().toISOString().split('T')[0],
            format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
          }))
          
          setImportedVideos(prev => [...prev, ...newVideos])
          
          // Mostrar mensaje de éxito
          console.log(`✅ ${newVideos.length} video(s) importado(s) exitosamente`)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handleConvertToMatch = (video: any) => {
    // TODO: Implementar conversión de video a partido
    console.log('Convirtiendo video a partido:', video)
    // Aquí se podría:
    // 1. Abrir un modal para configurar el partido
    // 2. Crear un nuevo partido en la base de datos
    // 3. Redirigir a la página de grabación con el video cargado
    alert(`Convirtiendo "${video.name}" a partido...`)
  }

  const handleDeleteVideo = (videoId: number) => {
    setImportedVideos(prev => prev.filter(video => video.id !== videoId))
  }

  const handleEditVideo = (video: any) => {
    alert(`Abriendo editor para: "${video.name}"...`)
    // TODO: Implementar redirección o apertura del editor
  }

  const handlePlayVideo = (video: any) => {
    alert(`Reproduciendo: "${video.name}"...`)
    // TODO: Implementar reproductor de video
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready":
        return "Listo"
      case "processing":
        return "Procesando"
      case "error":
        return "Error"
      case "completed":
        return "Completado"
      default:
        return "Pendiente"
    }
  }

  return (
    <div className="min-h-screen flex-1 bg-[#1A3C34]">
      <div className="flex-1 flex flex-col">
        <header className="bg-[#1A3C34] border-b border-[#000000]/20 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white flex items-center">
              <FileVideo className="h-6 w-6 mr-2" />
              Gestión de Videos
            </h1>
            <div className="flex gap-2">
              <Button className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80">
                <Upload className="h-4 w-4 mr-2" />
                Importar video
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="import" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1">
                <TabsTrigger
                  value="import"
                  className="text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-200 hover:bg-white/20 rounded-md"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </TabsTrigger>
                <TabsTrigger
                  value="library"
                  className="text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-200 hover:bg-white/20 rounded-md"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Biblioteca
                </TabsTrigger>
                <TabsTrigger
                  value="integration"
                  className="text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-200 hover:bg-white/20 rounded-md"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Integración
                </TabsTrigger>
              </TabsList>

              <TabsContent value="import" className="mt-8 space-y-6 animate-in fade-in-50 duration-300">
                <Card className="bg-white border-[#000000]/10 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-[#000000]">Importar videos externos</CardTitle>
                    <CardDescription>Sube videos externos para convertirlos en partidos o crear clips</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                        dragActive 
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.02] shadow-lg" 
                          : "border-[#000000]/20 hover:border-[#D4AF37]/50 hover:bg-[#1A3C34]/5"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className={`transition-transform duration-300 ${dragActive ? "scale-110" : ""}`}>
                        <Upload className={`h-16 w-16 mx-auto mb-6 transition-colors ${
                          dragActive ? "text-[#D4AF37]" : "text-[#000000]/40"
                        }`} />
                      </div>
                      <h3 className="text-xl font-semibold text-[#000000] mb-3">Arrastra y suelta tus videos aquí</h3>
                      <p className="text-[#000000]/60 mb-6 text-lg">
                        O haz clic para seleccionar archivos desde tu dispositivo
                      </p>
                      <Button
                        className="bg-[#1A3C34] text-white hover:bg-[#1A3C34]/80 transition-all duration-200 px-8 py-3 text-lg rounded-lg shadow-md hover:shadow-lg"
                        onClick={() => document.getElementById("file-input")?.click()}
                      >
                        <FolderOpen className="h-5 w-5 mr-3" />
                        Seleccionar archivos
                      </Button>
                      <input
                        id="file-input"
                        type="file"
                        multiple
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                      />
                    </div>

                    {isUploading && (
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[#000000] font-medium">Importando video...</span>
                          <span className="text-[#000000]/60">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-[#000000]/60">
                          El video se está procesando y estará disponible para editar pronto
                        </p>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-[#1A3C34]/5 rounded-lg">
                      <h4 className="font-medium text-[#000000] mb-2">Formatos soportados</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-[#000000]/70">
                        <span>• MP4</span>
                        <span>• AVI</span>
                        <span>• MOV</span>
                        <span>• MKV</span>
                        <span>• WMV</span>
                        <span>• FLV</span>
                        <span>• WEBM</span>
                        <span>• M4V</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="library" className="mt-8 space-y-6 animate-in fade-in-50 duration-300">
                <Card className="bg-white border-[#000000]/10 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-[#000000]">Videos importados</CardTitle>
                    <CardDescription>Gestiona tus videos externos importados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {importedVideos.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-[#1A3C34]/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                          <FileVideo className="h-10 w-10 text-[#1A3C34]/60" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#000000] mb-3">No hay videos importados</h3>
                        <p className="text-[#000000]/60 mb-6 max-w-md mx-auto">
                          Importa tus primeros videos desde la pestaña "Importar" para comenzar a crear partidos y clips.
                        </p>
                        <Button 
                          className="bg-[#1A3C34] text-white hover:bg-[#1A3C34]/80 transition-all duration-200 px-6 py-3 rounded-lg"
                          onClick={() => document.querySelector('[value="import"]')?.click()}
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Importar Videos
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {importedVideos.map((video) => (
                        <div
                          key={video.id}
                          className="flex items-center justify-between p-6 border border-[#000000]/10 rounded-xl hover:bg-[#1A3C34]/5 transition-all duration-200 hover:shadow-md group"
                        >
                          <div className="flex items-center gap-6">
                            <div className="p-3 bg-[#1A3C34]/10 rounded-lg group-hover:bg-[#1A3C34]/20 transition-colors">
                              <FileVideo className="h-8 w-8 text-[#1A3C34]" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#000000] text-lg mb-2">{video.name}</h4>
                              <div className="flex items-center gap-6 text-sm text-[#000000]/60">
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Tamaño:</span> {video.size}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Duración:</span> {video.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Formato:</span> {video.format}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Fecha:</span> {new Date(video.importDate).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(video.status)}
                                  <span className="font-medium">{getStatusText(video.status)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {video.status === "ready" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-[#1A3C34] text-white hover:bg-[#1A3C34]/80 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                                  onClick={() => handleEditVideo(video)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-[#1A3C34]/30 text-[#1A3C34] hover:bg-[#1A3C34] hover:text-white transition-all duration-200 rounded-lg"
                                  onClick={() => handlePlayVideo(video)}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                                  onClick={() => handleConvertToMatch(video)}
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Convertir a Partido
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-lg"
                              onClick={() => handleDeleteVideo(video.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>


              <TabsContent value="integration" className="mt-8 space-y-6 animate-in fade-in-50 duration-300">
                <Card className="bg-white border-[#000000]/10 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-[#000000]">Integración con Instante</CardTitle>
                    <CardDescription>Conecta tus videos externos con las funcionalidades principales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border border-[#000000]/10 rounded-xl hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-[#1A3C34]/5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-[#1A3C34]/10 rounded-lg">
                            <Video className="h-6 w-6 text-[#1A3C34]" />
                          </div>
                          <h4 className="font-semibold text-[#000000] text-lg">Convertir a Partido</h4>
                        </div>
                        <p className="text-[#000000]/70 mb-4 leading-relaxed">
                          Convierte videos externos en partidos para usar todas las funcionalidades de Instante
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#1A3C34]/30 text-[#1A3C34] hover:bg-[#1A3C34] hover:text-white transition-all duration-200 rounded-lg"
                        >
                          Ver tutorial
                        </Button>
                      </div>
                      
                      <div className="p-6 border border-[#000000]/10 rounded-xl hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-[#1A3C34]/5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
                            <Edit className="h-6 w-6 text-[#D4AF37]" />
                          </div>
                          <h4 className="font-semibold text-[#000000] text-lg">Crear Clips</h4>
                        </div>
                        <p className="text-[#000000]/70 mb-4 leading-relaxed">
                          Extrae momentos destacados de videos externos para crear clips
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-200 rounded-lg"
                        >
                          Ver tutorial
                        </Button>
                      </div>
                      
                      <div className="p-6 border border-[#000000]/20 rounded-xl bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <Play className="h-6 w-6 text-red-600" />
                          </div>
                          <h4 className="font-semibold text-[#000000] text-lg">Subir a YouTube</h4>
                        </div>
                        <p className="text-[#000000]/70 mb-4 leading-relaxed">
                          Conecta con YouTube para subir videos directamente desde Instante
                        </p>
                        <Button 
                          className="bg-red-600 text-white hover:bg-red-700 transition-all duration-200 rounded-lg shadow-md hover:shadow-lg"
                          onClick={() => window.location.href = '/youtube'}
                        >
                          Conectar YouTube
                        </Button>
                      </div>
                      
                      <div className="p-6 border border-[#000000]/20 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FolderOpen className="h-6 w-6 text-blue-600" />
                          </div>
                          <h4 className="font-semibold text-[#000000] text-lg">Google Drive</h4>
                        </div>
                        <p className="text-[#000000]/70 mb-4 leading-relaxed">
                          Guarda y sincroniza videos en la nube con Google Drive
                        </p>
                        <Button 
                          className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 rounded-lg shadow-md hover:shadow-lg"
                          onClick={() => window.location.href = '/conectar-drive'}
                        >
                          Conectar Drive
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
} 