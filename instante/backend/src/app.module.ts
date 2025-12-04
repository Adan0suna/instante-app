import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingController } from './controllers/recording.controller';
import { GoogleDriveController } from './controllers/google-drive.controller';
import { RecortesController } from './controllers/recortes.controller';
import { WhatsAppController } from './controllers/whatsapp.controller';
import { RecordingService } from './services/recording.service';
import { RecortesService } from './services/recortes.service';
import { Recording } from './models/recording.entity';
import { Highlight } from './models/highlight.entity';
import { Clip } from './models/clip.entity';
import { databaseConfig } from './config/database.config';
import { StorageService } from './providers/storage/storage.service';
import { GoogleDriveProvider } from './providers/storage/google-drive.provider';
import { MegaProvider } from './providers/storage/mega.provider';

@Module({
  imports: [
    // Conexión a base de datos Supabase
    TypeOrmModule.forRoot({
      ...databaseConfig,
      retryAttempts: 3,
      retryDelay: 3000,
    }),
    TypeOrmModule.forFeature([Recording, Highlight, Clip]),
  ],
  controllers: [RecordingController, GoogleDriveController, RecortesController, WhatsAppController],
  providers: [
    RecordingService,
    RecortesService,
    // Proveedores de almacenamiento
    GoogleDriveProvider,
    MegaProvider,
    StorageService,
  ],
})
export class AppModule { } 