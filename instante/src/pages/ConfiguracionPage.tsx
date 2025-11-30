"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { SidebarNav } from "../components/SidebarNav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"
import { Switch } from "../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { 
  Settings, 
  Database, 
  Monitor, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Youtube, 
  HardDrive, 
  Globe, 
  Palette, 
  Bell, 
  Shield, 
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useNavigate } from "react-router-dom"

export default function ConfiguracionPage() {
  const navigate = useNavigate()
  
  // Estados para la configuración
  const [settings, setSettings] = useState({
    // Configuración de grabación
    recordingQuality: '1080p',
    recordingFormat: 'mp4',
    autoSave: true,
    compressionLevel: 'medium',
    
    // Configuración de integraciones
    youtubeConnected: false,
    driveConnected: false,
    
    // Preferencias generales
    language: 'es',
    theme: 'light',
    notifications: true,
    autoUpload: false,
    
    // Configuración avanzada
    storagePath: '',
    maxStorageSize: '50GB',
    backupEnabled: true
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [hasChanges, setHasChanges] = useState(false)

  // Cargar configuración guardada
  useEffect(() => {
    const savedSettings = localStorage.getItem('instante-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Detectar cambios
  useEffect(() => {
    const savedSettings = localStorage.getItem('instante-settings')
    if (savedSettings) {
      const saved = JSON.parse(savedSettings)
      setHasChanges(JSON.stringify(saved) !== JSON.stringify(settings))
    } else {
      setHasChanges(true)
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      localStorage.setItem('instante-settings', JSON.stringify(settings))
      setSaveStatus('success')
      setHasChanges(false)
      
      // Resetear estado después de 2 segundos
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      localStorage.removeItem('instante-settings')
      setSettings({
        recordingQuality: '1080p',
        recordingFormat: 'mp4',
        autoSave: true,
        compressionLevel: 'medium',
        youtubeConnected: false,
        driveConnected: false,
        language: 'es',
        theme: 'light',
        notifications: true,
        autoUpload: false,
        storagePath: '',
        maxStorageSize: '50GB',
        backupEnabled: true
      })
    }
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = 'instante-settings.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string)
          setSettings(imported)
        } catch (error) {
          alert('Error al importar la configuración. Verifica que el archivo sea válido.')
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="flex-1">
      <div className="flex-1">
        {/* Header mejorado */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-500 bg-clip-text text-transparent">
                Configuración
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Personaliza tu experiencia con Instante
              </p>
            </div>
            
            {/* Acciones de guardado */}
            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center gap-2 text-orange-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Cambios sin guardar</span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Restaurar
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Guardado</span>
                </div>
              )}
              
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Tabs defaultValue="grabacion" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
              <TabsTrigger 
                value="grabacion" 
                className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all duration-200 hover:bg-green-50 rounded-md"
              >
                <Monitor className="h-4 w-4" />
                Grabación
              </TabsTrigger>
              <TabsTrigger 
                value="integraciones" 
                className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all duration-200 hover:bg-green-50 rounded-md"
              >
                <Database className="h-4 w-4" />
                Integraciones
              </TabsTrigger>
              
              <TabsTrigger 
                value="avanzado" 
                className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all duration-200 hover:bg-green-50 rounded-md"
              >
                <Shield className="h-4 w-4" />
                Avanzado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grabacion" className="mt-6 space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-green-700" />
                    Configuración de Grabación
                  </CardTitle>
                  <CardDescription>Personaliza la calidad y formato de tus grabaciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Calidad de grabación */}
                  <div className="p-6 border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-yellow-50 dark:from-green-950/20 dark:to-yellow-900/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Monitor className="h-5 w-5 text-green-700" />
                          </div>
                          <Label className="text-lg font-semibold">Calidad de grabación</Label>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 ml-11">Selecciona la calidad de tus grabaciones</p>
                      </div>
                      <Select 
                        value={settings.recordingQuality}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, recordingQuality: value }))}
                      >
                        <SelectTrigger className="w-[200px] border-green-300 focus:border-green-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p HD</SelectItem>
                          <SelectItem value="1080p">1080p Full HD</SelectItem>
                          <SelectItem value="4k">4K Ultra HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Formato de archivo */}
                  <div className="p-6 border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Settings className="h-5 w-5 text-green-600" />
                          </div>
                          <Label className="text-lg font-semibold">Formato de archivo</Label>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 ml-11">Formato predeterminado para las grabaciones</p>
                      </div>
                      <Select 
                        value={settings.recordingFormat}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, recordingFormat: value }))}
                      >
                        <SelectTrigger className="w-[200px] border-green-300 focus:border-green-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mp4">MP4 (Recomendado)</SelectItem>
                          <SelectItem value="mov">MOV</SelectItem>
                          <SelectItem value="avi">AVI</SelectItem>
                          <SelectItem value="webm">WebM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Nivel de compresión */}
                  <div className="p-6 border border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Settings className="h-5 w-5 text-yellow-600" />
                          </div>
                          <Label className="text-lg font-semibold">Nivel de compresión</Label>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 ml-11">Balance entre calidad y tamaño de archivo</p>
                      </div>
                      <Select 
                        value={settings.compressionLevel}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, compressionLevel: value }))}
                      >
                        <SelectTrigger className="w-[200px] border-purple-300 focus:border-purple-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja (Mejor calidad)</SelectItem>
                          <SelectItem value="medium">Media (Balanceado)</SelectItem>
                          <SelectItem value="high">Alta (Menor tamaño)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Auto-guardado */}
                  <div className="p-6 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <Save className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <Label className="text-lg font-semibold">Auto-guardado</Label>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Guardar automáticamente las grabaciones</p>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={settings.autoSave}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSave: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integraciones" className="mt-6 space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-700" />
                    Integraciones
                  </CardTitle>
                  <CardDescription>Conecta Instante con otros servicios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* YouTube */}
                  <div className="p-6 border border-red-200 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                          <Youtube className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">YouTube</h4>
                          <p className="text-gray-600 dark:text-gray-400">Sube videos directamente a tu canal</p>
                          <div className="flex items-center gap-2 mt-2">
                            {settings.youtubeConnected ? (
                              <span className="text-green-600 text-sm flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Conectado
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                No conectado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                        onClick={() => navigate('/youtube')}
                      >
                        {settings.youtubeConnected ? 'Gestionar' : 'Conectar'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Google Drive */}
                  <div className="p-6 border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-yellow-50 dark:from-green-950/20 dark:to-yellow-900/20 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                          <HardDrive className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">Google Drive</h4>
                          <p className="text-gray-600 dark:text-gray-400">Guarda videos en la nube</p>
                          <div className="flex items-center gap-2 mt-2">
                            {settings.driveConnected ? (
                              <span className="text-green-600 text-sm flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Conectado
                              </span>
                            ) : (
                              <span className="text-gray-500 text-sm flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                No conectado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="bg-green-700 hover:bg-green-800 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                        onClick={() => navigate('/conectar-drive')}
                      >
                        {settings.driveConnected ? 'Gestionar' : 'Conectar'}
                      </Button>
                    </div>
                  </div>

                  {/* Auto-upload */}
                  <div className="p-6 border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Upload className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <Label className="text-lg font-semibold">Auto-subida</Label>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Subir automáticamente a servicios conectados</p>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={settings.autoUpload}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoUpload: checked }))}
                        disabled={!settings.youtubeConnected && !settings.driveConnected}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferencias eliminado por solicitud */}

            <TabsContent value="avanzado" className="mt-6 space-y-6">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-700" />
                    Configuración Avanzada
                  </CardTitle>
                  <CardDescription>Opciones avanzadas y gestión de configuración</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ruta de almacenamiento */}
                  <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-900/20">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <HardDrive className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <Label className="text-lg font-semibold">Ruta de almacenamiento</Label>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Directorio donde se guardan los archivos</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={settings.storagePath}
                          onChange={(e) => setSettings(prev => ({ ...prev, storagePath: e.target.value }))}
                          placeholder="C:\Users\Usuario\Videos\Instante"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tamaño máximo de almacenamiento */}
                  <div className="p-6 border border-yellow-200 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <HardDrive className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <Label className="text-lg font-semibold">Tamaño máximo</Label>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Límite de almacenamiento local</p>
                          </div>
                        </div>
                      </div>
                      <Select 
                        value={settings.maxStorageSize}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, maxStorageSize: value }))}
                      >
                        <SelectTrigger className="w-[150px] border-yellow-300 focus:border-yellow-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10GB">10 GB</SelectItem>
                          <SelectItem value="25GB">25 GB</SelectItem>
                          <SelectItem value="50GB">50 GB</SelectItem>
                          <SelectItem value="100GB">100 GB</SelectItem>
                          <SelectItem value="unlimited">Ilimitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Backup automático */}
                  <div className="p-6 border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <Label className="text-lg font-semibold">Backup automático</Label>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Crear copias de seguridad automáticamente</p>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={settings.backupEnabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, backupEnabled: checked }))}
                      />
                    </div>
                  </div>

                  {/* Importar/Exportar configuración */}
                  <div className="p-6 border border-indigo-200 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                          <Settings className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <Label className="text-lg font-semibold">Gestión de configuración</Label>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Importar o exportar tu configuración</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleExportSettings}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                        <div className="relative">
                          <input
                            type="file"
                            id="import-settings"
                            className="hidden"
                            accept=".json"
                            onChange={handleImportSettings}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('import-settings')?.click()}
                            className="flex-1"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Importar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        
        <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
          © 2024 Instante. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
} 