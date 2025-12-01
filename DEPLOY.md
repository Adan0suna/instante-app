# Guía de Deploy - Instante App

Esta guía te ayudará a desplegar tanto el frontend (Vercel) como el backend (Railway).

## 🎯 Resumen

- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (NestJS)
- **Base de datos**: Supabase (PostgreSQL)

---

## 📦 Deploy del Backend en Railway

### Paso 1: Preparar el código

1. Asegúrate de que el código esté en GitHub:
```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

### Paso 2: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Clic en "New Project"

### Paso 3: Conectar el repositorio

1. Selecciona "Deploy from GitHub repo"
2. Conecta tu repositorio `instante-app`
3. Selecciona la carpeta `instante/backend` como raíz del proyecto
   - En Railway, ve a Settings → Root Directory → `instante/backend`

### Paso 4: Configurar variables de entorno

En Railway, ve a Variables y agrega **TODAS** estas variables (son requeridas):

```
# Base de datos Supabase (REQUERIDO)
SUPABASE_HOST=db.tu-proyecto.supabase.co
SUPABASE_PORT=6543
SUPABASE_USER=postgres.tu-usuario
SUPABASE_PASSWORD=tu_contraseña
SUPABASE_DATABASE=postgres

# Google OAuth (REQUERIDO)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=https://tu-backend.railway.app/google-drive/oauth-callback

# NOTA IMPORTANTE: 
# NO necesitas configurar GOOGLE_ACCESS_TOKEN ni GOOGLE_REFRESH_TOKEN
# Estos tokens se obtienen automáticamente cuando el usuario se autentica con Google OAuth

# Frontend URL (REQUERIDO - la pondrás después de deployar frontend)
FRONTEND_URL=https://tu-frontend.vercel.app

# Puerto (opcional, Railway lo inyecta automáticamente)
PORT=3001

# Entorno (opcional, pero recomendado)
NODE_ENV=production
```

**⚠️ IMPORTANTE**: 
- Todas estas variables son **REQUERIDAS** en producción
- El backend fallará al iniciar si faltan alguna de las variables críticas
- No uses valores de ejemplo - usa tus credenciales reales

### Paso 5: Instalar ffmpeg (si es necesario)

Railway detecta automáticamente Node.js, pero para ffmpeg necesitas:

1. Ve a Settings → Build Command
2. Railway debería instalar dependencias automáticamente
3. Si tienes problemas con ffmpeg, considera usar un contenedor Docker

### Paso 6: Obtener la URL del backend

1. Railway generará automáticamente una URL como: `https://tu-backend.railway.app`
2. **Copia esta URL** - la necesitarás para el frontend

---

## 🚀 Deploy del Frontend en Vercel

### Paso 1: Conectar con GitHub

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con GitHub
3. Clic en "Add New Project"
4. Selecciona tu repositorio `instante-app`

### Paso 2: Configurar el proyecto

1. **Root Directory**: Selecciona `instante`
2. **Framework Preset**: Vite (o deja que Vercel lo detecte)
3. **Build Command**: `npm run build` (debería detectarse automáticamente)
4. **Output Directory**: `dist` (debería detectarse automáticamente)

### Paso 3: Configurar variables de entorno

En Vercel, ve a Settings → Environment Variables y agrega:

```
VITE_BACKEND_URL=https://tu-backend.railway.app
```

**Importante**: Reemplaza `https://tu-backend.railway.app` con la URL real de tu backend en Railway.

### Paso 4: Deploy

1. Clic en "Deploy"
2. Espera a que termine el build
3. Vercel te dará una URL como: `https://tu-app.vercel.app`

### Paso 5: Actualizar CORS en el backend

1. Vuelve a Railway
2. Actualiza la variable de entorno `FRONTEND_URL` con la URL de Vercel:
```
FRONTEND_URL=https://tu-app.vercel.app
```
3. Reinicia el servicio en Railway para aplicar los cambios

---

## ⚙️ Configuración Post-Deploy

### Actualizar Google OAuth Redirect URI

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Ve a APIs & Services → Credentials
3. Edita tu OAuth 2.0 Client ID
4. Agrega la Redirect URI del backend de producción:
   - `https://tu-backend.railway.app/google-drive/oauth-callback`

### Verificar que todo funciona

