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
     * Si FFmpeg falla, sube el video original sin comprimir
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
            // Continuar con el video original
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

            // Limpiar archivos temporales
            if (shouldCleanup && fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
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
