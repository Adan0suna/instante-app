import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, Video, X, Play } from 'lucide-react';
import { useTempVideo } from '../hooks/useTempVideo';

interface TempVideoUploaderProps {
  matchId: number;
  onVideoUploaded: (tempVideoId: string) => void;
  onCancel: () => void;
}

export function TempVideoUploader({ matchId, onVideoUploaded, onCancel }: TempVideoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tempVideo, loading, error, saveTempVideo } = useTempVideo();

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '')); // Usar nombre del archivo sin extensión
      }
    } else {
      alert('Por favor selecciona un archivo de video válido');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      alert('Por favor selecciona un archivo y ingresa un título');
      return;
    }

    try {
      const result = await saveTempVideo(selectedFile, matchId, title);
      onVideoUploaded(result.tempVideoId);
    } catch (error) {
      console.error('Error subiendo video temporal:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Subir Video Temporal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de drag & drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            Arrastra tu video aquí o haz clic para seleccionar
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Formatos soportados: MP4, AVI, MOV, MKV
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Seleccionar Video
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </div>

        {/* Archivo seleccionado */}
        {selectedFile && (
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Título del video */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Título del video</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Partido Barcelona vs Real Madrid"
            className="w-full"
          />
        </div>

        {/* Información */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Video Temporal
            </span>
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>• El video se guardará temporalmente en el servidor</p>
            <p>• Podrás crear clips desde este video</p>
            <p>• El video se eliminará automáticamente después de procesar</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Error: {error}
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !title.trim() || loading}
          >
            {loading ? 'Subiendo...' : 'Subir Video'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


