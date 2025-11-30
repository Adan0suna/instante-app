import { Injectable } from '@nestjs/common';
import { GoogleDriveProvider } from './google-drive.provider';
import { MegaProvider } from './mega.provider';
import { StorageProvider, StorageUploadOptions, StorageUploadResult } from './storage.interface';

export type StorageProviderType = 'google-drive' | 'mega';

@Injectable()
export class StorageService {
  private providers: Map<StorageProviderType, StorageProvider>;

  constructor(
    private readonly googleDriveProvider: GoogleDriveProvider,
    private readonly megaProvider: MegaProvider,
  ) {
    this.providers = new Map();
    this.providers.set('google-drive', this.googleDriveProvider);
    this.providers.set('mega', this.megaProvider);
  }

  /**
   * Obtiene el proveedor de almacenamiento solicitado
   */
  getProvider(type: StorageProviderType): StorageProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Proveedor de almacenamiento '${type}' no encontrado`);
    }
    return provider;
  }

  /**
   * Comprime y sube un archivo usando el proveedor especificado
   */
  async compressAndUpload(
    providerType: StorageProviderType,
    localPath: string,
    credentials: any,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const provider = this.getProvider(providerType);
    return provider.compressAndUpload(localPath, credentials, options);
  }

  /**
   * Obtiene una URL pública del archivo
   */
  async getPublicUrl(
    providerType: StorageProviderType,
    fileId: string,
    credentials?: any
  ): Promise<string> {
    const provider = this.getProvider(providerType);
    return provider.getPublicUrl(fileId, credentials);
  }

  /**
   * Elimina un archivo del proveedor
   */
  async deleteFile(
    providerType: StorageProviderType,
    fileId: string,
    credentials?: any
  ): Promise<void> {
    const provider = this.getProvider(providerType);
    return provider.deleteFile(fileId, credentials);
  }

  /**
   * Obtiene la lista de proveedores disponibles
   */
  getAvailableProviders(): StorageProviderType[] {
    return Array.from(this.providers.keys());
  }
}


