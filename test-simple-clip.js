const fs = require('fs');
const FormData = require('form-data');

async function testClipProcessing() {
  console.log('🎬 Probando procesamiento de clips...');
  
  try {
    // Crear un video de prueba simple
    const testVideoPath = 'test_video.mp4';
    const { spawn } = require('child_process');
    
    console.log('📹 Creando video de prueba...');
    
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'testsrc=duration=5:size=320x240:rate=30',
      '-f', 'lavfi',
      '-i', 'sine=frequency=1000:duration=5',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'ultrafast',
      '-y',
      testVideoPath
    ]);

    await new Promise((resolve, reject) => {
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Video de prueba creado');
          resolve();
        } else {
          reject(new Error(`FFmpeg falló con código ${code}`));
        }
      });
      
      ffmpeg.on('error', reject);
    });

    // Leer el video y crear FormData
    const videoBuffer = fs.readFileSync(testVideoPath);
    const formData = new FormData();
    formData.append('video', videoBuffer, 'test_video.mp4');
    formData.append('startTime', '1');
    formData.append('endTime', '3');
    formData.append('clipId', '999');

    console.log('🎬 Enviando solicitud de procesamiento...');
    
    const response = await fetch('http://localhost:3001/recortes/process-local', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Resultado del procesamiento:', result);
      console.log('🎯 Clip procesado exitosamente!');
    } else {
      const errorText = await response.text();
      console.error('❌ Error en la respuesta:', response.status, response.statusText);
      console.error('📄 Detalles del error:', errorText);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    // Limpiar archivo de prueba
    try {
      if (fs.existsSync('test_video.mp4')) {
        fs.unlinkSync('test_video.mp4');
        console.log('🗑️ Archivo de prueba eliminado');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo eliminar archivo de prueba:', error);
    }
  }
}

testClipProcessing(); 