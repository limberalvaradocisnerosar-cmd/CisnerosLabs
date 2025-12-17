# Mini Web Amazon - Landing Page Afiliada

Landing page afiliada a Amazon con tracking de clics y dashboard de analytics.

## 🚀 Despliegue en Vercel

### Opción 1: Desde la CLI de Vercel (Recomendado)

1. **Instala Vercel CLI** (si no lo tienes):
```bash
npm install -g vercel
```

2. **Inicia sesión en Vercel**:
```bash
vercel login
```

3. **Despliega el proyecto**:
```bash
vercel
```

4. **Para producción**:
```bash
vercel --prod
```

### Opción 2: Desde GitHub

1. **Sube tu código a GitHub** (si aún no lo has hecho):
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. **Ve a [vercel.com](https://vercel.com)** y:
   - Haz clic en "Add New Project"
   - Conecta tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración
   - Haz clic en "Deploy"

### 📁 Archivos necesarios para Vercel

- ✅ `vercel.json` - Configuración de Vercel
- ✅ `requirements.txt` - Dependencias de Python
- ✅ `api/index.py` - Handler para serverless function
- ✅ `app.py` - Aplicación Flask principal

## 🔧 Configuración

### Variables de entorno (opcional)

Si quieres cambiar la clave de admin sin modificar el código:

1. En Vercel Dashboard → Settings → Environment Variables
2. Agrega: `ADMIN_KEY` = `tu_clave_segura`

Luego actualiza `app.py` para leerla:
```python
import os
ADMIN_KEY = os.environ.get('ADMIN_KEY', '12')
```

## 📝 Notas importantes

- El archivo `clicks.json` se crea automáticamente en Vercel
- Los datos persisten mientras la función esté activa
- Para producción, considera usar una base de datos (Vercel Postgres)

## 🎯 Rutas

- `/` - Landing page principal
- `/admin?key=TU_CLAVE` - Dashboard de analytics
- `/click/<product_id>` - Tracking de clics

