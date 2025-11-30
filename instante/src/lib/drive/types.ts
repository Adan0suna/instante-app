export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  webContentLink: string
  size: string
  createdTime: string
}

export interface RecorteRequest {
  videoUrl: string
  startTime: number
  endTime: number
  outputFormat: 'mp4' | 'webm'
}

export interface RecorteResponse {
  id: string
  status: 'processing' | 'completed' | 'failed'
  outputUrl?: string
  error?: string
} 