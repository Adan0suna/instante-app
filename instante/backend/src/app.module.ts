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
    // Comentado temporalmente para evitar errores de conexión a DB
    // TypeOrmModule.forRoot({
    //   ...databaseConfig,
    //   retryAttempts: 1,
    //   retryDelay: 1000,
    // }),
    // TypeOrmModule.forFeature([Recording, Highlight, Clip]),
  ],
  controllers: [GoogleDriveController, RecortesController, WhatsAppController], // RecordingController comentado temporalmente
  // Comentado temporalmente porque depende de DB
  // providers: [RecordingService, RecortesService],
  providers: [
    // Proveedores de almacenamiento
    GoogleDriveProvider,
    MegaProvider,
    StorageService,
  ],
})
export class AppModule {} 