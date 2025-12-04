import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Play, Pause, Wand2, FileText, Music, Settings, X, Upload, Eye, Check } from 'lucide-react';
import { getBackendUrl } from '../lib/config';

interface VideoEditorProps {
  videoUrl: string;
  clipId: string;
  onSave: (editedVideoUrl: string) => void;
  onCancel: () => void;
}

interface EditorSettings {
  playbackSpeed: number;
  colorFilter: 'none' | 'vintage' | 'bw' | 'saturated' | 'cool' | 'warm';
  rotation: number;
  zoom: number;
  resolution: 'original' | '1080p' | '720p' | '480p';
  bitrate: number;
  stabilization: boolean;
  dynamicZoom: boolean;
  textOverlay: {
    enabled: boolean;
    text: string;
    position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    fontSize: number;
    color: string;
  };
  watermark: {
    enabled: boolean;
    imageUrl?: string;
  };
  backgroundMusic: {
    enabled: boolean;
    audioFile?: File;
    volume: number;
  };
  narration: {
    enabled: boolean;
    audioFile?: File;
    volume: number;
  };
}

export function VideoEditor({ videoUrl, clipId, onSave, onCancel }: VideoEditorProps) {
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedVideoUrl, setEditedVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [settings, setSettings] = useState<EditorSettings>({
    playbackSpeed: 1,
    colorFilter: 'none',
    rotation: 0,
    zoom: 1,
    resolution: 'original',
    bitrate: 5000,
    stabilization: false,
    dynamicZoom: false,
    textOverlay: {
      enabled: false,
      text: '',
      position: 'top-left',
      fontSize: 24,
      color: '#FFFFFF'
    },
    watermark: {
      enabled: false
    },
    backgroundMusic: {
      enabled: false,
      volume: 50
    },
    narration: {
      enabled: false,
      volume: 70
    }
  });

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPreviewPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPreviewPlaying(!isPreviewPlaying);
    }
  };

  const updateSettings = (key: keyof EditorSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedSettings = (key: keyof EditorSettings, nestedKey: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] as any),
        [nestedKey]: value
      }
    }));
  };

  const handleAudioUpload = (type: 'backgroundMusic' | 'narration', file: File) => {
    updateNestedSettings(type, 'audioFile', file);
  };

  const handleWatermarkUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    updateNestedSettings('watermark', 'imageUrl', imageUrl);
  };

  const processVideo = async () => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('clipId', clipId);
      formData.append('settings', JSON.stringify({
        playbackSpeed: settings.playbackSpeed,
        colorFilter: settings.colorFilter,
        rotation: settings.rotation,
        zoom: settings.zoom,
        resolution: settings.resolution,
        bitrate: settings.bitrate,
        stabilization: settings.stabilization,
        dynamicZoom: settings.dynamicZoom,
        textOverlay: settings.textOverlay,
        watermark: settings.watermark
      }));

      if (settings.backgroundMusic.enabled && settings.backgroundMusic.audioFile) {
        formData.append('backgroundMusic', settings.backgroundMusic.audioFile);
        formData.append('backgroundMusicVolume', settings.backgroundMusic.volume.toString());
      }

      if (settings.narration.enabled && settings.narration.audioFile) {
        formData.append('narration', settings.narration.audioFile);
        formData.append('narrationVolume', settings.narration.volume.toString());
      }

      if (settings.watermark.enabled) {
        const watermarkInput = document.getElementById('watermark-upload') as HTMLInputElement;
        if (watermarkInput?.files?.[0]) {
          formData.append('watermark', watermarkInput.files[0]);
        }
      }

      const response = await fetch(getBackendUrl('/recortes/process-edited'), {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error procesando el video');
      }

      const result = await response.json();
      const fullUrl = result.editedVideoUrl.startsWith('http')
        ? result.editedVideoUrl
        : getBackendUrl(result.editedVideoUrl);
      setEditedVideoUrl(fullUrl);
      onSave(result.editedVideoUrl);

    } catch (error) {
      console.error('Error procesando video:', error);
      alert('Error procesando el video: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Editor de Video
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex gap-4 overflow-hidden">
          {/* Panel de controles - izquierda */}
          <div className="w-1/2 overflow-y-auto pr-4 space-y-4">
            <Tabs defaultValue="technical" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="technical" className="flex items-center gap-1 text-xs">
                  <Settings className="h-3 w-3" />
                  Ajustes
                </TabsTrigger>
                <TabsTrigger value="effects" className="flex items-center gap-1 text-xs">
                  <Wand2 className="h-3 w-3" />
                  Efectos
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  Texto
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-1 text-xs">
                  <Music className="h-3 w-3" />
                  Audio
                </TabsTrigger>
              </TabsList>

              {/* Ajustes Técnicos */}
              <TabsContent value="technical" className="space-y-4">
                <div className="space-y-2">
                  <Label>Velocidad de reproducción</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.playbackSpeed]}
                      onValueChange={([value]) => updateSettings('playbackSpeed', value)}
                      min={0.25}
                      max={4}
                      step={0.25}
                      className="flex-1"
                    />
                    <div className="text-sm font-medium w-24">
                      {settings.playbackSpeed}x
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[0.5, 1, 1.5, 2, 3, 4].map(speed => (
                      <Button
                        key={speed}
                        size="sm"
                        variant={settings.playbackSpeed === speed ? 'default' : 'outline'}
                        onClick={() => updateSettings('playbackSpeed', speed)}
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Filtro de color</Label>
                  <Select
                    value={settings.colorFilter}
                    onValueChange={(value: any) => updateSettings('colorFilter', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin filtro</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="bw">Blanco y Negro</SelectItem>
                      <SelectItem value="saturated">Saturado</SelectItem>
                      <SelectItem value="cool">Frío</SelectItem>
                      <SelectItem value="warm">Cálido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rotación: {settings.rotation}°</Label>
                    <Slider
                      value={[settings.rotation]}
                      onValueChange={([value]) => updateSettings('rotation', value)}
                      min={0}
                      max={360}
                      step={90}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {[0, 90, 180, 270].map(angle => (
                        <Button
                          key={angle}
                          size="sm"
                          variant={settings.rotation === angle ? 'default' : 'outline'}
                          onClick={() => updateSettings('rotation', angle)}
                        >
                          {angle}°
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Zoom: {settings.zoom.toFixed(2)}x</Label>
                    <Slider
                      value={[settings.zoom]}
                      onValueChange={([value]) => updateSettings('zoom', value)}
                      min={1}
                      max={3}
                      step={0.1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Resolución</Label>
                    <Select
                      value={settings.resolution}
                      onValueChange={(value: any) => updateSettings('resolution', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Original</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="480p">480p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bitrate: {settings.bitrate} kbps</Label>
                    <Slider
                      value={[settings.bitrate]}
                      onValueChange={([value]) => updateSettings('bitrate', value)}
                      min={1000}
                      max={15000}
                      step={500}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Efectos técnicos</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estabilización</span>
                      <Switch
                        checked={settings.stabilization}
                        onCheckedChange={(checked) => updateSettings('stabilization', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Zoom dinámico</span>
                      <Switch
                        checked={settings.dynamicZoom}
                        onCheckedChange={(checked) => updateSettings('dynamicZoom', checked)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Texto Overlay */}
              <TabsContent value="text" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Activar texto overlay</Label>
                  <Switch
                    checked={settings.textOverlay.enabled}
                    onCheckedChange={(checked) => updateNestedSettings('textOverlay', 'enabled', checked)}
                  />
                </div>

                {settings.textOverlay.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Texto</Label>
                      <Input
                        value={settings.textOverlay.text}
                        onChange={(e) => updateNestedSettings('textOverlay', 'text', e.target.value)}
                        placeholder="Ej: Gol de Messi"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Posición</Label>
                      <Select
                        value={settings.textOverlay.position}
                        onValueChange={(value: any) => updateNestedSettings('textOverlay', 'position', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Arriba Izquierda</SelectItem>
                          <SelectItem value="top-center">Arriba Centro</SelectItem>
                          <SelectItem value="top-right">Arriba Derecha</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="bottom-left">Abajo Izquierda</SelectItem>
                          <SelectItem value="bottom-center">Abajo Centro</SelectItem>
                          <SelectItem value="bottom-right">Abajo Derecha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tamaño de fuente: {settings.textOverlay.fontSize}px</Label>
                        <Slider
                          value={[settings.textOverlay.fontSize]}
                          onValueChange={([value]) => updateNestedSettings('textOverlay', 'fontSize', value)}
                          min={12}
                          max={72}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Color</Label>
                        <Input
                          type="color"
                          value={settings.textOverlay.color}
                          onChange={(e) => updateNestedSettings('textOverlay', 'color', e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Marca de agua</Label>
                    <Switch
                      checked={settings.watermark.enabled}
                      onCheckedChange={(checked) => updateNestedSettings('watermark', 'enabled', checked)}
                    />
                  </div>

                  {settings.watermark.enabled && (
                    <div className="space-y-2">
                      <Input
                        id="watermark-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleWatermarkUpload(file);
                        }}
                        className="cursor-pointer"
                      />
                      {settings.watermark.imageUrl && (
                        <div className="text-sm text-green-600">
                          ✅ Imagen cargada
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Audio */}
              <TabsContent value="audio" className="space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Música de fondo</Label>
                    <Switch
                      checked={settings.backgroundMusic.enabled}
                      onCheckedChange={(checked) => updateNestedSettings('backgroundMusic', 'enabled', checked)}
                    />
                  </div>

                  {settings.backgroundMusic.enabled && (
                    <>
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAudioUpload('backgroundMusic', file);
                        }}
                        className="cursor-pointer"
                      />
                      {settings.backgroundMusic.audioFile && (
                        <div className="text-sm text-green-600">
                          ✅ Audio cargado
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Volumen: {settings.backgroundMusic.volume}%</Label>
                        <Slider
                          value={[settings.backgroundMusic.volume]}
                          onValueChange={([value]) => updateNestedSettings('backgroundMusic', 'volume', value)}
                          min={0}
                          max={100}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Narración</Label>
                    <Switch
                      checked={settings.narration.enabled}
                      onCheckedChange={(checked) => updateNestedSettings('narration', 'enabled', checked)}
                    />
                  </div>

                  {settings.narration.enabled && (
                    <>
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAudioUpload('narration', file);
                        }}
                        className="cursor-pointer"
                      />
                      {settings.narration.audioFile && (
                        <div className="text-sm text-green-600">
                          ✅ Audio cargado
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Volumen: {settings.narration.volume}%</Label>
                        <Slider
                          value={[settings.narration.volume]}
                          onValueChange={([value]) => updateNestedSettings('narration', 'volume', value)}
                          min={0}
                          max={100}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Efectos visuales */}
              <TabsContent value="effects" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p>Efectos visuales adicionales (transiciones, etc.)</p>
                  <p className="text-sm mt-2">Próximamente...</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              {editedVideoUrl && (
                <div className="flex items-center gap-2 mr-auto">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Video editado exitosamente</span>
                </div>
              )}
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              {editedVideoUrl && (
                <Button
                  variant="default"
                  onClick={() => window.open(editedVideoUrl, '_blank')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver video editado
                </Button>
              )}
              <Button onClick={processVideo} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Aplicar edición
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Panel de preview - derecha */}
          <div className="w-1/2 flex flex-col">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex-1 max-h-[70vh]">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full"
                controls={false}
                onPlay={() => setIsPreviewPlaying(true)}
                onPause={() => setIsPreviewPlaying(false)}
              />

              {/* Texto overlay en preview */}
              {settings.textOverlay.enabled && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    color: settings.textOverlay.color,
                    fontSize: `${settings.textOverlay.fontSize}px`,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    ...getPositionStyles(settings.textOverlay.position)
                  }}
                >
                  {settings.textOverlay.text || 'Tu texto aquí'}
                </div>
              )}

              {/* Controles de preview */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handlePlayPause}
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  {isPreviewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPositionStyles(position: string) {
  const positions: Record<string, React.CSSProperties> = {
    'top-left': { top: '20px', left: '20px' },
    'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: '20px', right: '20px' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: '20px', right: '20px' }
  };
  return positions[position] || positions['top-left'];
}

