import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { 
  Upload, 
  Youtube, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  EyeOff,
  Globe,
  Settings
} from 'lucide-react'
import { youtubeAuth } from '../lib/youtube/auth'
import { youtubeUpload, YouTubeVideoMetadata, YouTubeUploadResult } from '../lib/youtube/upload'

interface YouTubeUploaderProps {
  onClose: () => void
  videoFile?: File
  initialTitle?: string
  initialDescription?: string
}

export function YouTubeUploader({ 
  onClose, 
  videoFile: initialVideoFile, 
  initialTitle = '', 
  initialDescription = '' 
}: YouTubeUploaderProps) {
  console.log('🚀 YouTubeUploader montado con props:', { initialVideoFile, initialTitle, initialDescription })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<YouTubeUploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)
  
  // Formulario
  const [videoFile, setVideoFile] = useState<File | undefined>(initialVideoFile)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [categoryId, setCategoryId] = useState('17') // Deportes por defecto
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'unlisted' | 'public'>('private')
  const [language, setLanguage] = useState('es')
  
  // Preferencias del usuario (guardadas en localStorage)
  const [userPreferences, setUserPreferences] = useState({
    defaultPrivacy: 'private' as 'private' | 'unlisted' | 'public',
    defaultTags: ['fútbol', 'partido', 'highlights'] as string[],
    defaultDescription: 'Partido grabado con Instante - App de análisis deportivo',
    autoAddTags: true,
    rememberSettings: true
  })
  
  // Categorías
  const [categories, setCategories] = useState<Array<{ id: string; title: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  useEffect(() => {
    console.log('🔧 YouTubeUploader useEffect ejecutándose...')
    checkAuthStatus()
    loadCategories()
    loadUserPreferences() // Cargar preferencias del usuario
    
    // Verificar estado de autenticación usando localStorage
    const checkAuthFromStorage = () => {
      const authStatus = localStorage.getItem('youtube_auth_status')
      const authTimestamp = localStorage.getItem('youtube_auth_timestamp')
      
      console.log('🔍 Verificando localStorage:', { authStatus, authTimestamp })
      
      if (authStatus === 'success' && authTimestamp) {
        const timestamp = parseInt(authTimestamp)
        const now = Date.now()
        const timeDiff = now - timestamp
        
        console.log('📡 Estado encontrado:', { timestamp, now, timeDiff })
        
        // Solo procesar si el timestamp es reciente (últimos 10 segundos)
        if (timeDiff < 10000) {
          console.log('📡 Estado de autenticación exitosa detectado en localStorage')
          localStorage.removeItem('youtube_auth_status')
          localStorage.removeItem('youtube_auth_timestamp')
          console.log('🧹 localStorage limpiado')
          checkAuthStatus()
          loadCategories()
        } else {
          console.log('⏰ Timestamp muy antiguo, ignorando')
        }
      }
    }
    
    // Verificar cada 500ms para ser más rápido
    const interval = setInterval(checkAuthFromStorage, 500)
    console.log('✅ Intervalo iniciado cada 500ms')
    
    // Cleanup del interval
    return () => {
      console.log('🧹 Limpiando intervalo...')
      clearInterval(interval)
    }
  }, [])

  const checkAuthStatus = () => {
    console.log('🔍 Verificando estado de autenticación...')
    const authenticated = youtubeAuth.isAuthenticated()
    console.log('🔍 Estado de autenticación:', authenticated)
    console.log('🔍 Estado anterior en React:', isAuthenticated)
    setIsAuthenticated(authenticated)
    console.log('🔍 Estado actualizado en React:', authenticated)
    console.log('🔍 ¿Debería mostrar formulario?', authenticated ? 'SÍ' : 'NO')
  }

  const loadCategories = async () => {
    if (!isAuthenticated) return
    
    setLoadingCategories(true)
    try {
      const cats = await youtubeUpload.getVideoCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Cargar preferencias del usuario desde localStorage
  const loadUserPreferences = () => {
    try {
      const saved = localStorage.getItem('youtube_user_preferences')
      if (saved) {
        const preferences = JSON.parse(saved)
        setUserPreferences(preferences)
        
        // Aplicar preferencias por defecto
        if (preferences.rememberSettings) {
          setPrivacyStatus(preferences.defaultPrivacy)
          if (preferences.autoAddTags) {
            setTags(preferences.defaultTags)
          }
          if (!description) {
            setDescription(preferences.defaultDescription)
          }
        }
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error)
    }
  }

  // Guardar preferencias del usuario en localStorage
  const saveUserPreferences = (newPreferences: typeof userPreferences) => {
    try {
      localStorage.setItem('youtube_user_preferences', JSON.stringify(newPreferences))
      setUserPreferences(newPreferences)
    } catch (error) {
      console.error('Error guardando preferencias:', error)
    }
  }

  const handleAuthenticate = () => {
    youtubeAuth.initiateAuth()
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleAddDefaultTag = () => {
    if (tagInput.trim() && !userPreferences.defaultTags.includes(tagInput.trim())) {
      const newDefaultTags = [...userPreferences.defaultTags, tagInput.trim()]
      saveUserPreferences({...userPreferences, defaultTags: newDefaultTags})
      setTagInput('')
    }
  }

  const handleRemoveDefaultTag = (tagToRemove: string) => {
    const newDefaultTags = userPreferences.defaultTags.filter(tag => tag !== tagToRemove)
    saveUserPreferences({...userPreferences, defaultTags: newDefaultTags})
  }

  const handleUpload = async () => {
    if (!videoFile) {
      setError('No hay archivo de video seleccionado')
      return
    }

    if (!title.trim()) {
      setError('El título es obligatorio')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Aplicar preferencias automáticamente si están habilitadas
      let finalTags = [...tags]
      let finalDescription = description.trim()
      
      if (userPreferences.autoAddTags) {
        // Agregar tags por defecto si no están ya incluidos
        userPreferences.defaultTags.forEach(tag => {
          if (!finalTags.includes(tag)) {
            finalTags.push(tag)
          }
        })
      }
      
      if (!finalDescription && userPreferences.defaultDescription) {
        finalDescription = userPreferences.defaultDescription
      }
      
      const metadata: YouTubeVideoMetadata = {
        title: title.trim(),
        description: finalDescription,
        tags: finalTags,
        categoryId,
        privacyStatus,
        language,
        recordingDate: new Date().toISOString()
      }

      const result = await youtubeUpload.uploadVideo(videoFile, metadata, (progress) => {
        setUploadProgress(progress.percentage)
      })

      setUploadResult(result)
      setUploadProgress(100)
    } catch (error) {
      setError('Error subiendo video: ' + (error as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogout = () => {
    youtubeUpload.logout()
    checkAuthStatus()
    setUploadResult(null)
  }

  if (uploadResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">¡Video subido exitosamente!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="font-medium">{uploadResult.title}</p>
              <p className="text-sm text-muted-foreground">
                ID: {uploadResult.videoId}
              </p>
              <Badge variant={uploadResult.privacyStatus === 'public' ? 'default' : 'outline'}>
                {uploadResult.privacyStatus === 'public' ? 'Público' : 
                 uploadResult.privacyStatus === 'unlisted' ? 'No listado' : 'Privado'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vistas:</span>
                <p className="font-medium">{uploadResult.viewCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Me gusta:</span>
                <p className="font-medium">{uploadResult.likeCount}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => window.open(`https://youtube.com/watch?v=${uploadResult.videoId}`, '_blank')}
              >
                <Youtube className="h-4 w-4 mr-2" />
                Ver en YouTube
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-600" />
            <CardTitle>Subir a YouTube</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowPreferences(true)}
              title="Configurar preferencias"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isAuthenticated ? (
            <div className="text-center py-8">
              <Youtube className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Conectar con YouTube</h3>
              <p className="text-muted-foreground mb-4">
                Necesitas autenticarte con tu cuenta de YouTube para subir videos
              </p>
              <Button onClick={handleAuthenticate} className="bg-red-600 hover:bg-red-700">
                <Youtube className="h-4 w-4 mr-2" />
                Conectar con YouTube
              </Button>
            </div>
          ) : (
            <>
              {/* Estado de autenticación */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">Conectado a YouTube</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Desconectar
                </Button>
              </div>

                             {/* Formulario de subida */}
               <div className="space-y-4">
                 {/* Selector de archivo */}
                 <div>
                   <Label htmlFor="videoFile">Archivo de video *</Label>
                   <div className="mt-2">
                     {videoFile ? (
                       <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                         <CheckCircle className="h-4 w-4 text-green-600" />
                         <span className="text-sm text-green-800">
                           {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                         </span>
                         <Button 
                           type="button" 
                           variant="ghost" 
                           size="sm"
                           onClick={() => setVideoFile(undefined)}
                         >
                           <X className="h-3 w-3" />
                         </Button>
                       </div>
                     ) : (
                                                <div 
                           className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                           onDragOver={(e) => {
                             e.preventDefault()
                             e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
                           }}
                           onDragLeave={(e) => {
                             e.preventDefault()
                             e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                           }}
                           onDrop={(e) => {
                             e.preventDefault()
                             e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                             
                             const files = e.dataTransfer.files
                             if (files.length > 0 && files[0].type.startsWith('video/')) {
                               setVideoFile(files[0])
                               if (!title) {
                                 setTitle(files[0].name.replace(/\.[^/.]+$/, ""))
                               }
                             }
                           }}
                         >
                           <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                           <p className="text-sm text-gray-600 mb-2">
                             Arrastra y suelta tu video aquí, o
                           </p>
                         <input
                           id="videoFile"
                           type="file"
                           accept="video/*"
                           onChange={(e) => {
                             const file = e.target.files?.[0]
                             if (file) {
                               setVideoFile(file)
                               // Auto-completar título si no hay uno
                               if (!title) {
                                 setTitle(file.name.replace(/\.[^/.]+$/, "")) // Remover extensión
                               }
                             }
                           }}
                           className="hidden"
                         />
                         <Button 
                           type="button" 
                           variant="outline"
                           onClick={() => document.getElementById('videoFile')?.click()}
                         >
                           Seleccionar archivo
                         </Button>
                         <p className="text-xs text-gray-500 mt-2">
                           Formatos soportados: MP4, AVI, MOV, WMV, FLV
                         </p>
                       </div>
                     )}
                   </div>
                 </div>

                 <div>
                   <Label htmlFor="title">Título del video *</Label>
                   <Input
                     id="title"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Ingresa el título del video"
                     maxLength={100}
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     {title.length}/100 caracteres
                   </p>
                 </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe tu video..."
                    rows={3}
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {description.length}/5000 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="tags">Etiquetas</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Agregar etiqueta"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      Agregar
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                                                 <Badge key={index} variant="outline" className="gap-1">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCategories ? (
                          <SelectItem value="" disabled>Cargando...</SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="privacy">Privacidad</Label>
                    <Select value={privacyStatus} onValueChange={(value: any) => setPrivacyStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4" />
                            Privado
                          </div>
                        </SelectItem>
                        <SelectItem value="unlisted">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            No listado
                          </div>
                        </SelectItem>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Público
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Progreso de subida */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Subiendo video...</span>
                      <span>{uploadProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                                 {/* Error */}
                 {error && (
                   <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                     <AlertCircle className="h-4 w-4 text-red-600" />
                     <span className="text-sm text-red-800">{error}</span>
                   </div>
                 )}

                 {/* Ayuda para archivo */}
                 {!videoFile && (
                   <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <AlertCircle className="h-4 w-4 text-blue-600" />
                     <span className="text-sm text-blue-800">
                       Selecciona un archivo de video para continuar
                     </span>
                   </div>
                 )}

                                 {/* Botones de acción */}
                 <div className="flex gap-2 pt-4">
                   <Button 
                     onClick={handleUpload} 
                     disabled={isUploading || !title.trim() || !videoFile}
                     className="flex-1"
                   >
                    {isUploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Youtube className="h-4 w-4 mr-2" />
                        Subir a YouTube
                      </>
                      )}
                  </Button>
                  <Button variant="outline" onClick={onClose} disabled={isUploading}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Preferencias */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferencias de YouTube
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultPrivacy">Privacidad por defecto</Label>
                <Select 
                  value={userPreferences.defaultPrivacy} 
                  onValueChange={(value: 'private' | 'unlisted' | 'public') => 
                    saveUserPreferences({...userPreferences, defaultPrivacy: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Privado
                      </div>
                    </SelectItem>
                    <SelectItem value="unlisted">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        No listado
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Público
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="defaultTags">Etiquetas por defecto</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Agregar etiqueta por defecto"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDefaultTag()}
                  />
                  <Button type="button" onClick={handleAddDefaultTag} variant="outline">
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userPreferences.defaultTags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveDefaultTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="defaultDescription">Descripción por defecto</Label>
                <Textarea
                  value={userPreferences.defaultDescription}
                  onChange={(e) => saveUserPreferences({
                    ...userPreferences, 
                    defaultDescription: e.target.value
                  })}
                  placeholder="Descripción que se usará por defecto"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoAddTags"
                  checked={userPreferences.autoAddTags}
                  onChange={(e) => saveUserPreferences({
                    ...userPreferences, 
                    autoAddTags: e.target.checked
                  })}
                  className="rounded"
                />
                <Label htmlFor="autoAddTags">
                  Agregar etiquetas por defecto automáticamente
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rememberSettings"
                  checked={userPreferences.rememberSettings}
                  onChange={(e) => saveUserPreferences({
                    ...userPreferences, 
                    rememberSettings: e.target.checked
                  })}
                  className="rounded"
                />
                <Label htmlFor="rememberSettings">
                  Recordar configuración para futuras subidas
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => setShowPreferences(false)} 
                  className="flex-1"
                >
                  Guardar y cerrar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreferences(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
