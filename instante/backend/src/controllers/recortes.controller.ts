import { Controller, Post, Body, Get, Param, Res, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clip } from '../models/clip.entity';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { diskStorage } from 'multer';

// Configurar la ruta de ffmpeg
const ffmpegPath = path.join(__dirname, '../../../../ffmpeg/ffmpeg-7.1.1-essentials_build/bin/ffmpeg.exe');
const ffprobePath = path.join(__dirname, '../../../../ffmpeg/ffmpeg-7.1.1-essentials_build/bin/ffprobe.exe');

// Configurar ffmpeg con las rutas correctas
console.log('🔧 Configurando ffmpeg en RecortesController...');
console.log('📁 Ruta ffmpeg:', ffmpegPath);
console.log('✅ ffmpeg existe:', fs.existsSync(ffmpegPath));
console.log('📁 Ruta ffprobe:', ffprobePath);
console.log('✅ ffprobe existe:', fs.existsSync(ffprobePath));

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

@Controller('recortes')
export class RecortesController {
  constructor(
    @InjectRepository(Clip)
    private clipRepository: Repository<Clip>,
  ) { }

  @Post('process-clip')
  async processClip(
    @Body() body: {
      videoPath: string;
      tempVideoId?: string;
      startTime: number;
      endTime: number;
      description: string;
      matchId: number;
      clipId?: number; // ID del clip en la base de datos
    },
    @Res() res: Response
  ) {
    try {
      const { videoPath, tempVideoId, startTime, endTime, description, matchId, clipId } = body;

      console.log('🎬 Procesando clip:', {
        videoPath,
        tempVideoId,
        startTime,
        endTime,
        description,
        matchId,
        clipId
      });

      // Determinar la ruta del video a procesar
      let actualVideoPath = videoPath;

      // Si tenemos un tempVideoId, usar el video temporal
      if (tempVideoId) {
        const tempDir = path.join(process.cwd(), 'uploads', 'temp');
        if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir);
          const videoFile = files.find(
            (file) =>
              file.startsWith(tempVideoId) ||
              file === `temp_video_${tempVideoId}.mp4` ||
              file.startsWith(`temp_video_${tempVideoId}`)
          );
          if (videoFile) {
            actualVideoPath = path.join(tempDir, videoFile);
          } else {
            actualVideoPath = path.join(tempDir, `temp_video_${tempVideoId}.mp4`);
          }
        } else {
          actualVideoPath = path.join(process.cwd(), 'uploads', 'temp', `temp_video_${tempVideoId}.mp4`);
        }
      }