1. Abre tu frontend en Vercel
2. Intenta hacer una grabación
3. Verifica que se conecta correctamente con el backend
4. Revisa los logs en Railway si hay errores

---

## 🔧 Comandos útiles

### Backend (local)

```bash
cd instante/backend
npm install
npm run build
npm run start:prod
```

### Frontend (local)

```bash
cd instante
npm install
npm run build
npm run preview
```

---

## 🐛 Solución de problemas

### El backend no inicia en Railway

- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Railway para ver errores específicos
- Asegúrate de que `PORT` esté configurado (Railway lo inyecta automáticamente)

### CORS errors

- Verifica que `FRONTEND_URL` en Railway sea la URL correcta de Vercel
- Asegúrate de que no haya espacios extras en la URL
- Reinicia el servicio después de cambiar variables de entorno

### El frontend no se conecta al backend

- Verifica que `VITE_BACKEND_URL` en Vercel sea la URL correcta de Railway
- Asegúrate de que el backend esté funcionando (visita la URL en el navegador)
- Revisa la consola del navegador para ver errores específicos

### Videos no se procesan

- Verifica que ffmpeg esté disponible en Railway
- Considera usar un servicio de almacenamiento externo (S3, Cloudflare R2) para videos grandes
- Revisa los límites de tamaño de archivo en Railway

### Error: "GOOGLE_REFRESH_TOKEN requerido"

**Este error NO debería aparecer.** El `GOOGLE_REFRESH_TOKEN` NO es una variable de entorno que debas configurar en Railway.

**Explicación:**
- `GOOGLE_REFRESH_TOKEN` se obtiene **automáticamente** cuando el usuario se autentica con Google OAuth
- Solo necesitas configurar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en Railway
- El refresh token se guarda temporalmente en memoria cuando el usuario se autentica

**Si ves este error:**
1. Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén configurados
2. NO agregues `GOOGLE_REFRESH_TOKEN` como variable de entorno
3. El token se obtendrá cuando el usuario use la función de conectar Google Drive desde el frontend

---

## 📝 Notas importantes

1. **Variables de entorno**: Nunca subas archivos `.env` con credenciales reales a GitHub
2. **Base de datos**: Asegúrate de que Supabase esté configurado correctamente
3. **Almacenamiento**: Los videos se guardan temporalmente en el servidor. Considera usar almacenamiento externo para producción
4. **Costos**: Railway y Vercel tienen planes gratuitos con límites. Revisa los planes si tu aplicación crece

---

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación estará en producción y accesible desde cualquier lugar.

---

## 🔄 Flujo de Actualización (Después del Deploy Inicial)

Una vez que Railway y Vercel están conectados a tu repositorio de GitHub, el proceso de actualización es automático:

### Paso 1: Hacer cambios en tu código local

```bash
# Hacer tus cambios en el código
# ...

# Subir cambios a GitHub
git add .
git commit -m "Descripción de tus cambios"
git push origin main
```

### Paso 2: Deploy Automático

**Railway (Backend):**
- ✅ **Automático**: Railway detecta los cambios en GitHub automáticamente
- ✅ **Redeploy automático**: Se inicia un nuevo deploy en unos segundos
- ✅ **No necesitas hacer nada**: Solo espera 2-5 minutos

**Vercel (Frontend):**
- ✅ **Automático**: Vercel detecta los cambios en GitHub automáticamente
- ✅ **Redeploy automático**: Se inicia un nuevo build y deploy
- ✅ **No necesitas hacer nada**: Solo espera 1-3 minutos

### Verificar el Deploy

1. **Railway**: Ve a tu proyecto en Railway → Deployments → Verás el nuevo deploy en progreso
2. **Vercel**: Ve a tu proyecto en Vercel → Deployments → Verás el nuevo deploy en progreso

### Notas Importantes

- ⚠️ **Variables de entorno**: Si cambias variables de entorno, necesitas actualizarlas manualmente en Railway/Vercel
- ⚠️ **Primera vez**: Asegúrate de que Railway y Vercel estén conectados a tu repositorio de GitHub
- ⚠️ **Rama principal**: Los deploys automáticos solo funcionan en la rama `main` (o la que configuraste)

### Desactivar Deploy Automático (Opcional)

Si prefieres hacer deploys manuales:

**Railway:**
- Settings → Source → Desactivar "Auto Deploy"

**Vercel:**
- Settings → Git → Desactivar "Automatic deployments from Git"

