 # 🚀 Guía Completa: Configuración Supabase + Despliegue Vercel

## 📋 Índice
1. [Crear Proyecto en Supabase](#1-crear-proyecto-en-supabase)
2. [Crear Tablas](#2-crear-tablas)
3. [Configurar Autenticación](#3-configurar-autenticación)
4. [Configurar Variables de Entorno en Vercel](#4-configurar-variables-de-entorno-en-vercel)
5. [Desplegar en Vercel](#5-desplegar-en-vercel)

---

## 1. Crear Proyecto en Supabase

### Paso 1: Crear cuenta y proyecto
1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"** o **"Sign in"**
3. Crea una cuenta (puedes usar GitHub, Google, etc.)
4. Haz clic en **"New Project"**
5. Completa el formulario:
   - **Name**: `miniweb-amazon` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a tus usuarios
   - **Pricing Plan**: Free tier es suficiente para empezar
6. Haz clic en **"Create new project"**
7. Espera 2-3 minutos mientras se crea el proyecto

### Paso 2: Obtener credenciales
1. En el dashboard de Supabase, ve a **Settings** (⚙️) → **API**
2. Copia estos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 2. Crear Tablas

### Paso 1: Abrir SQL Editor
1. En el dashboard de Supabase, ve a **SQL Editor** (en el menú lateral)
2. Haz clic en **"New query"**

### Paso 2: Crear tabla `products`
Copia y ejecuta este SQL:

```sql
-- Crear tabla products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (para que la landing page pueda leer productos)
CREATE POLICY "Allow public read access on products" 
ON products FOR SELECT 
USING (true);

-- Política para permitir inserción (si quieres agregar productos desde el dashboard)
CREATE POLICY "Allow authenticated insert on products" 
ON products FOR INSERT 
TO authenticated 
WITH CHECK (true);
```

### Paso 3: Crear tabla `clicks`
Copia y ejecuta este SQL:

```sql
-- Crear tabla clicks
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_agent TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción pública (para tracking desde la landing page)
CREATE POLICY "Allow public insert on clicks" 
ON clicks FOR INSERT 
WITH CHECK (true);

-- Política para permitir lectura a usuarios autenticados (para el dashboard)
CREATE POLICY "Allow authenticated read on clicks" 
ON clicks FOR SELECT 
TO authenticated 
USING (true);
```

### Paso 4: Insertar productos de ejemplo
Copia y ejecuta este SQL (reemplaza las URLs de imágenes y affiliate según tus productos):

```sql
-- Insertar productos de ejemplo
INSERT INTO products (title, description, category, image_url, affiliate_url) VALUES
('Smart Plug Wi-Fi', 'Control your devices from your phone in seconds.', 'Smart Home', '/assets/images/smartplugwifi.jpg', 'https://amzn.to/4qf0UIj'),
('360° Rotating Organizer', 'Organize any space instantly.', 'Home Organization', '/assets/images/girador360.jpg', 'https://amzn.to/4p3AfgR'),
('Car Seat Gap Organizer', 'Stop losing items between your car seats.', 'Car Accessories', '/assets/images/organizasorAuto.jpg', 'https://amzn.to/3N7rgO8');
```

---

## 3. Configurar Autenticación

### Paso 1: Habilitar Email Auth
1. Ve a **Authentication** → **Providers**
2. Asegúrate de que **Email** esté habilitado (debería estar por defecto)
3. Opcional: Configura **Site URL** en **Authentication** → **URL Configuration**
   - Site URL: `https://tu-dominio.vercel.app` (o tu dominio de producción)

### Paso 2: Crear usuario admin
1. Ve a **Authentication** → **Users**
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa:
   - **Email**: `admin@example.com` (o tu email)
   - **Password**: Crea una contraseña segura
   - **Auto Confirm User**: ✅ Marca esta casilla
4. Haz clic en **"Create user"**
5. **IMPORTANTE**: Copia el email que usaste (lo necesitarás para `ALLOWED_EMAIL`)

---

## 4. Configurar Variables de Entorno en Vercel

### ⚠️ IMPORTANTE: Ya NO necesitas editar los archivos HTML

Las credenciales ahora se configuran directamente en Vercel usando variables de entorno. Esto es más seguro y profesional.

### Paso 1: Obtener credenciales de Supabase
1. En Supabase Dashboard → **Settings** → **API**
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Paso 2: Configurar variables en Vercel

**Opción A: Desde Vercel Dashboard (Recomendado)**

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Haz clic en **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

| Variable | Valor | Ambiente |
|----------|-------|----------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `ALLOWED_EMAIL` | `admin@example.com` | Production, Preview, Development |

4. Haz clic en **Save** para cada variable
5. **IMPORTANTE**: Después de agregar las variables, necesitas hacer un **nuevo deploy** para que se apliquen

**Opción B: Desde Vercel CLI**

```bash
# Instalar Vercel CLI si no lo tienes
npm install -g vercel

# Login
vercel login

# Agregar variables de entorno
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add ALLOWED_EMAIL

# Para cada variable, selecciona:
# - Production: Yes
# - Preview: Yes
# - Development: Yes
```

### Paso 3: Redesplegar

Después de agregar las variables, necesitas hacer un nuevo deploy:

```bash
# Desde CLI
vercel --prod

# O desde GitHub: haz un push nuevo o re-deploy desde el dashboard
```

---

## 5. Desplegar en Vercel

### Opción A: Desde GitHub (Recomendado)

#### Paso 1: Subir a GitHub
```bash
# Asegúrate de estar en el directorio del proyecto
cd C:\Users\Hp\Desktop\miniWeb-Amazon

# Agregar todos los archivos
git add .

# Commit
git commit -m "Ready for Vercel deployment with environment variables"

# Push a main
git push origin main
```

#### Paso 2: Conectar con Vercel
1. Ve a [https://vercel.com](https://vercel.com)
2. Inicia sesión (puedes usar GitHub)
3. Haz clic en **"Add New Project"**
4. Selecciona tu repositorio de GitHub
5. Vercel detectará automáticamente la configuración
6. **NO necesitas cambiar nada en "Build Settings"**
7. Haz clic en **"Deploy"**

#### Paso 3: Configurar variables de entorno
1. Después del primer deploy, ve a **Settings** → **Environment Variables**
2. Agrega las 3 variables como se explicó en la sección 4
3. Haz clic en **"Redeploy"** o haz un nuevo push a GitHub

### Opción B: Desde CLI de Vercel

#### Paso 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

#### Paso 2: Login
```bash
vercel login
```

#### Paso 3: Desplegar
```bash
# Desde el directorio del proyecto
cd C:\Users\Hp\Desktop\miniWeb-Amazon

# Desplegar
vercel

# Para producción
vercel --prod
```

#### Paso 4: Configurar variables
```bash
# Agregar variables de entorno
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add ALLOWED_EMAIL

# Redesplegar para aplicar cambios
vercel --prod
```

---

## ✅ Checklist Final

Antes de desplegar, verifica:

- [ ] Proyecto creado en Supabase
- [ ] Tabla `products` creada con datos
- [ ] Tabla `clicks` creada
- [ ] Usuario admin creado en Supabase Auth
- [ ] Variables de entorno configuradas en Vercel:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `ALLOWED_EMAIL`
- [ ] Archivos subidos a GitHub (si usas Opción A)
- [ ] `vercel.json` existe y está configurado
- [ ] Imágenes en `/assets/images/` están presentes
- [ ] **Nuevo deploy realizado después de agregar variables**

---

## 🔧 Solución de Problemas

### Error: "Invalid API key"
- Verifica que las variables de entorno estén configuradas en Vercel
- Asegúrate de haber hecho un **nuevo deploy** después de agregar las variables
- Verifica que copiaste correctamente la `anon key` de Supabase
- Asegúrate de usar la `anon public key`, no la `service_role key`

### Error: "Access denied" en dashboard
- Verifica que `ALLOWED_EMAIL` en Vercel coincida con el usuario creado en Supabase Auth
- Asegúrate de que el usuario tenga `Auto Confirm User` activado
- Verifica que hayas hecho un nuevo deploy después de agregar `ALLOWED_EMAIL`

### Error: "Table does not exist"
- Verifica que ejecutaste todos los SQL scripts
- Revisa que las tablas estén en el esquema `public`

### Error: "Configuration error" en la página
- Verifica que las variables de entorno estén configuradas en Vercel
- Asegúrate de haber hecho un **nuevo deploy** después de agregar las variables
- Revisa los logs de Vercel para ver si hay errores en `/api/config`

### Imágenes no cargan en Vercel
- Verifica que las imágenes estén en `/assets/images/`
- Asegúrate de que `vercel.json` tenga la ruta `/assets/(.*)` configurada

---

## 📝 Notas Importantes

1. **Seguridad**: La `anon key` es pública y está bien exponerla en el frontend. Supabase usa RLS (Row Level Security) para proteger los datos.

2. **Variables de Entorno**: Ahora las credenciales se gestionan desde Vercel, no están hardcodeadas en el código. Esto es más seguro y profesional.

3. **RLS Policies**: Las políticas que creamos permiten:
   - Lectura pública de productos (para la landing page)
   - Inserción pública de clicks (para tracking)
   - Lectura de clicks solo para usuarios autenticados (para el dashboard)

4. **Redesplegar**: Después de agregar o modificar variables de entorno, **siempre** necesitas hacer un nuevo deploy para que se apliquen.

5. **Backup**: Considera hacer backup de tus datos importantes. En el plan free, puedes exportar datos desde el dashboard.

6. **Límites Free Tier**:
   - 500 MB de base de datos
   - 2 GB de bandwidth
   - 50,000 usuarios activos mensuales

---

## 🎉 ¡Listo!

Una vez completados estos pasos, tu landing page estará:
- ✅ Desplegada en Vercel
- ✅ Conectada a Supabase
- ✅ Tracking de clicks funcionando
- ✅ Dashboard admin protegido
- ✅ Credenciales gestionadas desde variables de entorno (más seguro)

**URLs**:
- Landing page: `https://tu-proyecto.vercel.app`
- Dashboard: `https://tu-proyecto.vercel.app/admin.html`
- API Config: `https://tu-proyecto.vercel.app/api/config`

---

## 🔄 Flujo de Configuración

```
1. Crear proyecto en Supabase
   ↓
2. Crear tablas (products, clicks)
   ↓
3. Crear usuario admin
   ↓
4. Obtener credenciales (URL, anon key)
   ↓
5. Desplegar en Vercel
   ↓
6. Configurar variables de entorno en Vercel
   ↓
7. Redesplegar para aplicar variables
   ↓
8. ¡Listo! 🎉
```
