import { Injectable } from '@nestjs/common';
import * as Mega from 'megajs';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider, StorageUploadOptions, StorageUploadResult } from './storage.interface';

interface MegaCredentials {
  email: string;
  password: string;
}

@Injectable()
export class MegaProvider implements StorageProvider {
  /**
   * Comprime y sube un archivo a MEGA
   */
  async compressAndUpload(
    localPath: string,
    credentials: MegaCredentials,
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

    // 2. Autenticarse con MEGA
    const storage = new Mega.Storage({
      email: credentials.email,
      password: credentials.password,
      autologin: true,
    });

    // Esperar a que esté listo
    await storage.ready;
    console.log('✅ Conectado a MEGA');

    // 3. Obtener la carpeta de destino (si se especificó folderId, usarla, sino usar raíz)
    let uploadFolder: Mega.MutableFile = storage.root;
    
    if (options?.folderId) {
      const folder = storage.files[options.folderId];
      if (folder && folder.directory) {
        uploadFolder = folder;
      }
    }

    // 4. Generar nombre del archivo
    const fileName = options?.title 
      ? `${options.title}_${new Date().toISOString().split('T')[0]}.mp4`
      : path.basename(compressedPath);

    // 5. Subir archivo a MEGA
    console.log('📤 Subiendo a MEGA:', fileName);

    try {
      const fileSize = fs.statSync(compressedPath).size;
      
      // Leer el archivo completo a un buffer (MEGA requiere Buffer o string, no ReadStream directamente)
      const fileBuffer = fs.readFileSync(compressedPath);
      
      // uploadFolder.upload() devuelve un UploadStream con una propiedad 'complete' que es una Promise
      const uploadStream = uploadFolder.upload({
        name: fileName,
        size: fileSize,
      }, fileBuffer);

      // Esperar a que la subida se complete
      const file = await (uploadStream as any).complete;

      // 6. Generar enlace público (necesita un argumento: linkOpts | boolean)
      const link = await file.link(true);

      // Limpiar archivo comprimido
      fs.unlinkSync(compressedPath);

      // Cerrar sesión de MEGA
      await storage.close();

      console.log('✅ Archivo subido exitosamente a MEGA:', file.downloadId);

      // MEGA devuelve un enlace directo para descarga
      // El fileId es el downloadId de MEGA
      return {
        fileId: file.downloadId,
        viewUrl: link,
        downloadUrl: link,
        previewUrl: link, // MEGA no tiene vista previa como Drive, pero el link funciona
        embedUrl: link, // MEGA no soporta embed, pero el link funciona para descarga
        provider: 'mega',
      };
    } catch (err) {
      // Limpiar archivo comprimido en caso de error
      if (fs.existsSync(compressedPath)) {
        fs.unlinkSync(compressedPath);
      }

      // Cerrar sesión de MEGA en caso de error
      try {
        await storage.close();
      } catch (closeErr) {
        // Ignorar errores al cerrar
      }

      console.error('❌ Error subiendo a MEGA:', err);
      throw err;
    }
  }

  async getPublicUrl(fileId: string, credentials?: MegaCredentials): Promise<string> {
    if (!credentials) {
      throw new Error('Se requieren credenciales para obtener URL pública de MEGA');
    }

    // Autenticarse con MEGA
    const storage = new Mega.Storage({
      email: credentials.email,
      password: credentials.password,
      autologin: true,
    });

    // Esperar a que esté listo
    await storage.ready;

    // Buscar el archivo por downloadId
    const file = storage.files[fileId];
    
    if (!file) {
      await storage.close();
      throw new Error('Archivo no encontrado en MEGA');
    }

    // Generar enlace público (necesita un argumento: linkOpts | boolean)
    const link = await file.link(true);

    await storage.close();
    return link;
  }

  async deleteFile(fileId: string, credentials?: MegaCredentials): Promise<void> {
    if (!credentials) {
      throw new Error('Se requieren credenciales para eliminar archivos de MEGA');
    }

    // Autenticarse con MEGA
    const storage = new Mega.Storage({
      email: credentials.email,
      password: credentials.password,
      autologin: true,
    });

    // Esperar a que esté listo
    await storage.ready;

    // Buscar el archivo por downloadId
    const file = storage.files[fileId];
    
    if (!file) {
      await storage.close();
      throw new Error('Archivo no encontrado en MEGA');
    }

    // Eliminar archivo
    await file.delete();

    await storage.close();
  }
}

