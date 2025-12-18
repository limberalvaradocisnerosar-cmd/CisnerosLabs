# Configuración de Supabase - Guía Completa

## 📋 Tablas Requeridas

### 1. Tabla `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  affiliate_url TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columnas:**
- `id` (UUID, Primary Key)
- `name` (TEXT, NOT NULL) - Nombre del producto
- `category` (TEXT, opcional) - Categoría del producto
- `affiliate_url` (TEXT, NOT NULL) - URL de afiliado de Amazon
- `image_url` (TEXT, opcional) - URL de la imagen del producto
- `created_at` (TIMESTAMP) - Fecha de creación

### 2. Tabla `clicks`

```sql
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT
);
```

**Columnas:**
- `id` (UUID, Primary Key)
- `product_id` (UUID, Foreign Key → products.id)
- `created_at` (TIMESTAMP) - Fecha y hora del click
- `referrer` (TEXT, opcional) - URL de referencia
- `user_agent` (TEXT, opcional) - User agent del navegador

## 🔐 Row Level Security (RLS) Policies

### Para la tabla `products`:

```sql
-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir SELECT público (cualquiera puede leer productos)
CREATE POLICY "Public products are viewable by everyone"
ON products FOR SELECT
USING (true);
```

### Para la tabla `clicks`:

```sql
-- Habilitar RLS
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir INSERT público (cualquiera puede registrar clicks)
CREATE POLICY "Anyone can insert clicks"
ON clicks FOR INSERT
WITH CHECK (true);

-- Policy: Solo el admin puede ver los clicks (opcional, si quieres restringir)
-- Si quieres que solo el admin vea los clicks, usa esta policy:
CREATE POLICY "Only authenticated users can view clicks"
ON clicks FOR SELECT
USING (auth.role() = 'authenticated');
```

**Nota:** Si usas la última policy, necesitarás que el admin esté autenticado en Supabase Auth para ver los clicks en el dashboard.

## 👤 Autenticación (Para el Admin Dashboard)

### 1. Habilitar Email Auth en Supabase

1. Ve a **Authentication** → **Providers** en tu proyecto Supabase
2. Asegúrate de que **Email** esté habilitado
3. Configura las opciones de email según necesites

### 2. Crear Usuario Admin

1. Ve a **Authentication** → **Users**
2. Haz clic en **Add user** → **Create new user**
3. Ingresa el email que configuraste en `supabase.js`:
   - Email: `limberalvaradocisneros@gmail.com` (o el que tengas configurado)
   - Password: (elige una contraseña segura)
   - Auto Confirm User: ✅ (marcar esta opción)

### 3. Verificar Email Configurado

Abre `assets/js/supabase.js` y verifica que `SUPABASE_ADMIN_EMAIL` coincida con el email del usuario admin que creaste.

## 📊 Índices Recomendados (Para Mejor Performance)

```sql
-- Índice para búsquedas rápidas de productos
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Índice para búsquedas de clicks por producto
CREATE INDEX idx_clicks_product_id ON clicks(product_id);

-- Índice para búsquedas de clicks por fecha
CREATE INDEX idx_clicks_created_at ON clicks(created_at DESC);

-- Índice compuesto para queries del dashboard
CREATE INDEX idx_clicks_product_date ON clicks(product_id, created_at DESC);
```

## ✅ Checklist de Configuración

- [ ] Tabla `products` creada con todas las columnas
- [ ] Tabla `clicks` creada con todas las columnas
- [ ] RLS habilitado en ambas tablas
- [ ] Policy de SELECT público en `products`
- [ ] Policy de INSERT público en `clicks`
- [ ] Usuario admin creado en Authentication
- [ ] Email del admin coincide con `SUPABASE_ADMIN_EMAIL` en `supabase.js`
- [ ] Índices creados para mejor performance
- [ ] Al menos un producto insertado en la tabla `products` para probar

## 🧪 Probar la Configuración

### Insertar un Producto de Prueba:

```sql
INSERT INTO products (name, category, affiliate_url, image_url)
VALUES (
  'Smart Plug Wi-Fi',
  'Home Automation',
  'https://amazon.com/dp/XXXXXXXXXX?tag=YOUR_TAG',
  '/assets/images/smartplugwifi.jpg'
);
```

### Verificar que los Clicks se Registren:

1. Haz click en un producto desde la landing page
2. Ve al dashboard admin (`/admin.html`)
3. Deberías ver el click registrado

## 🔧 Troubleshooting

### Error: "relation does not exist"
- Verifica que las tablas estén creadas correctamente
- Asegúrate de estar en el schema correcto (generalmente `public`)

### Error: "new row violates row-level security policy"
- Verifica que las RLS policies estén configuradas correctamente
- Asegúrate de que la policy de INSERT esté activa para `clicks`

### Error: "permission denied for table"
- Verifica que las policies permitan las operaciones necesarias
- Revisa que el anon key tenga los permisos correctos

### El dashboard no muestra datos
- Verifica que el usuario admin esté autenticado
- Revisa la consola del navegador para errores
- Asegúrate de que las queries en `admin.js` sean correctas

## 📝 Notas Importantes

1. **Seguridad**: El anon key está expuesto en el frontend. Las RLS policies son tu primera línea de defensa.

2. **Performance**: Los índices mejoran significativamente las queries del dashboard, especialmente cuando hay muchos clicks.

3. **Escalabilidad**: Si esperas muchos clicks, considera agregar particionamiento por fecha a la tabla `clicks`.

4. **Backup**: Configura backups automáticos en Supabase para proteger tus datos.

