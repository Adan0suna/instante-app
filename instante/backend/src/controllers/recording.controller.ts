import { Controller, Post, Body, Param, Get, Delete, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { RecordingService } from '../services/recording.service';
import { Recording } from '../models/recording.entity';
import { Highlight } from '../models/highlight.entity';
import { getGoogleAuthUrl, oauth2Client } from '../config/google.config';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { StorageService } from '../providers/storage/storage.service';
import { StorageProviderType } from '../providers/storage/storage.service';

@Controller('recordings')
export class RecordingController {
  constructor(
    private readonly recordingService: RecordingService,
    private readonly storageService: StorageService,
  ) { }

  @Post()
  async startRecording(@Body('title') title: string): Promise<Recording> {
    return this.recordingService.startRecording(title);
  }

  @Post(':id/stop')
  async stopRecording(@Param('id') id: number): Promise<Recording> {
    return this.recordingService.stopRecording(id);
  }

  @Post(':id/highlights')
  async addHighlight(
    @Param('id') recordingId: number,
    @Body() highlightData: Partial<Highlight>,
  ): Promise<Highlight> {
    return this.recordingService.addHighlight(recordingId, highlightData);
  }

  @Post('highlights/:id/generate-clip')
  async generateClip(@Param('id') highlightId: number): Promise<string> {
    return this.recordingService.generateClip(highlightId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('video', { dest: './uploads' }))
  async uploadToDrive(
    @UploadedFile() file: any,
    @Body('tokens') tokens: string,
    @Body('storageProvider') storageProvider: StorageProviderType = 'google-drive',
    @Res() res: Response,
    @Body('bitrate') bitrate?: string,
    @Body('resolution') resolution?: string,
    @Body('folderId') folderId?: string,
    @Body('title') title?: string,
    @Body('matchId') matchId?: string,
    @Body('videoType') videoType?: string,
    // Para MEGA
    @Body('megaEmail') megaEmail?: string,
    @Body('megaPassword') megaPassword?: string,
  ) {
    try {
      console.log('--- SUBIDA DE VIDEO ---');
      console.log('file:', file);
      console.log('storageProvider:', storageProvider);
      console.log('tokens:', tokens);
      console.log('bitrate:', bitrate);
      console.log('resolution:', resolution);
      console.log('folderId:', folderId);
      if (!file) {
        console.error('No se recibió archivo');
        return res.status(400).json({ error: 'No se recibió archivo' });
      }
      if (!file.path || typeof file.path !== 'string') {
        console.error('file.path no es un string válido:', file.path);
        return res.status(400).json({ error: 'file.path no es válido', value: file.path });
      }

      // Preparar credenciales según el proveedor
      let credentials: any;
      if (storageProvider === 'google-drive') {
        console.log('🔍 Verificando tokens para Google Drive...');
        console.log('🔍 Tokens recibidos (tipo):', typeof tokens);
        console.log('🔍 Tokens recibidos (longitud):', tokens?.length);

        if (!tokens) {
          console.error('❌ No se recibieron tokens para Google Drive');
          return res.status(400).json({ error: 'No se recibieron tokens para Google Drive. Por favor, conecta tu cuenta de Google Drive primero.' });
        }

        try {
          credentials = JSON.parse(tokens);
          console.log('✅ Tokens parseados correctamente:', {
            hasAccessToken: !!credentials.access_token,
            hasRefreshToken: !!credentials.refresh_token,
            accessTokenLength: credentials.access_token?.length,
          });

          // Validar que los tokens tengan el formato correcto
          if (!credentials.access_token) {
            console.error('❌ access_token no encontrado en los tokens');
            return res.status(400).json({ error: 'Tokens inválidos: falta access_token' });
          }
        } catch (parseError) {
          console.error('❌ Error al parsear tokens:', parseError);
          console.error('❌ Tokens recibidos:', tokens?.substring(0, 100) + '...');
          return res.status(400).json({ error: 'Error al parsear tokens. Verifica que estén en formato JSON válido.', details: parseError });
        }
      } else if (storageProvider === 'mega') {
        if (!megaEmail || !megaPassword) {
          console.error('No se recibieron credenciales de MEGA');
          return res.status(400).json({ error: 'Se requieren email y password para MEGA' });
        }
        credentials = {
          email: megaEmail,
          password: megaPassword,
        };
      } else {
        return res.status(400).json({ error: `Proveedor de almacenamiento '${storageProvider}' no soportado` });
      }

      console.log('📤 Llamando a storageService.compressAndUpload...');
      console.log('📤 Parámetros:', {
        filePath: file.path,
        provider: storageProvider,
        hasCredentials: !!credentials,
        options: { bitrate, resolution, folderId, title }
      });

      const uploadResult = await this.storageService.compressAndUpload(
        storageProvider,
        file.path,
        credentials,
        { bitrate, resolution, folderId, title }
      );

      // Mapear resultado a formato compatible con el código existente
      const driveUrls = {
        viewUrl: uploadResult.viewUrl,
        previewUrl: uploadResult.previewUrl || uploadResult.viewUrl,
        embedUrl: uploadResult.embedUrl || uploadResult.viewUrl,
        fileId: uploadResult.fileId,
      };

      // Crear video temporal automáticamente
      const tempVideoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempVideoPath = `/temp-video/${tempVideoId}`;

      // NOTA: El archivo original ya fue eliminado por google-drive.provider.ts después de subirlo
      console.log('✅ Video subido a Google Drive, ID temporal:', tempVideoId);

      // Devolver información del video para que el frontend la guarde en la base de datos
      return res.json({
        url: driveUrls.embedUrl, // Usar la URL de embed por defecto
        driveUrl: driveUrls.embedUrl,
        viewUrl: driveUrls.viewUrl,
        previewUrl: driveUrls.previewUrl,
        embedUrl: driveUrls.embedUrl,
        fileId: driveUrls.fileId,
        matchId: matchId ? parseInt(matchId) : null,
        videoType: videoType || 'Principal',
        tempVideoId, // ID del video temporal creado automáticamente
        tempVideoPath // Ruta del video temporal
      });
    } catch (error) {
      console.error('Error general en uploadToDrive:', error);
      return res.status(400).json({ error: 'Error al subir el video a Google Drive', details: error });
    }
  }

  @Post('upload-recording')
  @UseInterceptors(FileInterceptor('video', { dest: './uploads' }))
  async uploadRecordingToDrive(
    @UploadedFile() file: any,
    @Body('tokens') tokens: string,
    @Body('title') title: string,
    @Res() res: Response,
  ) {
    try {
      console.log('--- SUBIDA DE GRABACIÓN AUTOMÁTICA ---');
      console.log('file:', file);
      console.log('title:', title);
      console.log('tokens:', tokens);

      if (!file) {
        console.error('No se recibió archivo');
        return res.status(400).json({ error: 'No se recibió archivo' });
      }
      if (!tokens) {
        console.error('No se recibieron tokens');
        return res.status(400).json({ error: 'No se recibieron tokens' });
      }
      if (!title) {
        console.error('No se recibió título');
        return res.status(400).json({ error: 'No se recibió título' });
      }

      let userTokens;
      try {
        userTokens = JSON.parse(tokens);
      } catch (parseError) {
        console.error('Error al parsear tokens:', parseError);
        return res.status(400).json({ error: 'Error al parsear tokens', details: parseError });
      }

      if (!file.path || typeof file.path !== 'string') {
        console.error('file.path no es un string válido:', file.path);
        return res.status(400).json({ error: 'file.path no es válido', value: file.path });
      }

      // Usar el título del partido como nombre del archivo
      const options = {
        folderId: undefined,
        bitrate: '2000k', // Calidad media para grabaciones
        resolution: '1280x720' // HD
      };

      console.log('Llamando a compressAndUploadToDrive con:', file.path, userTokens, options);
      const driveUrls = await this.recordingService.compressAndUploadToDrive(
        file.path,
        userTokens,
        { ...options, title }
      );

      // Limpiar archivo original
      fs.unlinkSync(file.path);

      return res.json({
        url: driveUrls.embedUrl,
        driveUrl: driveUrls.embedUrl,
        viewUrl: driveUrls.viewUrl,
        previewUrl: driveUrls.previewUrl,
        embedUrl: driveUrls.embedUrl,
        fileId: driveUrls.fileId,
        success: true
      });
    } catch (error) {
      console.error('Error general en uploadRecordingToDrive:', error);
      return res.status(400).json({ error: 'Error al subir la grabación a Google Drive', details: error });
    }
  }

  @Post('upload-clip')
  @UseInterceptors(FileInterceptor('file', { dest: './uploads' }))
  async uploadClipToDrive(
    @UploadedFile() file: any,
    @Body('fileName') fileName: string,
    @Body('storageProvider') storageProvider: StorageProviderType = 'google-drive',
    @Body('folderId') folderId: string = 'clips',
    @Res() res: Response,
    @Body('tokens') tokens?: string,
    @Body('megaEmail') megaEmail?: string,
    @Body('megaPassword') megaPassword?: string,
  ) {
    try {
      console.log('--- SUBIDA DE CLIP ---');
      console.log('file:', file);
      console.log('fileName:', fileName);
      console.log('storageProvider:', storageProvider);
      console.log('folderId:', folderId);

      if (!file) {
        console.error('No se recibió archivo de clip');
        return res.status(400).json({ error: 'No se recibió archivo de clip' });
      }

      if (!file.path || typeof file.path !== 'string') {
        console.error('file.path no es un string válido:', file.path);
        return res.status(400).json({ error: 'file.path no es válido', value: file.path });
      }

      // Preparar credenciales según el proveedor
      let credentials: any;
      if (storageProvider === 'google-drive') {
        // Por ahora, usar tokens simulados para clips si no se proporcionan
        // En un entorno real, estos tokens vendrían del frontend
        if (tokens) {
          try {
            credentials = JSON.parse(tokens);
          } catch (parseError) {
            console.error('Error al parsear tokens:', parseError);
            return res.status(400).json({ error: 'Error al parsear tokens', details: parseError });
          }
        } else {
          credentials = {
            access_token: 'simulated_access_token',
            refresh_token: 'simulated_refresh_token',
            token_type: 'Bearer'
          };
        }
      } else if (storageProvider === 'mega') {
        if (!megaEmail || !megaPassword) {
          console.error('No se recibieron credenciales de MEGA');
          return res.status(400).json({ error: 'Se requieren email y password para MEGA' });
        }
        credentials = {
          email: megaEmail,
          password: megaPassword,
        };
      } else {
        return res.status(400).json({ error: `Proveedor de almacenamiento '${storageProvider}' no soportado` });
      }

      console.log('Subiendo clip:', fileName, 'a', storageProvider);
      const uploadResult = await this.storageService.compressAndUpload(
        storageProvider,
        file.path,
        credentials,
        { folderId, title: fileName }
      );

      // Limpiar archivo original
      fs.unlinkSync(file.path);

      console.log('✅ Clip subido exitosamente:', uploadResult.viewUrl);
      return res.json({
        driveUrl: uploadResult.previewUrl || uploadResult.viewUrl,
        fileId: uploadResult.fileId,
        provider: uploadResult.provider,
        message: `Clip subido exitosamente a ${storageProvider === 'google-drive' ? 'Google Drive' : 'MEGA'}`
      });
    } catch (error) {
      console.error('Error al subir clip:', error);
      return res.status(500).json({ error: `Error al subir el clip a ${storageProvider}`, details: error });
    }
  }

  @Post('temp-video')
  @UseInterceptors(FileInterceptor('video', { dest: './uploads/temp' }))
  async saveTempVideo(
    @UploadedFile() file: any,
    @Body('matchId') matchId: string,
    @Body('title') title: string,
    @Res() res: Response,
  ) {
    try {
      console.log('🎬 Guardando video temporal:', {
        fileName: file?.originalname,
        fileSize: file?.size,
        matchId,
        title
      });

      if (!file) {
        return res.status(400).json({ error: 'No se recibió archivo de video' });
      }

      // Crear directorio temporal si no existe
      const tempDir = './uploads/temp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generar nombre único para el video temporal
      const tempVideoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempVideoPath = path.join(tempDir, `temp_video_${tempVideoId}.mp4`);

      // Mover el archivo subido a la ubicación temporal
      fs.renameSync(file.path, tempVideoPath);

      console.log('✅ Video temporal guardado:', {
        tempVideoPath,
        tempVideoId,
        fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      });

      return res.json({
        success: true,
        tempVideoId,
        tempVideoPath,
        title,
        matchId: parseInt(matchId),
        fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      });

    } catch (error) {
      console.error('❌ Error guardando video temporal:', error);
      return res.status(500).json({
        error: 'Error guardando video temporal',
        details: error.message
      });
    }
  }

  @Get('temp-video/:videoId')
  async getTempVideo(@Param('videoId') videoId: string, @Res() res: Response) {
    try {
      const tempVideoPath = path.join('./uploads/temp', `temp_video_${videoId}.mp4`);

      if (!fs.existsSync(tempVideoPath)) {
        return res.status(404).json({ error: 'Video temporal no encontrado' });
      }

      // Servir el archivo de video
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `inline; filename="temp_video_${videoId}.mp4"`);

      const stream = fs.createReadStream(tempVideoPath);
      stream.pipe(res);

    } catch (error) {
      console.error('❌ Error sirviendo video temporal:', error);
      return res.status(500).json({ error: 'Error sirviendo video temporal' });
    }
  }

  @Delete('temp-video/:videoId')
  async deleteTempVideo(@Param('videoId') videoId: string, @Res() res: Response) {
    try {
      const tempVideoPath = path.join('./uploads/temp', `temp_video_${videoId}.mp4`);

      if (fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
        console.log('🗑️ Video temporal eliminado:', tempVideoPath);
      }

      return res.json({ success: true, message: 'Video temporal eliminado' });

    } catch (error) {
      console.error('❌ Error eliminando video temporal:', error);
      return res.status(500).json({ error: 'Error eliminando video temporal' });
    }
  }
}

@Controller('google-drive')
export class GoogleDriveController {
  @Get('auth-url')
  getAuthUrl() {
    return { url: getGoogleAuthUrl() };
  }

  @Get('oauth-callback')
  async oauthCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      // Redirige al frontend con los tokens en la URL
      const frontendUrl = process.env.FRONTEND_URL || 'https://instante-app-23g2.vercel.app';
      const params = new URLSearchParams({
        access_token: tokens.access_token || '',
        refresh_token: tokens.refresh_token || '',
        expires_in: tokens.expiry_date ? tokens.expiry_date.toString() : '',
        token_type: tokens.token_type || '',
      }).toString();
      return res.redirect(`${frontendUrl}/conectar-drive?${params}`);
    } catch (error) {
      return res.status(400).json({ error: 'Error al obtener el token de Google', details: error });
    }
  }

} 