/**
 * Interfaz para proveedores de almacenamiento
 * Permite agregar diferentes servicios de almacenamiento (Google Drive, MEGA, Dropbox, etc.)
 */
export interface StorageUploadOptions {
  bitrate?: string;
  resolution?: string;
  folderId?: string;
  title?: string;
}

export interface StorageUploadResult {
  fileId: string;
  viewUrl: string;
  previewUrl?: string;
  embedUrl?: string;
  downloadUrl?: string;
  provider: 'google-drive' | 'mega' | 'dropbox' | 'supabase';
}

export interface StorageProvider {
  /**
   * Comprime y sube un archivo al proveedor de almacenamiento
   * @param localPath Ruta local del archivo
   * @param credentials Credenciales del usuario para el proveedor
   * @param options Opciones de compresión y metadatos
   * @returns Información del archivo subido
   */
  compressAndUpload(
    localPath: string,
    credentials: any,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult>;

  /**
   * Obtiene una URL pública para compartir el archivo
   * @param fileId ID del archivo en el proveedor
   * @param credentials Credenciales del usuario
   * @returns URL pública
   */
  getPublicUrl(fileId: string, credentials?: any): Promise<string>;

  /**
   * Elimina un archivo del proveedor
   * @param fileId ID del archivo
   * @param credentials Credenciales del usuario
   */
  deleteFile(fileId: string, credentials?: any): Promise<void>;
}


