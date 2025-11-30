import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { oauth2Client } from '../config/google.config';
import { google } from 'googleapis';

@Controller('google-drive')
export class GoogleDriveController {
  @Get('auth-url')
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
    
    return { authUrl };
  }

  @Get('oauth-callback')
  async handleOAuthCallback(@Res() res: Response) {
    try {
      const { code } = res.req.query;
      
      if (!code) {
        return res.status(HttpStatus.BAD_REQUEST).json({ 
          error: 'Código de autorización no proporcionado' 
        });
      }

      // Intercambiar el código por tokens
      const { tokens } = await oauth2Client.getToken(code as string);
      
      console.log('🔑 Tokens obtenidos:', {
        access_token: tokens.access_token ? '✅ Presente' : '❌ Ausente',
        refresh_token: tokens.refresh_token ? '✅ Presente' : '❌ Ausente',
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'
      });

      // Guardar tokens en variables de entorno (en producción, usar base de datos)
      process.env.GOOGLE_ACCESS_TOKEN = tokens.access_token;
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;

      // Configurar el cliente OAuth2 con los tokens
      oauth2Client.setCredentials(tokens);

      // Redirigir al frontend con los tokens en la URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/conectar-drive?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}&expires_in=${tokens.expiry_date}&token_type=Bearer`;

      return res.redirect(redirectUrl);

    } catch (error) {
      console.error('❌ Error en OAuth callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorUrl = `${frontendUrl}/conectar-drive?error=authentication_failed`;
      return res.redirect(errorUrl);
    }
  }

  @Post('set-tokens')
  setTokens(@Body() body: { access_token: string; refresh_token: string }) {
    try {
      const { access_token, refresh_token } = body;
      
      // Guardar tokens en variables de entorno
      process.env.GOOGLE_ACCESS_TOKEN = access_token;
      process.env.GOOGLE_REFRESH_TOKEN = refresh_token;

      // Configurar el cliente OAuth2
      oauth2Client.setCredentials({
        access_token,
        refresh_token
      });

      console.log('🔑 Tokens configurados manualmente');

      return {
        message: 'Tokens configurados exitosamente',
        status: 'ready'
      };
    } catch (error) {
      console.error('❌ Error al configurar tokens:', error);
      throw error;
    }
  }

  @Post('set-tokens-from-frontend')
  setTokensFromFrontend(@Body() body: { tokens: any }) {
    try {
      const { tokens } = body;
      
      if (!tokens || !tokens.access_token) {
        throw new Error('Tokens no proporcionados');
      }

      // Guardar tokens en variables de entorno
      process.env.GOOGLE_ACCESS_TOKEN = tokens.access_token;
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;

      // Configurar el cliente OAuth2
      oauth2Client.setCredentials(tokens);

      console.log('🔑 Tokens configurados desde frontend');

      return {
        message: 'Tokens configurados exitosamente desde frontend',
        status: 'ready'
      };
    } catch (error) {
      console.error('❌ Error al configurar tokens desde frontend:', error);
      throw error;
    }
  }

  @Get('test-connection')
  async testConnection() {
    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      // Intentar listar archivos para verificar la conexión
      const response = await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)',
      });

      return {
        message: 'Conexión exitosa con Google Drive',
        filesFound: response.data.files?.length || 0,
        status: 'connected'
      };
    } catch (error) {
      console.error('❌ Error al probar conexión con Google Drive:', error);
      return {
        message: 'Error de conexión con Google Drive',
        error: error.message,
        status: 'error'
      };
    }
  }

  @Get('status')
  getStatus() {
    const hasAccessToken = !!process.env.GOOGLE_ACCESS_TOKEN;
    const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;
    
    return {
      hasAccessToken,
      hasRefreshToken,
      isConfigured: hasAccessToken && hasRefreshToken,
      message: hasAccessToken && hasRefreshToken 
        ? 'Google Drive API configurado correctamente' 
        : 'Google Drive API no configurado'
    };
  }
} 

