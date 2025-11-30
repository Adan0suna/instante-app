import { google } from 'googleapis'
import { envConfig } from './env.config'

export const oauth2Client = new google.auth.OAuth2(
  envConfig.google.clientId,
  envConfig.google.clientSecret,
  envConfig.google.redirectUri
)

export function getGoogleAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ]
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  })
} 