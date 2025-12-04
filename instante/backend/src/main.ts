import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS - Permitir frontend local y de Vercel
  const allowedOrigins = [
    'https://instante-app-23g2.vercel.app',
    'https://instante-app-23g2.vercel.app', // Vite dev server
    process.env.FRONTEND_URL, // URL de producción en Vercel
  ].filter(Boolean); // Elimina valores undefined

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true, // Si no hay URLs, permite todas (solo en desarrollo)
    credentials: true,
  });

  const port = process.env.PORT || envConfig.server.port;
  await app.listen(port, '0.0.0.0'); // Escuchar en todas las interfaces para producción
  console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
  console.log(`📊 Base de datos: ${envConfig.supabase.host}`);
}
bootstrap(); 