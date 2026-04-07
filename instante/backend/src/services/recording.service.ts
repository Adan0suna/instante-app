import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recording } from '../models/recording.entity';
import { Highlight } from '../models/highlight.entity';
import * as ffmpeg from 'fluent-ffmpeg';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { envConfig } from '../config/env.config';

// Configurar la ruta de ffmpeg
const ffmpegPath = path.join(__dirname, '../../../../ffmpeg/ffmpeg-7.1.1-essentials_build/bin/ffmpeg.exe');
const ffprobePath = path.join(__dirname, '../../../../ffmpeg/ffmpeg-7.1.1-essentials_build/bin/ffprobe.exe');

// Configurar ffmpeg con las rutas correctas
console.log('🔧 Configurando ffmpeg...');
console.log('📁 Ruta ffmpeg:', ffmpegPath);
console.log('📁 Ruta ffprobe:', ffprobePath);
console.log('✅ ffmpeg existe:', fs.existsSync(ffmpegPath));
console.log('✅ ffprobe existe:', fs.existsSync(ffprobePath));

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

@Injectable()
export class RecordingService {
  private drive;

  constructor(
    @InjectRepository(Recording)
    private recordingRepository: Repository<Recording>,
    @InjectRepository(Highlight)
    private highlightRepository: Repository<Highlight>,
  ) {
    // Inicializar Google Drive API
    this.initializeGoogleDrive();
  }

  private async initializeGoogleDrive() {
    // Configurar autenticación de Google Drive
    const auth = new google.auth.GoogleAuth({
      keyFile: 'path/to/credentials.json',
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async startRecording(title: string): Promise<Recording> {
    const recording = new Recording();
    recording.title = title;
    recording.date = new Date();
    
    // Iniciar grabación con FFmpeg
    const command = ffmpeg()
      .input('video=Integrated Camera')
      .output('recordings/temp.mp4')
      .on('end', () => {
        console.log('Grabación finalizada');
      })
      .on('error', (err) => {
        console.error('Error en la grabación:', err);
      });

    command.run();

    return this.recordingRepository.save(recording);
  }

  async stopRecording(id: number): Promise<Recording> {
    const recording = await this.recordingRepository.findOne({ where: { id } });
    if (!recording) {
      throw new Error('Grabación no encontrada');
    }

    // Detener FFmpeg y subir a Google Drive
    const fileMetadata = {
      name: `${recording.title}.mp4`,
      parents: ['folder_id'], // ID de la carpeta en Google Drive
    };

    const media = {
      mimeType: 'video/mp4',
      body: fs.createReadStream('recordings/temp.mp4'),
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    recording.videoUrl = `https://drive.google.com/file/d/${response.data?.id}/view`;
    return this.recordingRepository.save(recording);
  }

  async addHighlight(recordingId: number, highlightData: Partial<Highlight>): Promise<Highlight> {
    const recording = await this.recordingRepository.findOne({ where: { id: recordingId } });
    if (!recording) {
      throw new Error('Grabación no encontrada');
    }

    const highlight = new Highlight();
    Object.assign(highlight, highlightData);
    highlight.recording = recording;

    return this.highlightRepository.save(highlight);
  }

  async generateClip(highlightId: number): Promise<string> {
    const highlight = await this.highlightRepository.findOne({ 
      where: { id: highlightId },
      relations: ['recording'],
    });

    if (!highlight) {
      throw new Error('Momento destacado no encontrado');
    }

    // Descargar video de Google Drive
    const response = await this.drive.files.get({
      fileId: highlight.recording.videoUrl.split('/')[5],
      alt: 'media',
    }, { responseType: 'stream' });

    // Crear clip con FFmpeg
    const outputPath = `clips/${highlight.id}.mp4`;
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(response.data)
        .setStartTime(highlight.time)
        .setDuration(30) // 30 segundos de clip
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Subir clip a Google Drive
    const fileMetadata = {
      name: `clip_${highlight.id}.mp4`,
      parents: ['clips_folder_id'],
    };

    const media = {
      mimeType: 'video/mp4',
      body: fs.createReadStream(outputPath),
    };

    const uploadResponse = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    highlight.clipUrl = `https://drive.google.com/file/d/${uploadResponse.data?.id}/view`;
    await this.highlightRepository.save(highlight);

    return highlight.clipUrl;
  }

  /**
   * Comprime un video y lo sube a Google Drive usando el token de usuario
   * @param localPath Ruta local del video original
   * @param userTokens Tokens OAuth del usuario (access_token, refresh_token)
   * @param options Opciones de compresión opcionales
   * @returns URL del archivo en Google Drive
   */
  async compressAndUploadToDrive(localPath: string, userTokens: any, options?: { bitrate?: string, resolution?: string, folderId?: string, title?: string }) {
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
    const oauth2Client = new google.auth.OAuth2(
      envConfig.google.clientId,
      envConfig.google.clientSecret,
      envConfig.google.redirectUri
    );
    oauth2Client.setCredentials({
      access_token: userTokens.access_token,
      refresh_token: userTokens.refresh_token,
    });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    // Usar el título si está disponible, sino usar el nombre del archivo
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
    console.log('Subiendo a Google Drive:', fileMetadata);
    try {
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, parents',
      });
      console.log('Respuesta completa de Google Drive:', response.data);
      
      // Verificar que el archivo se subió correctamente
      if (response.data.id) {
        console.log('Archivo subido exitosamente con ID:', response.data.id);
        console.log('Nombre del archivo:', response.data.name);
        console.log('Link de vista web:', response.data.webViewLink);
        console.log('Carpeta padre:', response.data.parents);
      }
      
      fs.unlinkSync(compressedPath);
      
      // Verificar que el archivo existe en Drive
      try {
        const fileInfo = await drive.files.get({
          fileId: response.data.id,
          fields: 'id, name, webViewLink, parents, permissions'
        });
        console.log('Verificación del archivo en Drive:', fileInfo.data);
      } catch (verifyError) {
        console.error('Error al verificar archivo en Drive:', verifyError);
      }
      
      // Generar URL de vista previa que funciona sin autenticación
      const previewUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;
      const embedUrl = `https://drive.google.com/file/d/${response.data.id}/preview`;
      
      return {
        viewUrl: `https://drive.google.com/file/d/${response.data.id}/view`,
        previewUrl: previewUrl,
        embedUrl: embedUrl,
        fileId: response.data.id
      };
    } catch (err) {
      console.error('Error subiendo a Google Drive:', err);
      throw err;
    }
  }

} 