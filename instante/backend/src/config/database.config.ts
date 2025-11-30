import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { envConfig } from './env.config';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envConfig.supabase.host,
  port: envConfig.supabase.port,
  username: envConfig.supabase.user,
  password: envConfig.supabase.password,
  database: envConfig.supabase.database,
  entities: [__dirname + '/../models/*.entity{.ts,.js}'],
  synchronize: false, // Desactivado para producción
  ssl: {
    rejectUnauthorized: false,
  },
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
}; 