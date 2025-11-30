import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envConfig } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  const port = envConfig.server.port;
  await app.listen(port);
  console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
  console.log(`📊 Base de datos: ${envConfig.supabase.host}`);
}
bootstrap(); 