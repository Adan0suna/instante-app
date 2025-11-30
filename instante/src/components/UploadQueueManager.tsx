"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { useUploadQueue } from "../hooks/useUploadQueue"
import { Upload, Play, Pause, RefreshCw, X, CheckCircle, AlertTriangle } from "lucide-react"

interface UploadQueueManagerProps {
  className?: string;
}

export function UploadQueueManager({ className = '' }: UploadQueueManagerProps) {
  const { 
    pendingUploads, 
    isProcessing, 
    processQueue, 
    retryFailedUploads, 
    cancelUpload, 
    clearFailed,
    clearCompleted 
  } = useUploadQueue()
  
  const [showDetails, setShowDetails] = useState(false)

  if (pendingUploads.length === 0) {
    return null
  }

  const pendingCount = pendingUploads.filter(u => u.status === 'pending').length
  const failedCount = pendingUploads.filter(u => u.status === 'failed').length
  const completedCount = pendingUploads.filter(u => u.status === 'completed').length

  return (
    <Card className={`bg-gradient-to-r from-green-50 to-yellow-50 border-green-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Gestión de Subidas
            </CardTitle>
            <CardDescription className="text-green-700">
              {pendingCount} pendientes • {failedCount} fallidas • {completedCount} completadas
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              {showDetails ? 'Ocultar' : 'Detalles'}
            </Button>
            <Button
              size="sm"
              onClick={() => processQueue()}
              disabled={isProcessing}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {isProcessing ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Procesando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Subir Ahora
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showDetails && (
        <CardContent>
          <div className="space-y-3">
            {/* Lista de subidas */}
            {pendingUploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {upload.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {upload.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {upload.status === 'pending' && <Upload className="h-4 w-4 text-green-700" />}
                    {upload.status === 'processing' && <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{upload.matchTitle}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round((upload.file.size / 1024 / 1024) * 100) / 100} MB • 
                      {new Date(upload.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={
                      upload.status === 'completed' ? 'border-green-300 text-green-700' :
                      upload.status === 'failed' ? 'border-red-300 text-red-700' :
                      upload.status === 'processing' ? 'border-yellow-300 text-yellow-700' :
                      'border-green-300 text-green-700'
                    }
                  >
                    {upload.status}
                  </Badge>
                  
                  {upload.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelUpload(upload.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {upload.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => retryFailedUploads()}
                      className="text-green-700 hover:text-green-800 hover:bg-green-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Progreso general */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Procesando subidas...</span>
                  <span>{Math.round((completedCount / pendingUploads.length) * 100)}%</span>
                </div>
                <Progress 
                  value={(completedCount / pendingUploads.length) * 100} 
                  className="h-2"
                />
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              {failedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => retryFailedUploads()}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar Fallidas ({failedCount})
                </Button>
              )}
              
              {completedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clearCompleted()}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Limpiar Completadas ({completedCount})
                </Button>
              )}
              
              {failedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clearFailed()}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar Fallidas ({failedCount})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