      // Verificar que el archivo de video existe
      if (!fs.existsSync(actualVideoPath)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Archivo de video no encontrado',
          path: actualVideoPath,
          tempVideoId
        });
      }

      // Crear directorio para clips si no existe
      const clipsDir = path.join(process.cwd(), 'uploads', 'clips');
      if (!fs.existsSync(clipsDir)) {
        fs.mkdirSync(clipsDir, { recursive: true });
      }

      // Generar nombre único para el clip
      const generatedClipId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const outputPath = path.join(clipsDir, `clip_${generatedClipId}.mp4`);

      // Calcular duración del clip
      const duration = endTime - startTime;

      console.log('📹 Iniciando procesamiento con FFmpeg:', {
        input: actualVideoPath,
        output: outputPath,
        startTime,
        duration
      });

      // Procesar el video con FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(actualVideoPath)
          .setStartTime(startTime)
          .setDuration(duration)
          .output(outputPath)
          .on('end', () => {
            console.log('✅ Clip procesado exitosamente');
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ Error procesando clip:', err);
            reject(err);
          })
          .run();
      });

      // Obtener el tamaño del archivo
      const stats = fs.statSync(outputPath);
      const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

      // Actualizar la base de datos si tenemos un clipId
      if (clipId) {
        try {
          console.log('🔍 Buscando clip con ID:', clipId);
          const clip = await this.clipRepository.findOne({ where: { id: clipId } });
          if (clip) {
            console.log('✅ Clip encontrado:', clip);
            // Crear la URL del clip para servir desde el backend
            const clipUrl = `/recortes/file/${generatedClipId}`;
            console.log('🔗 URL del clip a guardar:', clipUrl);
            clip.clipUrl = clipUrl;
            const savedClip = await this.clipRepository.save(clip);
            console.log('✅ Clip actualizado en la base de datos:', savedClip);
          } else {
            console.warn('⚠️ No se encontró el clip con ID:', clipId);
          }
        } catch (dbError) {
          console.error('❌ Error actualizando la base de datos:', dbError);
          console.error('❌ Detalles del error:', {
            message: dbError.message,
            stack: dbError.stack
          });
        }
      } else {
        console.warn('⚠️ No se proporcionó clipId para actualizar');
      }

      return res.json({
        success: true,
        clipPath: outputPath,
        clipId: generatedClipId,
        duration,
        startTime,
        endTime,
        fileSize: `${fileSize} MB`,
        description,
        matchId,
        clipUrl: `/recortes/file/${generatedClipId}`
      });

    } catch (error) {
      console.error('❌ Error en processClip:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error procesando el clip',
        details: error.message
      });
    }
  }

  @Post('process-clip-file')
  @UseInterceptors(FileInterceptor('video', {
    storage: diskStorage({
      destination: './uploads/temp',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `temp_video_${uniqueSuffix}.webm`);
      }
    })
  }))
  async processClipFile(
    @UploadedFile() file: any,
    @Body() body: {
      startTime: string;
      endTime: string;
      description: string;
      matchId: string;
      clipId?: string;
    },
    @Res() res: Response
  ) {
    try {
      const { startTime, endTime, description, matchId, clipId } = body;

      console.log('🎬 Procesando clip desde archivo:', {
        fileName: file?.filename,
        startTime,
        endTime,
        description,
        matchId,
        clipId
      });

      if (!file) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'No se proporcionó archivo de video'
        });
      }

      const actualVideoPath = file.path;
      const startTimeNum = parseFloat(startTime);
      const endTimeNum = parseFloat(endTime);
      const matchIdNum = parseInt(matchId);

      // Verificar que el archivo de video existe
      if (!fs.existsSync(actualVideoPath)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Archivo de video no encontrado',
          path: actualVideoPath
        });
      }

      // Crear directorio para clips si no existe
      const clipsDir = path.join(process.cwd(), 'uploads', 'clips');
      if (!fs.existsSync(clipsDir)) {
        fs.mkdirSync(clipsDir, { recursive: true });
      }

      // Generar nombre único para el clip
      const clipIdGenerated = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const outputPath = path.join(clipsDir, `clip_${clipIdGenerated}.mp4`);

      // Calcular duración del clip
      const duration = endTimeNum - startTimeNum;

      console.log('📹 Iniciando procesamiento con FFmpeg:', {
        input: actualVideoPath,
        output: outputPath,
        startTime: startTimeNum,
        duration
      });

      // Procesar clip con FFmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(actualVideoPath)
          .setStartTime(startTimeNum)
          .setDuration(duration)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions('-preset', 'ultrafast')
          .on('end', () => {
            console.log('✅ Clip procesado exitosamente:', outputPath);
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('❌ Error procesando clip:', err);
            reject(err);
          })
          .run();
      });

      // Verificar que el archivo se creó correctamente
      if (!fs.existsSync(outputPath)) {
        throw new Error('El archivo de clip no se generó correctamente');
      }

      // Obtener información del archivo
      const stats = fs.statSync(outputPath);
      const fileSize = (stats.size / 1024 / 1024).toFixed(2); // MB

      console.log('📊 Información del clip generado:', {
        path: outputPath,
        size: `${fileSize} MB`,
        duration: `${duration}s`
      });

      // Actualizar la base de datos si tenemos un clipId (solo si DB disponible)
      if (clipId && this.clipRepository) {
        try {
          console.log('🔍 Buscando clip con ID:', clipId);
          const clip = await this.clipRepository.findOne({ where: { id: parseInt(clipId) } });
          if (clip) {
            console.log('✅ Clip encontrado:', clip);
            // Crear la URL del clip para servir desde el backend
            const clipUrl = `/recortes/file/${clipIdGenerated}`;
            console.log('🔗 URL del clip a guardar:', clipUrl);
            clip.clipUrl = clipUrl;
            const savedClip = await this.clipRepository.save(clip);
            console.log('✅ Clip actualizado en la base de datos:', savedClip);
          } else {
            console.warn('⚠️ No se encontró el clip con ID:', clipId);
          }
        } catch (dbError) {
          console.error('❌ Error actualizando la base de datos:', dbError);
          console.error('❌ Detalles del error:', {
            message: dbError.message,
            stack: dbError.stack
          });
        }
      } else {
        console.warn('⚠️ DB no disponible o no se proporcionó clipId');
      }

      return res.json({
        success: true,
        clipPath: outputPath,
        clipId: clipIdGenerated,
        duration,
        startTime: startTimeNum,
        endTime: endTimeNum,
        fileSize: `${fileSize} MB`,
        description,
        matchId: matchIdNum,
        clipUrl: `/recortes/file/${clipIdGenerated}`
      });

    } catch (error) {
      console.error('❌ Error en processClipFile:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error procesando el clip',
        details: error.message
      });
    }
  }

  @Get('file/:clipId')
  async getClipFile(@Param('clipId') clipId: string, @Res() res: Response) {
    try {
      const clipPath = path.join(process.cwd(), 'uploads', 'clips', `clip_${clipId}.mp4`);

      if (!fs.existsSync(clipPath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          error: 'Clip no encontrado'
        });
      }

      // Servir el archivo de video
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `inline; filename="clip_${clipId}.mp4"`);

      const stream = fs.createReadStream(clipPath);
      stream.pipe(res);

    } catch (error) {
      console.error('❌ Error sirviendo clip:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error sirviendo el clip'
      });
    }
  }

  @Post('concatenate/:matchId')
  async concatenateClips(@Param('matchId') matchId: string, @Res() res: Response) {
    try {
      console.log('🎬 Concatenando clips para partido:', matchId);

      // Obtener clips desde la base de datos
      if (!this.clipRepository) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          error: 'Base de datos no disponible. Por favor despierta tu proyecto de Supabase.'
        });
      }

      const clips = await this.clipRepository.find({
        where: { matchId: parseInt(matchId) },
        order: { id: 'ASC' }
      });

      if (clips.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json({
          error: 'No hay clips para concatenar'
        });
      }

      // Verificar que todos los clips tengan archivos físicos
      const clipsWithFiles = [];
      for (const clip of clips) {
        let clipId = null;
        if (clip.clipUrl && clip.clipUrl.includes('/recortes/file/')) {
          clipId = clip.clipUrl.split('/').pop();
        }

        if (clipId) {
          const clipPath = path.join(process.cwd(), 'uploads', 'clips', `clip_${clipId}.mp4`);
          if (fs.existsSync(clipPath)) {
            clipsWithFiles.push({
              path: clipPath,
              clipId: clipId
            });
          }
        }
      }

      if (clipsWithFiles.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json({
          error: 'No se encontraron archivos de clips válidos'
        });
      }

      // Crear directorio para videos concatenados si no existe
      const concatenatedDir = path.join(process.cwd(), 'uploads', 'concatenated');
      if (!fs.existsSync(concatenatedDir)) {
        fs.mkdirSync(concatenatedDir, { recursive: true });
      }

      // Generar nombre único para el video concatenado
      const concatenatedId = `concatenated_${matchId}_${Date.now()}`;
      const outputPath = path.join(concatenatedDir, `${concatenatedId}.mp4`);
      const listFilePath = path.join(concatenatedDir, `${concatenatedId}_list.txt`);

      // Crear archivo de lista para FFmpeg
      const fileList = clipsWithFiles.map(clip => `file '${clip.path}'`).join('\n');
      fs.writeFileSync(listFilePath, fileList);

      console.log('📋 Archivo de lista creado:', listFilePath);
      console.log('📋 Clips a concatenar:', clipsWithFiles.length);

      // Concatenar clips usando FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(listFilePath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c', 'copy']) // Copiar sin recodificar para mayor velocidad
          .output(outputPath)
          .on('end', () => {
            console.log('✅ Video concatenado exitosamente:', outputPath);
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ Error concatenando clips:', err);
            reject(err);
          })
          .run();
      });

      // Obtener el tamaño del archivo
      const stats = fs.statSync(outputPath);
      const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

      // Limpiar archivo de lista temporal
      fs.unlinkSync(listFilePath);

      // Crear URL para el video concatenado
      const videoUrl = `/recortes/concatenated/${concatenatedId}`;

      return res.json({
        success: true,
        videoId: concatenatedId,
        videoUrl: videoUrl,
        fileSize: `${fileSize} MB`,
        clipsCount: clipsWithFiles.length,
        message: 'Video concatenado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error concatenando clips:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error concatenando clips',
        details: error.message
      });
    }
  }

  @Get('concatenated/:videoId')
  async getConcatenatedVideo(@Param('videoId') videoId: string, @Res() res: Response) {
    try {
      const videoPath = path.join(process.cwd(), 'uploads', 'concatenated', `${videoId}.mp4`);

      if (!fs.existsSync(videoPath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          error: 'Video concatenado no encontrado'
        });
      }

      // Servir el archivo de video
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${videoId}.mp4"`);

      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);

    } catch (error) {
      console.error('❌ Error sirviendo video concatenado:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error sirviendo el video concatenado'
      });
    }
  }

  @Get('list/:matchId')
  async getClipsForMatch(@Param('matchId') matchId: string) {
    try {
      const clipsDir = path.join(process.cwd(), 'uploads', 'clips');

      if (!fs.existsSync(clipsDir)) {
        return [];
      }

      const files = fs.readdirSync(clipsDir);
      const clips = files
        .filter(file => file.startsWith('clip_') && file.endsWith('.mp4'))
        .map(file => {
          const clipId = file.replace('clip_', '').replace('.mp4', '');
          const filePath = path.join(clipsDir, file);
          const stats = fs.statSync(filePath);

          return {
            clipId,
            fileName: file,
            filePath,
            size: stats.size,
            createdAt: stats.birthtime
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return clips;

    } catch (error) {
      console.error('❌ Error listando clips:', error);
      return [];
    }
  }

  @Get('db/:matchId')
  async getClipsFromDatabase(@Param('matchId') matchId: string) {
    try {
      console.log('🔍 Obteniendo clips desde la base de datos para matchId:', matchId);

      // Obtener clips desde la base de datos
      if (!this.clipRepository) {
        console.warn('⚠️ DB no disponible');
        return []; // Retornar array vacío si no hay DB
      }

      const clips = await this.clipRepository.find({
        where: { matchId: parseInt(matchId) },
        order: { id: 'ASC' }
      });

      console.log('📋 Clips encontrados en la base de datos:', clips);

      // Para cada clip, verificar si existe el archivo físico
      const clipsWithFiles = await Promise.all(
        clips.map(async (clip) => {
          // Extraer el clipId del clip_url si existe
          let clipId = null;
          if (clip.clipUrl && clip.clipUrl.includes('/recortes/file/')) {
            clipId = clip.clipUrl.split('/').pop();
          }

          let fileExists = false;
          let fileSize = 0;
          let filePath = '';

          if (clipId) {
            const clipPath = path.join(process.cwd(), 'uploads', 'clips', `clip_${clipId}.mp4`);
            if (fs.existsSync(clipPath)) {
              fileExists = true;
              const stats = fs.statSync(clipPath);
              fileSize = stats.size;
              filePath = clipPath;
            }
          }

          return {
            id: clip.id,
            clipId: clipId,
            description: clip.description,
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: this.parseIntervalToSeconds(clip.startTime, clip.endTime),
            fileSize: fileExists ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB` : 'No disponible',
            clipPath: filePath,
            matchId: clip.matchId,
            aliasId: clip.aliasId,
            clipUrl: clip.clipUrl,
            fileExists,
            createdAt: new Date()
          };
        })
      );

      console.log('✅ Clips procesados:', clipsWithFiles);
      return clipsWithFiles;

    } catch (error) {
      console.error('❌ Error obteniendo clips desde la base de datos:', error);
      return [];
    }
  }

  @Post('process-edited')
  @UseInterceptors(FileInterceptor('watermark', {
    storage: diskStorage({
      destination: './uploads/temp',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `watermark_${uniqueSuffix}.${file.originalname.split('.').pop()}`);
      }
    })
  }))
  async processEditedVideo(
    @UploadedFile() watermarkFile: any,
    @Body() body: any,
    @Res() res: Response
  ) {
    try {
      const { clipId, settings } = body;

      console.log('🎬 Procesando video editado para clipId:', clipId);

      // Parsear settings si es string
      const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;

      console.log('📹 Configuración de edición:', parsedSettings);

      // Buscar el clip usando el clipId
      let videoClipId = clipId;

      const inputPath = path.join(process.cwd(), 'uploads', 'clips', `clip_${videoClipId}.mp4`);

      if (!fs.existsSync(inputPath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          error: 'Clip no encontrado'
        });
      }

      // Crear directorio para videos editados si no existe
      const editedDir = path.join(process.cwd(), 'uploads', 'edited');
      if (!fs.existsSync(editedDir)) {
        fs.mkdirSync(editedDir, { recursive: true });
        console.log('📁 Directorio edited creado:', editedDir);
      } else {
        console.log('📁 Directorio edited ya existe:', editedDir);
      }

      // Generar nombre único para el video editado (sin caracteres especiales)
      const editedId = `edited_${videoClipId}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '_');
      const outputPath = path.join(editedDir, `${editedId}.mp4`);

      console.log('📹 Iniciando procesamiento con FFmpeg');
      console.log('📹 Input:', inputPath);
      console.log('📹 Output:', outputPath);
      console.log('📹 Output existe:', fs.existsSync(outputPath));

      // Crear comando FFmpeg
      let ffmpegCommand = ffmpeg(inputPath);

      // Construir filtros de video
      const videoFilters: string[] = [];

      // Aplicar velocidad de reproducción
      if (parsedSettings.playbackSpeed !== 1) {
        const pts = (1 / parsedSettings.playbackSpeed).toFixed(3);
        videoFilters.push(`setpts=${pts}*PTS`);
        ffmpegCommand = ffmpegCommand.audioFilter(`atempo=${parsedSettings.playbackSpeed}`);
      }

      // Aplicar filtros de color
      switch (parsedSettings.colorFilter) {
        case 'vintage':
          videoFilters.push('curves=vintage');
          break;
        case 'bw':
          videoFilters.push('hue=s=0');
          break;
        case 'saturated':
          videoFilters.push('eq=saturation=1.7');
          break;
        case 'cool':
          videoFilters.push('curves=cool');
          break;
        case 'warm':
          videoFilters.push('curves=warm');
          break;
      }

      // Aplicar rotación
      if (parsedSettings.rotation !== 0) {
        videoFilters.push(`rotate=${parsedSettings.rotation}*PI/180`);
      }

      // Aplicar zoom
      if (parsedSettings.zoom !== 1) {
        videoFilters.push(`scale=iw*${parsedSettings.zoom}:ih*${parsedSettings.zoom},crop=iw:ih`);
      }

      // Aplicar filtros si hay alguno
      if (videoFilters.length > 0) {
        ffmpegCommand = ffmpegCommand.videoFilters(videoFilters.join(','));
      }

      // Aplicar resolución
      const resolutionMap: Record<string, string> = {
        '1080p': '1920:1080',
        '720p': '1280:720',
        '480p': '854:480'
      };
      if (parsedSettings.resolution !== 'original' && resolutionMap[parsedSettings.resolution]) {
        ffmpegCommand = ffmpegCommand.size(resolutionMap[parsedSettings.resolution]);
      }

      // Aplicar bitrate
      ffmpegCommand = ffmpegCommand.videoBitrate(`${parsedSettings.bitrate}k`);

      // Agregar texto overlay si está habilitado
      if (parsedSettings.textOverlay?.enabled && parsedSettings.textOverlay?.text) {
        const text = parsedSettings.textOverlay.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
        const fontSize = parsedSettings.textOverlay.fontSize || 24;
        const color = parsedSettings.textOverlay.color || '#FFFFFF';

        // Separar x e y según la posición
        let xPos = '10';
        let yPos = '10';

        switch (parsedSettings.textOverlay.position) {
          case 'top-center':
            xPos = '(w-tw)/2';
            yPos = '10';
            break;
          case 'top-right':
            xPos = 'w-tw-10';
            yPos = '10';
            break;
          case 'center':
            xPos = '(w-tw)/2';
            yPos = '(h-th)/2';
            break;
          case 'bottom-left':
            xPos = '10';
            yPos = 'h-th-10';
            break;
          case 'bottom-center':
            xPos = '(w-tw)/2';
            yPos = 'h-th-10';
            break;
          case 'bottom-right':
            xPos = 'w-tw-10';
            yPos = 'h-th-10';
            break;
          default: // top-left
            xPos = '10';
            yPos = '10';
        }

        // Usar DejaVu Sans que está disponible en Alpine Linux
        // Si falla, el video se procesará sin texto
        try {
          ffmpegCommand = ffmpegCommand.videoFilters(
            `drawtext=text='${text}':fontfile=/usr/share/fonts/dejavu/DejaVuSans.ttf:fontsize=${fontSize}:fontcolor=${color}:x=${xPos}:y=${yPos}:box=1:boxcolor=black@0.5:boxborderw=5`
          );
          console.log('✅ Texto overlay configurado');
        } catch (fontError) {
          console.warn('⚠️ No se pudo agregar texto overlay, continuando sin texto:', fontError);
        }
      }

      // Procesar el video
      await new Promise<void>((resolve, reject) => {
        // Normalizar la ruta para Windows
        const normalizedOutputPath = outputPath.replace(/\\/g, '/');

        ffmpegCommand
          .outputOptions([
            '-y', // Sobrescribir archivo si existe
            '-preset', 'medium',
            '-crf', '23'
          ])
          .on('start', (commandLine) => {
            console.log('🎬 Comando FFmpeg:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('📊 Progreso:', progress.percent + '%');
          })
          .on('end', () => {
            console.log('✅ Video editado exitosamente:', normalizedOutputPath);
            // Verificar que el archivo existe
            if (fs.existsSync(normalizedOutputPath)) {
              resolve();
            } else {
              reject(new Error('El archivo no se creó correctamente'));
            }
          })
          .on('error', (err, stdout, stderr) => {
            console.error('❌ Error procesando video editado:', err);
            console.error('❌ stdout:', stdout);
            console.error('❌ stderr:', stderr);
            reject(err);
          })
          .save(normalizedOutputPath);
      });

      // Obtener información del archivo
      const finalPath = fs.existsSync(outputPath) ? outputPath : outputPath.replace(/\\/g, '/');
      const stats = fs.statSync(finalPath);
      const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

      // Crear URL para el video editado
      const videoUrl = `/recortes/edited/${editedId}`;

      return res.json({
        success: true,
        editedVideoId: editedId,
        editedVideoUrl: videoUrl,
        fileSize: `${fileSize} MB`,
        message: 'Video editado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en processEditedVideo:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error procesando el video editado',
        details: error.message
      });
    }
  }

  @Get('edited')
  async listEditedVideos(@Res() res: Response) {
    try {
      const editedDir = path.join(process.cwd(), 'uploads', 'edited');

      if (!fs.existsSync(editedDir)) {
        return res.json([]);
      }

      const files = fs.readdirSync(editedDir).filter(file => file.endsWith('.mp4'));

      const videos = files.map(file => {
        const videoPath = path.join(editedDir, file);
        const stats = fs.statSync(videoPath);
        const videoId = file.replace('.mp4', '');

        return {
          id: videoId,
          filename: file,
          videoUrl: `/recortes/edited/${videoId}`,
          fileSize: (stats.size / (1024 * 1024)).toFixed(2), // MB
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      });

      // Ordenar por fecha de creación (más reciente primero)
      videos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return res.json(videos);

    } catch (error) {
      console.error('❌ Error listando videos editados:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error listando videos editados',
        details: error.message
      });
    }
  }

  @Get('edited/:videoId')
  async getEditedVideo(@Param('videoId') videoId: string, @Res() res: Response) {
    try {
      const videoPath = path.join(process.cwd(), 'uploads', 'edited', `${videoId}.mp4`);

      if (!fs.existsSync(videoPath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          error: 'Video editado no encontrado'
        });
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `inline; filename="${videoId}.mp4"`);

      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);

    } catch (error) {
      console.error('❌ Error sirviendo video editado:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error sirviendo el video editado'
      });
    }
  }

  private parseIntervalToSeconds(startTime: string | number, endTime: string | number): number {
    const start = this.parseInterval(startTime);
    const end = this.parseInterval(endTime);
    return end - start;
  }

  private parseInterval(interval: string | number): number {
    if (typeof interval === 'number') return interval;
    if (!interval || typeof interval !== 'string') return 0;

    // Parse PostgreSQL interval format (e.g., "00:00:30")
    const parts = interval.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }
} 