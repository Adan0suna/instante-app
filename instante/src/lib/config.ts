/**
 * Configuración centralizada de la aplicación
 * 
 * En desarrollo: usa http://localhost:3001
 * En producción: usa la variable de entorno VITE_BACKEND_URL configurada en Vercel
 */

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

/**
 * Verifica si estamos en modo desarrollo
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Verifica si estamos en modo producción
 */
export const isProduction = import.meta.env.PROD;

/**
 * Helper para construir URLs del backend
 */
export function getBackendUrl(path: string): string {
  // Si el path ya es una URL completa, devolverlo tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Asegurar que el path empiece con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Construir la URL completa
  return `${BACKEND_URL}${normalizedPath}`;
}

/**
 * Helper para verificar si una URL es del backend local
 */
export function isBackendUrl(url: string): boolean {
  return url.includes('localhost:3001') || url.startsWith(BACKEND_URL);
}

