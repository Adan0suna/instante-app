// Script para probar la configuración de Google Drive
const BACKEND_URL = 'http://localhost:3001';

async function testGoogleDriveSetup() {
  console.log('🧪 Probando configuración de Google Drive...\n');

  try {
    // 1. Verificar estado del backend
    console.log('1️⃣ Verificando estado del backend...');
    const statusResponse = await fetch(`${BACKEND_URL}/google-drive/status`);
    const status = await statusResponse.json();
    console.log('📊 Estado:', status);

    // 2. Obtener URL de autenticación
    console.log('\n2️⃣ Obteniendo URL de autenticación...');
    const authResponse = await fetch(`${BACKEND_URL}/google-drive/auth-url`);
    const authData = await authResponse.json();
    console.log('🔗 URL de autenticación:', authData.authUrl);

    // 3. Probar conexión (sin tokens)
    console.log('\n3️⃣ Probando conexión sin tokens...');
    const testResponse = await fetch(`${BACKEND_URL}/google-drive/test-connection`);
    const testData = await testResponse.json();
    console.log('🔌 Test de conexión:', testData);

    console.log('\n✅ Configuración básica verificada');
    console.log('\n📋 Pasos para completar la configuración:');
    console.log('1. Ve a la URL de autenticación mostrada arriba');
    console.log('2. Autoriza la aplicación');
    console.log('3. Copia los tokens de la respuesta');
    console.log('4. Usa el endpoint /google-drive/set-tokens para configurar los tokens');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

testGoogleDriveSetup(); 