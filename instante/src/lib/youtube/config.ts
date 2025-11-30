export const YOUTUBE_CONFIG = {
  // Estas claves se configurarán en Google Cloud Console
  API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY || '',
  CLIENT_ID: import.meta.env.VITE_YOUTUBE_CLIENT_ID || '',
  CLIENT_SECRET: import.meta.env.VITE_YOUTUBE_CLIENT_SECRET || '',
  
  // URLs de autenticación
  AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  
  // Scopes necesarios para YouTube
  SCOPES: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ].join(' '),
  
  // Redirect URI (debe coincidir con Google Cloud Console)
  REDIRECT_URI: import.meta.env.VITE_YOUTUBE_REDIRECT_URI || 'http://localhost:3000/youtube/callback'
}

export const YOUTUBE_API_ENDPOINTS = {
  UPLOAD: 'https://www.googleapis.com/upload/youtube/v3/videos',
  VIDEOS: 'https://www.googleapis.com/youtube/v3/videos',
  CHANNELS: 'https://www.googleapis.com/youtube/v3/channels',
  PLAYLISTS: 'https://www.googleapis.com/youtube/v3/playlists'
}
