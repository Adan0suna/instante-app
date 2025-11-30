# Sistema de Pausa Inteligente para Subidas

## Descripción

Este sistema implementa una funcionalidad de pausa automática para las subidas de videos cuando la conexión a internet no es adecuada. Los videos se almacenan localmente y se suben automáticamente cuando la conexión mejora.

## Características Principales

### 🔍 Detección Inteligente de Conexión
- **Monitoreo continuo** del estado de la conexión a internet
- **Medición de velocidad** de subida y descarga
- **Clasificación de calidad**: Excelente, Buena, Lenta, Sin conexión
- **Detección automática** de cambios en la conectividad

### 📤 Cola de Subidas Inteligente
- **Almacenamiento local** de videos pendientes
- **Reintentos automáticos** con configuración personalizable
- **Procesamiento en cola** con límite de subidas concurrentes
- **Persistencia** de la cola entre sesiones

### 🎯 Toma de Decisiones Automática
- **Evaluación automática** de si la conexión es adecuada para el tamaño del archivo
- **Pausa automática** cuando la conexión es lenta o inexistente
- **Reanudación automática** cuando la conexión mejora
- **Estimación de tiempo** de subida basada en la velocidad de conexión

## Componentes Implementados

### 1. `useConnectionStatus` Hook
```typescript
// Detecta el estado de la conexión y su calidad
const { connectionStatus, isConnectionAdequateForUpload, getEstimatedUploadTime } = useConnectionStatus();
```

**Funcionalidades:**
- Monitoreo de conectividad en tiempo real
- Medición de velocidad de conexión
- Evaluación de adecuación para subidas
- Estimación de tiempo de subida

### 2. `useUploadQueue` Hook
```typescript
// Maneja la cola de subidas pendientes
const { addToQueue, pendingUploads, retryFailedUploads, cancelUpload } = useUploadQueue();
```

**Funcionalidades:**
- Gestión de cola de subidas
- Reintentos automáticos
- Almacenamiento local persistente
- Procesamiento automático cuando la conexión mejora

### 3. `useMatchWithQueue` Hook
```typescript
// Versión mejorada del hook useMatch con sistema de cola
const { uploadVideo, connectionStatus, pendingUploads } = useMatchWithQueue();
```

**Funcionalidades:**
- Integración del sistema de cola con la lógica de subida existente
- Toma de decisiones automática sobre subida inmediata vs. cola
- Manejo de errores de conexión

### 4. `UploadQueueStatus` Componente
```typescript
// Interfaz para mostrar el estado de la cola de subidas
<UploadQueueStatus />
```

**Funcionalidades:**
- Visualización de subidas pendientes
- Control de reintentos
- Cancelación de subidas
- Limpieza de subidas completadas

### 5. `ConnectionNotification` Componente
```typescript
// Notificaciones sobre cambios en la conexión
<ConnectionNotification />
```

**Funcionalidades:**
- Notificaciones automáticas de cambios de conexión
- Alertas de subidas completadas
- Información sobre el estado de la cola

## Flujo de Trabajo

### 1. Grabación de Video
```
Usuario graba video → Sistema evalúa conexión → Decisión automática
```

### 2. Evaluación de Conexión
```
Conexión excelente → Subida inmediata
Conexión buena → Subida inmediata (archivos pequeños) o cola (archivos grandes)
Conexión lenta → Agregar a cola
Sin conexión → Agregar a cola
```

### 3. Gestión de Cola
```
Video agregado a cola → Almacenamiento local → Monitoreo de conexión → Subida automática
```

### 4. Reintentos
```
Subida fallida → Evaluar causa → Reintentar automáticamente → Máximo 3 intentos
```

## Configuración

### Parámetros de la Cola
```typescript
const config = {
  maxConcurrentUploads: 1,    // Máximo de subidas simultáneas
  retryDelay: 5000,          // Delay entre reintentos (ms)
  maxRetries: 3,             // Máximo número de reintentos
  autoRetry: true            // Reintentos automáticos
};
```

### Umbrales de Conexión
```typescript
// Criterios para determinar calidad de conexión
excellent: uploadSpeed >= 3 Mbps && downloadSpeed >= 5 Mbps
good: uploadSpeed >= 1 Mbps && downloadSpeed >= 2 Mbps
poor: uploadSpeed < 1 Mbps || downloadSpeed < 2 Mbps
offline: !navigator.onLine
```

## Interfaz de Usuario

### Indicadores Visuales
- **Indicador de conexión** en la esquina superior derecha
- **Cola de subidas** en la esquina inferior derecha (cuando hay subidas pendientes)
- **Notificaciones** automáticas de cambios de estado
- **Barra de progreso** mejorada con información de conexión

### Estados de la Cola
- **Pendiente**: Esperando procesamiento
- **Subiendo**: En proceso de subida
- **Completado**: Subida exitosa
- **Fallido**: Error en la subida
- **Pausado**: Pausado por conexión inadecuada

## Almacenamiento Local

### Persistencia de Datos
- **localStorage**: Información de subidas pendientes
- **IndexedDB**: Archivos de video (opcional, para archivos grandes)
- **Recuperación automática**: Al reiniciar la aplicación

### Limpieza Automática
- **Subidas completadas**: Se eliminan automáticamente
- **Subidas fallidas**: Se mantienen para reintento manual
- **Archivos temporales**: Se limpian periódicamente

## Beneficios

### Para el Usuario
- ✅ **Sin pérdida de datos** por problemas de conexión
- ✅ **Experiencia fluida** sin interrupciones
- ✅ **Transparencia** sobre el estado de las subidas
- ✅ **Control manual** cuando sea necesario

### Para el Sistema
- ✅ **Eficiencia de red** optimizada
- ✅ **Reducción de errores** por conexión inestable
- ✅ **Mejor utilización** de recursos
- ✅ **Escalabilidad** para múltiples usuarios

## Casos de Uso

### 1. Conexión Inestable
```
Usuario graba video → Conexión se pierde → Video se guarda localmente → 
Conexión se restaura → Subida automática
```

### 2. Archivo Grande con Conexión Lenta
```
Usuario graba video grande → Sistema detecta conexión lenta → 
Video se agrega a cola → Usuario puede continuar grabando → 
Subida automática cuando la conexión mejore
```

### 3. Múltiples Videos
```
Usuario graba varios videos → Todos se agregan a cola → 
Procesamiento secuencial automático → Notificaciones de progreso
```

## Monitoreo y Debugging

### Logs del Sistema
```javascript
console.log('🌐 Conexión restaurada');
console.log('📤 Video agregado a la cola de subidas');
console.log('✅ Subida completada');
console.log('❌ Error en subida, reintentando...');
```

### Métricas Disponibles
- Estado de conexión en tiempo real
- Número de subidas pendientes
- Tiempo estimado de subida
- Historial de reintentos
- Tasa de éxito de subidas

## Extensibilidad

### Futuras Mejoras
- **Compresión automática** de videos para conexiones lentas
- **Subida por partes** para archivos muy grandes
- **Priorización** de subidas por importancia
- **Sincronización** entre dispositivos
- **Modo offline** completo con sincronización posterior

### Integración con Otros Servicios
- **Google Drive**: Subida optimizada
- **YouTube**: Subida directa con cola
- **AWS S3**: Almacenamiento en la nube
- **Servicios de CDN**: Distribución global

## Conclusión

El Sistema de Pausa Inteligente proporciona una solución robusta y automática para manejar las subidas de videos en condiciones de conexión inestable. Mejora significativamente la experiencia del usuario y la confiabilidad del sistema, asegurando que ningún contenido se pierda debido a problemas de conectividad.
