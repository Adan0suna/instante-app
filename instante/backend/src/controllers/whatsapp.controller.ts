import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';

const WHATSAPP_MAX_SIZE = 16 * 1024 * 1024; // 16MB en bytes

@Controller('whatsapp')
export class WhatsAppController {
  
  @Get('video/:filename')
  async getWhatsAppVideo(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const videoPath = path.join(__dirname, '../../uploads/whatsapp', filename);
      
      if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: 'Video no encontrado' });
      }

      // Servir el archivo de video
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);
    } catch (error) {
      console.error('❌ Error sirviendo video de WhatsApp:', error);
      return res.status(500).json({ error: 'Error sirviendo video de WhatsApp' });
    }
  }
  
  @Post('compress')
  async compressForWhatsApp(
    @Body('videoUrl') videoUrl: string,
    @Body('targetSize') targetSize: number = WHATSAPP_MAX_SIZE,
    @Res() res: Response,
  ) {
    try {
      console.log('📱 Comprimiendo video para WhatsApp:', videoUrl);

      // Configurar ffmpeg
      const ffmpegPath = path.join(__dirname, '../../../../ffmpeg/ffmpeg-7.1.1-essentials_build/bin/ffmpeg.exe');
      const ffprobePath = path.join(__dirname, '../../../../ffmpeg/ffmpeg-7.1.1-essentials_build/bin/ffprobe.exe');
      ffmpeg.setFfmpegPath(ffmpegPath);
      ffmpeg.setFfprobePath(ffprobePath);

      // Crear directorio temporal si no existe
      const tempDir = path.join(__dirname, '../../uploads/whatsapp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Descargar el video si es una URL
      let inputPath: string;
      if (videoUrl.startsWith('https')) {
        const tempInputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
        await this.downloadVideo(videoUrl, tempInputPath);
        inputPath = tempInputPath;
      } else {
        // Si es una ruta local
        inputPath = videoUrl.startsWith('/') 
          ? videoUrl 
          : path.join(__dirname, '../../uploads', videoUrl.replace(/^\//, ''));
        
        if (!fs.existsSync(inputPath)) {
          return res.status(404).json({ error: 'Video no encontrado' });
        }
      }

      // Obtener información del video original
      const videoInfo = await this.getVideoInfo(inputPath);
      const originalSize = fs.statSync(inputPath).size;
      
      console.log('📊 Información del video:', {
        size: originalSize,
        duration: videoInfo.duration,
        bitrate: videoInfo.bitrate,
      });

      // Si el video ya es menor que el tamaño objetivo, retornarlo sin comprimir
      if (originalSize <= targetSize) {
        // Si es una URL, retornarla directamente
        if (videoUrl.startsWith('https')) {
          if (inputPath !== videoUrl && fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
          }
          return res.json({ 
            compressedUrl: videoUrl,
            originalSize,
            compressedSize: originalSize,
            compressed: false,
          });
        }
        
        // Si es un archivo local, servir el archivo
        return res.json({
          compressedUrl: videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`,
          originalSize,
          compressedSize: originalSize,
          compressed: false,
        });
      }

      // Calcular parámetros de compresión
      // WhatsApp recomienda: resolución 640x480, bitrate bajo, H.264
      const outputPath = path.join(tempDir, `whatsapp_${Date.now()}.mp4`);
      
      // Calcular bitrate aproximado para alcanzar el tamaño objetivo
      // Fórmula aproximada: bitrate = (targetSize * 8) / duration (en segundos)
      const targetBitrate = Math.floor((targetSize * 8) / videoInfo.duration) - 50000; // Dejar margen
      const bitrate = Math.max(200, Math.min(1000, targetBitrate)); // Entre 200k y 1000k

      console.log('🔧 Parámetros de compresión:', {
        outputPath,
        targetSize,
        bitrate: `${bitrate}k`,
        resolution: '640:480',
      });

      // Comprimir video
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size('640x480') // Resolución optimizada para WhatsApp
          .videoBitrate(`${bitrate}k`)
          .audioBitrate('64k')
          .outputOptions([
            '-preset', 'fast',
            '-crf', '28', // Calidad más baja para menor tamaño
            '-movflags', '+faststart', // Optimización para streaming
            '-maxrate', `${bitrate}k`,
            '-bufsize', `${bitrate * 2}k`,
          ])
          .on('start', (commandLine) => {
            console.log('🎬 Iniciando compresión:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('📊 Progreso:', progress.percent + '%');
          })
          .on('end', () => {
            console.log('✅ Compresión completada');
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ Error en compresión:', err);
            reject(err);
          })
          .run();
      });

      // Verificar tamaño del archivo comprimido
      const compressedSize = fs.statSync(outputPath).size;
      console.log('📦 Tamaño comprimido:', compressedSize, 'bytes');

      // Limpiar archivo temporal de entrada si se descargó
      if (inputPath !== videoUrl && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }

      // Generar URL del archivo comprimido
      const fileName = path.basename(outputPath);
      const compressedUrl = `/whatsapp/video/${fileName}`;

      return res.json({
        compressedUrl,
        originalSize,
        compressedSize,
        compressed: true,
        message: 'Video comprimido exitosamente para WhatsApp',
      });

    } catch (error) {
      console.error('❌ Error comprimiendo video para WhatsApp:', error);
      return res.status(500).json({
        error: 'Error al comprimir el video para WhatsApp',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  private async getVideoInfo(videoPath: string): Promise<{ duration: number; bitrate: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const duration = metadata.format.duration || 60; // Default 60 segundos
        const bitrate = metadata.format.bit_rate || 1000000; // Default 1Mbps

        resolve({
          duration,
          bitrate: parseInt(bitrate.toString()),
        });
      });
    });
  }

  private async downloadVideo(url: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Error descargando video: ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlinkSync(outputPath);
          reject(err);
        });
      }).on('error', reject);
    });
  }
}

