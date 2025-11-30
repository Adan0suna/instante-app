# Configuración de Supabase para el Backend

## Pasos para configurar Supabase:

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Anota la URL del proyecto y las credenciales de la base de datos

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del backend con las siguientes variables:

```env
# Supabase Configuration
SUPABASE_HOST=db.your-project.supabase.co
SUPABASE_PORT=5432
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_database_password
SUPABASE_DATABASE=postgres

# Google Drive Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Server Configuration
PORT=3001
```

### 3. Crear las tablas en Supabase
1. Ve al SQL Editor en tu proyecto de Supabase
2. Copia y ejecuta el contenido del archivo `supabase-schema.sql`
3. Esto creará las tablas `recordings` y `highlights` con sus relaciones

### 4. Obtener credenciales de Supabase
1. Ve a Settings > Database en tu proyecto de Supabase
2. Copia los valores de:
   - Host: `db.your-project.supabase.co`
   - Database name: `postgres`
   - Port: `5432`
   - User: `postgres`
   - Password: (la contraseña que configuraste)

### 5. Ejecutar el backend
```bash
npm run start:dev
```

## Notas importantes:
- El backend está configurado para usar PostgreSQL (Supabase)
- Las tablas se crean manualmente en Supabase, no automáticamente
- Asegúrate de que las variables de entorno estén correctamente configuradas
- El puerto por defecto es 3001, pero puedes cambiarlo en el archivo .env 