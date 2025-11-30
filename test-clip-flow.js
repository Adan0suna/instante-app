// Script de prueba para verificar el flujo de clips
const fs = require('fs');

async function testClipFlow() {
  console.log('🧪 Iniciando prueba del flujo de clips...');
  
  try {
    // 1. Crear un recorte
    console.log('📹 Creando recorte...');
    const recorteResponse = await fetch('http://localhost:3001/recortes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoUrl: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
        startTime: 30,
        endTime: 60,
        outputFormat: 'mp4'
      })
    });
    
    if (!recorteResponse.ok) {
      throw new Error(`Error al crear recorte: ${recorteResponse.status}`);
    }
    
    const recorte = await recorteResponse.json();
    console.log('✅ Recorte creado:', recorte);
    
    // 2. Esperar a que el recorte esté listo
    console.log('⏳ Esperando a que el recorte esté listo...');
    let attempts = 0;
    const maxAttempts = 30;
    let recorteStatus = recorte;
    
    while (recorteStatus.status === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await fetch(`http://localhost:3001/recortes/${recorte.id}`);
      recorteStatus = await statusResponse.json();
      attempts++;
      console.log(`📊 Estado del recorte (intento ${attempts}):`, recorteStatus.status);
    }
    
    if (recorteStatus.status === 'completed' && recorteStatus.outputUrl) {
      console.log('✅ Recorte completado:', recorteStatus.outputUrl);
      
      // 3. Descargar el archivo procesado
      console.log('📥 Descargando archivo procesado...');
      const fileResponse = await fetch(`http://localhost:3001${recorteStatus.outputUrl}`);
      
      if (!fileResponse.ok) {
        throw new Error(`Error al descargar archivo: ${fileResponse.status}`);
      }
      
      const buffer = await fileResponse.arrayBuffer();
      console.log('✅ Archivo descargado, tamaño:', buffer.byteLength, 'bytes');
      
      // 4. Subir a Google Drive
      console.log('📤 Subiendo a Google Drive...');
      const formData = new FormData();
      const blob = new Blob([buffer], { type: 'video/mp4' });
      formData.append('file', blob, 'test_clip.mp4');
      formData.append('fileName', 'test_clip.mp4');
      formData.append('folderId', 'clips');
      
      const uploadResponse = await fetch('http://localhost:3001/recordings/upload-clip', {
        method: 'POST',
        body: formData
      });
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log('✅ Clip subido exitosamente a Google Drive:', result);
      } else {
        const errorText = await uploadResponse.text();
        console.error('❌ Error al subir clip:', errorText);
      }
    } else {
      console.error('❌ Recorte falló:', recorteStatus);
    }
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error);
  }
}

testClipFlow(); 