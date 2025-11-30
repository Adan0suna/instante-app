import { useState, useEffect, useCallback } from 'react';
import type { StorageProviderType, StorageCredentials, StorageConfig } from '../lib/storage/types';

const STORAGE_CONFIG_KEY = 'storageConfig';

export function useStorage() {
  const [provider, setProvider] = useState<StorageProviderType>('google-drive');
  const [credentials, setCredentials] = useState<StorageCredentials>({});

  // Cargar configuración del localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) {
        const config: StorageConfig = JSON.parse(saved);
        setProvider(config.provider);
        setCredentials(config.credentials || {});
      } else {
        // Si no hay configuración guardada, cargar Google Drive si existe
        const driveTokens = localStorage.getItem('googleDriveTokens');
        if (driveTokens) {
          try {
            const tokens = JSON.parse(driveTokens);
            setCredentials({
              googleDrive: tokens,
            });
          } catch (e) {
            console.error('Error leyendo tokens de Google Drive:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando configuración de almacenamiento:', error);
    }
  }, []);

  // Guardar configuración en localStorage
  const saveConfig = useCallback((newProvider: StorageProviderType, newCredentials: StorageCredentials) => {
    const config: StorageConfig = {
      provider: newProvider,
      credentials: newCredentials,
    };
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    setProvider(newProvider);
    setCredentials(newCredentials);
  }, []);

  // Actualizar proveedor
  const updateProvider = useCallback((newProvider: StorageProviderType) => {
    const currentConfig: StorageConfig = {
      provider: newProvider,
      credentials,
    };
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(currentConfig));
    setProvider(newProvider);
  }, [credentials]);

  // Configurar credenciales de Google Drive
  const setGoogleDriveCredentials = useCallback((tokens: { access_token: string; refresh_token: string; token_type?: string }) => {
    const newCredentials = {
      ...credentials,
      googleDrive: tokens,
    };
    saveConfig(provider, newCredentials);
    
    // También guardar en el lugar donde se espera (compatibilidad)
    localStorage.setItem('googleDriveTokens', JSON.stringify(tokens));
  }, [credentials, provider, saveConfig]);

  // Configurar credenciales de MEGA
  const setMegaCredentials = useCallback((megaCreds: { email: string; password: string }) => {
    const newCredentials = {
      ...credentials,
      mega: megaCreds,
    };
    saveConfig(provider, newCredentials);
  }, [credentials, provider, saveConfig]);

  // Obtener credenciales del proveedor actual
  const getCurrentCredentials = useCallback(() => {
    if (provider === 'google-drive') {
      return credentials.googleDrive;
    } else if (provider === 'mega') {
      return credentials.mega;
    }
    return null;
  }, [provider, credentials]);

  // Verificar si el proveedor actual tiene credenciales
  const hasCredentials = useCallback(() => {
    if (provider === 'google-drive') {
      return !!credentials.googleDrive?.access_token;
    } else if (provider === 'mega') {
      return !!credentials.mega?.email && !!credentials.mega?.password;
    }
    return false;
  }, [provider, credentials]);

  return {
    provider,
    credentials,
    updateProvider,
    setGoogleDriveCredentials,
    setMegaCredentials,
    getCurrentCredentials,
    hasCredentials,
    saveConfig,
  };
}


