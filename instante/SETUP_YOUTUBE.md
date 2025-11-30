# 🎬 Configuración de Integración con YouTube

Esta guía te ayudará a configurar la integración de Instante con YouTube para poder subir videos directamente desde la aplicación.

## 📋 Requisitos Previos

- Cuenta de Google con acceso a YouTube
- Proyecto en Google Cloud Console
- API de YouTube Data v3 habilitada

## 🚀 Paso 1: Crear Proyecto en Google Cloud Console

1. **Ir a Google Cloud Console**
   - Ve a [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Inicia sesión con tu cuenta de Google

2. **Crear nuevo proyecto**
   - Haz clic en el selector de proyectos en la parte superior
   - Selecciona "Nuevo proyecto"
   - Dale un nombre como "Instante YouTube Integration"
   - Haz clic en "Crear"

3. **Seleccionar el proyecto**
   - Asegúrate de que tu nuevo proyecto esté seleccionado

## 🔑 Paso 2: Habilitar YouTube Data API v3

1. **Ir a la biblioteca de APIs**
   - En el menú lateral, ve a "APIs y servicios" > "Biblioteca"

2. **Buscar YouTube Data API v3**
   - Busca "YouTube Data API v3"
   - Haz clic en el resultado

3. **Habilitar la API**
   - Haz clic en "Habilitar"

## 👤 Paso 3: Configurar Pantalla de Consentimiento OAuth

1. **Ir a pantalla de consentimiento**
   - En el menú lateral, ve a "APIs y servicios" > "Pantalla de consentimiento OAuth"

2. **Seleccionar tipo de usuario**
   - Selecciona "Externo" (si no tienes Google Workspace)
   - Haz clic en "Crear"

3. **Completar información básica**
   - **Nombre de la app**: "Instante"
   - **Correo electrónico de soporte**: Tu correo
   - **Logo**: Opcional
   - **Dominio de la app**: `localhost` (para desarrollo)
   - **Correo electrónico del desarrollador**: Tu correo

4. **Configurar scopes**
   - Haz clic en "Agregar o quitar scopes"
   - Busca y agrega estos scopes:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
   - Haz clic en "Actualizar"

5. **Agregar usuarios de prueba**
   - En "Usuarios de prueba", agrega tu correo de Google
   - Haz clic en "Guardar y continuar"

6. **Revisar y publicar**
   - Revisa toda la información
   - Haz clic en "Volver al panel"

## 🔐 Paso 4: Crear Credenciales OAuth 2.0

1. **Ir a credenciales**
   - En el menú lateral, ve a "APIs y servicios" > "Credenciales"

2. **Crear credenciales**
   - Haz clic en "Crear credenciales"
   - Selecciona "ID de cliente de OAuth 2.0"

3. **Configurar tipo de aplicación**
   - Selecciona "Aplicación web"
   - Dale un nombre como "Instante Web Client"

4. **Configurar URIs autorizados**
   - **Orígenes de JavaScript autorizados**:
     - `http://localhost:5173`
     - `http://localhost:3000`
   - **URIs de redirección autorizados**:
     - `http://localhost:5173/youtube/callback`
     - `http://localhost:3000/youtube/callback`

5. **Crear credenciales**
   - Haz clic en "Crear"
   - **IMPORTANTE**: Guarda el Client ID y Client Secret que se muestran

## 📝 Paso 5: Crear Archivo de Variables de Entorno

1. **Crear archivo `.env`**
   - En la carpeta `instante/`, crea un archivo llamado `.env`

2. **Agregar configuración**
   ```env
   VITE_YOUTUBE_API_KEY=tu_api_key_aqui
   VITE_YOUTUBE_CLIENT_ID=tu_client_id_aqui
   VITE_YOUTUBE_CLIENT_SECRET=tu_client_secret_aqui
   VITE_YOUTUBE_REDIRECT_URI=http://localhost:5173/youtube/callback
   ```

3. **Reemplazar valores**
   - `tu_client_id_aqui`: El Client ID que obtuviste en el paso 4
   - `tu_client_secret_aqui`: El Client Secret que obtuviste en el paso 4
   - `tu_api_key_aqui`: Puedes usar el mismo Client ID o crear una API Key separada

## 🎯 Paso 6: Crear API Key (Opcional)

Si quieres crear una API Key separada:

1. **Ir a credenciales**
   - En "APIs y servicios" > "Credenciales"

2. **Crear API Key**
   - Haz clic en "Crear credenciales"
   - Selecciona "Clave de API"

3. **Restringir API Key**
   - Haz clic en "Restringir clave"
   - Selecciona "YouTube Data API v3"
   - Haz clic en "Guardar"

## 🚀 Paso 7: Probar la Integración

1. **Reiniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

2. **Ir a un partido**
   - Navega a cualquier partido en la aplicación
   - Haz clic en "Subir a YouTube"

3. **Autenticarse**
   - Haz clic en "Conectar con YouTube"
   - Completa el flujo de OAuth
   - Acepta los permisos solicitados

4. **Subir video**
   - Una vez autenticado, podrás subir videos
   - Configura título, descripción, etiquetas y privacidad
   - Haz clic en "Subir a YouTube"

## 🔧 Solución de Problemas

### Error: "redirect_uri_mismatch"
- Verifica que la URI de redirección en Google Cloud coincida exactamente con `http://localhost:5173/youtube/callback`

### Error: "invalid_client"
- Verifica que el Client ID y Client Secret estén correctos en el archivo `.env`

### Error: "access_denied"
- Asegúrate de que hayas agregado tu correo como usuario de prueba en la pantalla de consentimiento

### Error: "quota_exceeded"
- La API de YouTube tiene límites diarios. Para desarrollo, deberían ser suficientes.

## 📚 Recursos Adicionales

- [Documentación oficial de YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Guía de OAuth 2.0 de Google](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🎉 ¡Listo!

Una vez configurado, podrás:
- ✅ Conectar tu cuenta de YouTube
- ✅ Subir videos directamente desde Instante
- ✅ Configurar metadatos (título, descripción, etiquetas)
- ✅ Elegir privacidad (privado, no listado, público)
- ✅ Ver estadísticas del video subido

¡Disfruta subiendo tus partidos a YouTube desde Instante! 🚀⚽

