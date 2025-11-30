const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando variables de entorno para el backend...');

// Verificar si existe el archivo .env
const envPath = path.join(__dirname, 'instante/backend/.env');
const configPath = path.join(__dirname, 'instante/backend/config.env');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo .env...');
  
  // Leer el archivo de configuración
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Escribir el archivo .env
  fs.writeFileSync(envPath, configContent);
  
  console.log('✅ Archivo .env creado exitosamente');
  console.log('⚠️ IMPORTANTE: Edita el archivo instante/backend/.env y agrega tu clave anónima de Supabase');
  console.log('   Puedes encontrar la clave en: https://uothcctfocnbjxyopxrg.supabase.co/settings/api');
} else {
  console.log('✅ El archivo .env ya existe');
}

console.log('🎯 Para obtener tu clave anónima de Supabase:');
console.log('   1. Ve a https://uothcctfocnbjxyopxrg.supabase.co/settings/api');
console.log('   2. Copia la "anon public" key');
console.log('   3. Reemplaza "tu_clave_anonima_aqui" en instante/backend/.env');
console.log('   4. Reinicia el servidor backend'); 