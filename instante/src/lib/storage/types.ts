export type StorageProviderType = 'google-drive' | 'mega';

export interface StorageCredentials {
  googleDrive?: {
    access_token: string;
    refresh_token: string;
    token_type?: string;
  };
  mega?: {
    email: string;
    password: string;
  };
}

export interface StorageConfig {
  provider: StorageProviderType;
  credentials: StorageCredentials;
}


