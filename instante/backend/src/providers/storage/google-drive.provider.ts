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
     * Guarda copia temporal por 48 horas para edición
     */
    async compressAndUpload(
        localPath: string,
        credentials: { access_token: string; refresh_token: string },
        options?: StorageUploadOptions
    ): Promise<StorageUploadResult> {
        let videoPath = localPath;
        let mimeType = 'video/webm';
        let shouldCleanup = false;

        // Intentar comprimir con FFmpeg
        try {
            console.log('🎬 Intentando comprimir video con FFmpeg...');

            // Configurar FFmpeg para usar el binario del sistema (instalado en Docker)
            ffmpeg.setFfmpegPath('ffmpeg');
            ffmpeg.setFfprobePath('ffprobe');

            const compressedPath = path.join(
                path.dirname(localPath),
                path.basename(localPath, path.extname(localPath)) + '_compressed.mp4'
            );

            await new Promise<void>((resolve, reject) => {
                ffmpeg(localPath)
                    .output(compressedPath)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .outputOptions('-preset', 'ultrafast')
                    .videoBitrate(options?.bitrate || '1000k')
                    .size(options?.resolution || '1280x720')
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err))
                    .run();
            });

            console.log('✅ Video comprimido exitosamente');
            videoPath = compressedPath;
            mimeType = 'video/mp4';
            shouldCleanup = true;
        } catch (ffmpegError) {
            console.warn('⚠️ FFmpeg falló, subiendo video original sin comprimir');
            console.warn('Error:', ffmpegError.message);
        }

        // Subir a Google Drive
        console.log('📤 Subiendo video a Google Drive...');

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const fileName = options?.title
            ? `${options.title}_${new Date().toISOString().split('T')[0]}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`
            : path.basename(videoPath);

        const fileMetadata = {
            name: fileName,
            parents: options?.folderId ? [options.folderId] : undefined,
        };

        const media = {
            mimeType: mimeType,
            body: fs.createReadStream(videoPath),
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

            // Guardar copia temporal del video para edición (48 horas)
            const tempDir = './uploads/temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempVideoId = `${Date.now()}_${fileId}`;
            const tempVideoPath = path.join(tempDir, `${tempVideoId}${path.extname(videoPath)}`);

            try {
                // Copiar video a directorio temporal
                fs.copyFileSync(videoPath, tempVideoPath);
                console.log('💾 Video temporal guardado:', tempVideoPath);
            } catch (copyError) {
                console.warn('⚠️ Error al guardar video temporal:', copyError);
            }

            // Limpiar archivo comprimido si existe
            if (shouldCleanup && fs.existsSync(videoPath) && videoPath !== localPath) {
                fs.unlinkSync(videoPath);
            }

            // Limpiar archivo original
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }

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
                tempVideoId,
                tempVideoPath,
                expiresAt: Date.now() + (48 * 60 * 60 * 1000) // 48 horas
            };
        } catch (err) {
            // Limpiar archivos en caso de error
            if (shouldCleanup && fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
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
