import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import { join } from 'path';

interface RecorteJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  outputUrl?: string;
  error?: string;
  startTime: number;
  endTime: number;
  inputUrl: string;
  outputPath: string;
}

@Injectable()
export class RecortesService {
  private jobs: Map<string, RecorteJob> = new Map();
  private uploadsDir = join(__dirname, '..', '..', 'uploads');

  constructor() {
    // Asegurar que el directorio de uploads existe
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async createRecorte(
    videoUrl: string,
    startTime: number,
    endTime: number,
    outputFormat: 'mp4' | 'webm'
  ): Promise<{ id: string; status: 'processing' | 'completed' | 'failed' }> {
    const jobId = `recorte_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const outputFileName = `recorte_${jobId}.${outputFormat}`;
    const outputPath = join(this.uploadsDir, outputFileName);

    const job: RecorteJob = {
      id: jobId,
      status: 'processing',
      startTime,
      endTime,
      inputUrl: videoUrl,
      outputPath
    };

    this.jobs.set(jobId, job);

    // Procesar el recorte en segundo plano
    this.processRecorte(job);

    return {
      id: jobId,
      status: 'processing'
    };
  }

  private async processRecorte(job: RecorteJob) {
    try {
      console.log(`🎬 Procesando recorte ${job.id}:`, {
        inputUrl: job.inputUrl,
        startTime: job.startTime,
        endTime: job.endTime,
        outputPath: job.outputPath
      });

      // Calcular duración
      const duration = job.endTime - job.startTime;

      // Comando FFmpeg para recortar el video
      const ffmpegArgs = [
        '-i', job.inputUrl,
        '-ss', job.startTime.toString(),
        '-t', duration.toString(),
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'fast',
        '-y', // Sobrescribir archivo si existe
        job.outputPath
      ];

      console.log('🔧 Comando FFmpeg:', ['ffmpeg', ...ffmpegArgs]);

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      return new Promise<void>((resolve, reject) => {
        let stderr = '';

        ffmpeg.stderr.on('data', (data) => {
          stderr += data.toString();
          console.log('📹 FFmpeg output:', data.toString());
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ Recorte ${job.id} completado exitosamente`);
            
            // Actualizar estado del job
            job.status = 'completed';
            // Extraer solo el nombre del archivo, no la ruta completa
            const fileName = job.outputPath.split(/[\\\/]/).pop();
            job.outputUrl = `/recortes/file/${fileName}`;
            
            this.jobs.set(job.id, job);
            resolve();
          } else {
            console.error(`❌ Error en recorte ${job.id}:`, stderr);
            
            job.status = 'failed';
            job.error = stderr;
            
            this.jobs.set(job.id, job);
            reject(new Error(`FFmpeg falló con código ${code}: ${stderr}`));
          }
        });

        ffmpeg.on('error', (error) => {
          console.error(`❌ Error al ejecutar FFmpeg para recorte ${job.id}:`, error);
          
          job.status = 'failed';
          job.error = error.message;
          
          this.jobs.set(job.id, job);
          reject(error);
        });
      });
    } catch (error) {
      console.error(`❌ Error procesando recorte ${job.id}:`, error);
      
      job.status = 'failed';
      job.error = error.message;
      
      this.jobs.set(job.id, job);
    }
  }

  async getRecorteStatus(id: string): Promise<{
    id: string;
    status: 'processing' | 'completed' | 'failed';
    outputUrl?: string;
    error?: string;
  }> {
    const job = this.jobs.get(id);
    
    if (!job) {
      throw new Error(`Recorte con ID ${id} no encontrado`);
    }

    return {
      id: job.id,
      status: job.status,
      outputUrl: job.outputUrl,
      error: job.error
    };
  }

  async getRecorteFilePath(filename: string): Promise<string> {
    const filePath = join(this.uploadsDir, filename);
    
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new Error(`Archivo ${filename} no encontrado`);
    }
  }

  async deleteRecorte(id: string): Promise<void> {
    const job = this.jobs.get(id);
    
    if (!job) {
      throw new Error(`Recorte con ID ${id} no encontrado`);
    }

    // Eliminar archivo si existe
    try {
      await fs.unlink(job.outputPath);
      console.log(`🗑️ Archivo eliminado: ${job.outputPath}`);
    } catch (error) {
      console.warn(`⚠️ No se pudo eliminar archivo: ${job.outputPath}`, error);
    }

    // Eliminar job de la memoria
    this.jobs.delete(id);
  }
} 