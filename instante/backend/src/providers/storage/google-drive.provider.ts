import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider, StorageUploadOptions, StorageUploadResult } from './storage.interface';

@Injectable()
export class GoogleDriveProvider implements StorageProvider {
  /**
   * Comprime y sube un archivo a Google Drive
   */
  async compressAndUpload(
    localPath: string,
    credentials: { access_token: string; refresh_token: string },
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    // Configurar ffmpeg
    const ffmpegPath = path.join(__dirname, '../../../../ffmpeg/ffmpeg-7.1.1-essentials_build/bin/ffmpeg.exe');
    const ffprobePath = path.join(__dirname, '../../../../ffmpeg/ffmpeg-7.1.1-essentials_build/bin/ffprobe.exe');
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

    // 1. Comprimir el video
    const compressedPath = path.join(
      path.dirname(localPath),
      path.basename(localPath, path.extname(localPath)) + '_compressed.mp4'
    );

    await new Promise((resolve, reject) => {
      let command = ffmpeg(localPath)
        .output(compressedPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions('-preset', 'ultrafast')
        .on('end', resolve)
        .on('error', reject);

      if (options?.bitrate) command = command.videoBitrate(options.bitrate);
      if (options?.resolution) command = command.size(options.resolution);
      
      command.run();
    });

    // 2. Subir a Google Drive usando los tokens del usuario
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const fileName = options?.title 
      ? `${options.title}_${new Date().toISOString().split('T')[0]}.mp4`
      : path.basename(compressedPath);
    
    const fileMetadata = {
      name: fileName,
      parents: options?.folderId ? [options.folderId] : undefined,
    };

    const media = {
      mimeType: 'video/mp4',
      body: fs.createReadStream(compressedPath),
    };

    console.log('📤 Subiendo a Google Drive:', fileMetadata);
    
    try {
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, parents',
      });

      if (!response.data.id) {
        throw new Error('No se recibió ID del archivo de Google Drive');
      }

      const fileId = response.data.id;
      
      // Limpiar archivo comprimido
      fs.unlinkSync(compressedPath);

      // Generar URLs
      const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
      const previewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      console.log('✅ Archivo subido exitosamente a Google Drive:', fileId);

      return {
        fileId,
        viewUrl,
        previewUrl,
        embedUrl,
        downloadUrl,
        provider: 'google-drive',
      };
    } catch (err) {
      // Limpiar archivo comprimido en caso de error
      if (fs.existsSync(compressedPath)) {
        fs.unlinkSync(compressedPath);
      }
      console.error('❌ Error subiendo a Google Drive:', err);
      throw err;
    }
  }

  async getPublicUrl(fileId: string): Promise<string> {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  async deleteFile(fileId: string, credentials?: any): Promise<void> {
    if (!credentials) {
      throw new Error('Se requieren credenciales para eliminar archivos de Google Drive');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    await drive.files.delete({
      fileId: fileId,
    });
  }
}


