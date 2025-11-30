import * as dotenv from 'dotenv';

dotenv.config();

export const envConfig = {
  // Supabase
  supabase: {
    host: process.env.SUPABASE_HOST || 'aws-0-us-east-1.pooler.supabase.com',
    port: parseInt(process.env.SUPABASE_PORT) || 6543,
    user: process.env.SUPABASE_USER || 'postgres.uothcctfocnbjxyopxrg',
    password: process.env.SUPABASE_PASSWORD || 'O2d5rcj9sMZte253',
    database: process.env.SUPABASE_DATABASE || 'postgres',
  },
  
  // Google Drive
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '1092005345522-9dn5pk996s8kvp2f0mrv1cf6r6kigfnl.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/google-drive/oauth-callback',
  },
  
  // MEGA (nota: las credenciales deben venir del frontend cuando el usuario se autentica)
  mega: {
    // Estas son opcionales, ya que las credenciales vienen del usuario
    // Solo las incluimos por si acaso se necesita una cuenta por defecto
  },
  
  // Server
  server: {
    port: parseInt(process.env.PORT) || 3001,
  },
}; 