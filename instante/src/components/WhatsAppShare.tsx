import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Progress } from './ui/progress';
import { Alert } from './ui/alert';
import { MessageCircle, Link, FileVideo, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface WhatsAppShareProps {
  videoUrl: string;
  videoTitle?: string;
  videoSize?: number; // tamaño en bytes
  onClose: () => void;
  onShare?: () => void;
}

const WHATSAPP_MAX_SIZE = 16 * 1024 * 1024; // 16MB en bytes

export function WhatsAppShare({ videoUrl, videoTitle, videoSize, onClose, onShare }: WhatsAppShareProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [shareMethod, setShareMethod] = useState<'link' | 'video'>('link');
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [compressedVideoUrl, setCompressedVideoUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Determinar si el video necesita compresión
  const needsCompression = videoSize ? videoSize > WHATSAPP_MAX_SIZE : true;

  useEffect(() => {
    if (!needsCompression && shareMethod === 'video') {
      // Si el video ya es pequeño, puede compartirse directamente
      setCompressedVideoUrl(videoUrl);
    }
  }, [needsCompression, shareMethod, videoUrl]);

  const handleCompressForWhatsApp = async () => {
    setCompressing(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Llamar al backend para comprimir
      const response = await fetch('http://localhost:3001/whatsapp/compress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          targetSize: WHATSAPP_MAX_SIZE, // 16MB
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Error al comprimir el video');
      }

      const result = await response.json();
      const finalUrl = result.compressedUrl 
        ? (result.compressedUrl.startsWith('http') ? result.compressedUrl : `http://localhost:3001${result.compressedUrl}`)
        : videoUrl;
      
      setCompressedVideoUrl(finalUrl);
      setSuccess(true);
      
      if (onShare) {
        onShare();
      }

      // Esperar un momento y luego abrir WhatsApp
      setTimeout(() => {
        shareToWhatsApp(finalUrl, true);
        setCompressing(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al comprimir el video');
      setCompressing(false);
      setProgress(0);
    }
  };

  const shareToWhatsApp = (urlToShare: string, isVideo: boolean) => {
    const message = videoTitle 
      ? `🎬 ${videoTitle}\n\n${urlToShare}`
      : `🎬 Video compartido desde Instante\n\n${urlToShare}`;

    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crear URL de WhatsApp
    // Para compartir video: usamos el protocolo whatsapp:// o https://wa.me/?text=
    // Nota: WhatsApp Web/Desktop no puede recibir archivos directamente desde la web
    // Solo podemos compartir el enlace
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    setIsOpen(false);
    onClose();
  };

  const handleShareLink = () => {
    shareToWhatsApp(videoUrl, false);
  };

  const handleShareVideo = async () => {
    if (compressedVideoUrl) {
      // Ya está comprimido, compartir directamente
      shareToWhatsApp(compressedVideoUrl, true);
    } else if (needsCompression) {
      // Necesita compresión primero
      await handleCompressForWhatsApp();
    } else {
      // No necesita compresión, compartir directamente
      shareToWhatsApp(videoUrl, true);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Desconocido';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !compressing) {
        setIsOpen(false);
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Compartir por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Elige cómo quieres compartir este video
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del video */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <p><strong>Título:</strong> {videoTitle || 'Sin título'}</p>
              {videoSize && (
                <p><strong>Tamaño:</strong> {formatFileSize(videoSize)}</p>
              )}
              {needsCompression && videoSize && (
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠️ El video excede 16MB. Se comprimirá para WhatsApp.
                </p>
              )}
            </div>
          </div>

          {/* Opciones de compartir */}
          <div className="space-y-2">
            <Button
              variant={shareMethod === 'link' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setShareMethod('link')}
              disabled={compressing}
            >
              <Link className="h-4 w-4 mr-2" />
              Compartir enlace
              <span className="ml-auto text-xs text-muted-foreground">
                Rápido, no comprime
              </span>
            </Button>

            <Button
              variant={shareMethod === 'video' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setShareMethod('video')}
              disabled={compressing}
            >
              <FileVideo className="h-4 w-4 mr-2" />
              Compartir video comprimido
              <span className="ml-auto text-xs text-muted-foreground">
                {needsCompression && videoSize ? 'Requiere compresión' : 'Listo para compartir'}
              </span>
            </Button>
          </div>

          {/* Progreso de compresión */}
          {compressing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Comprimiendo video...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                Esto puede tardar unos momentos dependiendo del tamaño del video
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </Alert>
          )}

          {/* Éxito */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-green-800">Video comprimido exitosamente. Abriendo WhatsApp...</p>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                onClose();
              }}
              disabled={compressing}
            >
              Cancelar
            </Button>
            <Button
              onClick={shareMethod === 'link' ? handleShareLink : handleShareVideo}
              disabled={compressing || (shareMethod === 'video' && !compressedVideoUrl && !needsCompression)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {compressing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Comprimiendo...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Compartir en WhatsApp
                </>
              )}
            </Button>
          </div>

          {/* Nota importante */}
          <p className="text-xs text-muted-foreground text-center">
            💡 Nota: WhatsApp tiene un límite de 16MB para videos. Si el video es más grande, se comprimirá automáticamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

