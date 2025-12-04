import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider, StorageUploadOptions, StorageUploadResult } from './storage.interface';

@Injectable()
export class GoogleDriveProvider implements StorageProvider {
    /**
     * Sube un archivo a Google Drive SIN compresión
     * (FFmpeg deshabilitado temporalmente hasta que esté correctamente instalado en Railway)
     */
    async compressAndUpload(
        localPath: string,
        credentials: { access_token: string; refresh_token: string },
        options?: StorageUploadOptions
    ): Promise<StorageUploadResult> {
        console.log('📤 Subiendo video a Google Drive (sin compresión - FFmpeg deshabilitado)...');

        // Subir directamente sin comprimir
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const fileName = options?.title
            ? `${options.title}_${new Date().toISOString().split('T')[0]}.webm`
            : path.basename(localPath);

        const fileMetadata = {
            name: fileName,
            parents: options?.folderId ? [options.folderId] : undefined,
        };

        const media = {
            mimeType: 'video/webm',
            body: fs.createReadStream(localPath),
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

            // Limpiar archivo temporal
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
            // Limpiar archivo en caso de error
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
