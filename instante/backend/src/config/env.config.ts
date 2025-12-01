import * as dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== 'production';

// Función para obtener variable de entorno requerida
function getRequiredEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value && !isDevelopment) {
    throw new Error(
      `❌ Variable de entorno requerida faltante: ${key}\n` +
      `   Por favor, configura esta variable en tu plataforma de deploy (Railway, etc.)`
    );
  }
  
  if (!value) {
    console.warn(`⚠️  Advertencia: Variable de entorno ${key} no configurada. Usando valor por defecto para desarrollo.`);
  }
  
  return value || '';
}

// Función para obtener variable de entorno opcional
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const envConfig = {
  // Supabase - TODAS REQUERIDAS en producción
  supabase: {
    host: getRequiredEnv('SUPABASE_HOST', isDevelopment ? 'localhost' : undefined),
    port: parseInt(getRequiredEnv('SUPABASE_PORT', isDevelopment ? '5432' : undefined) || '5432'),
    user: getRequiredEnv('SUPABASE_USER', isDevelopment ? 'postgres' : undefined),
    password: getRequiredEnv('SUPABASE_PASSWORD', isDevelopment ? 'postgres' : undefined),
    database: getRequiredEnv('SUPABASE_DATABASE', isDevelopment ? 'postgres' : undefined),
  },
  
  // Google Drive - TODAS REQUERIDAS en producción
  google: {
    clientId: getRequiredEnv('GOOGLE_CLIENT_ID', undefined),
    clientSecret: getRequiredEnv('GOOGLE_CLIENT_SECRET', undefined),
    redirectUri: getOptionalEnv(
      'GOOGLE_REDIRECT_URI',
      isDevelopment 
        ? 'http://localhost:3001/google-drive/oauth-callback'
        : ''
    ),
  },
  
  // MEGA (nota: las credenciales deben venir del frontend cuando el usuario se autentica)
  mega: {
    // Estas son opcionales, ya que las credenciales vienen del usuario
    // Solo las incluimos por si acaso se necesita una cuenta por defecto
  },
  
  // Server - PORT es opcional, Railway/Vercel lo inyectan automáticamente
  server: {
    port: parseInt(getOptionalEnv('PORT', '3001')),
  },
}; 