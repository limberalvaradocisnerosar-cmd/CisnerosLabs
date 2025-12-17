import json
import os
from flask import Flask, render_template, url_for, redirect, request

# Configurar Flask para que funcione correctamente en Vercel
# Asegurar que los templates y static folders estén correctamente configurados
app = Flask(__name__, 
            template_folder='templates',
            static_folder='public/static' if os.path.exists('public/static') else 'static')

# Clave única para acceso al panel de administración
# IMPORTANTE: Cambiar por una clave segura antes de desplegar
ADMIN_KEY = "limber12345A@"

# Ruta del archivo de clicks (compatible con Vercel serverless)
CLICKS_FILE = 'clicks.json'

def get_clicks():
    """
    Lee el archivo clicks.json y retorna un diccionario con los contadores.
    Si el archivo no existe, retorna un diccionario vacío.
    """
    if os.path.exists(CLICKS_FILE):
        try:
            with open(CLICKS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}

def save_clicks(clicks_data):
    """
    Guarda el diccionario de clicks en el archivo JSON.
    Compatible con Vercel serverless (escribe en el sistema de archivos temporal).
    """
    try:
        with open(CLICKS_FILE, 'w') as f:
            json.dump(clicks_data, f, indent=2)
    except IOError:
        # Si falla la escritura, no rompe la aplicación
        pass

def increment_click(product_id):
    """
    Incrementa el contador de clics para un producto específico.
    """
    clicks = get_clicks()
    clicks[product_id] = clicks.get(product_id, 0) + 1
    save_clicks(clicks)
    return clicks[product_id]

def get_products():
    """
    Retorna la lista de productos con toda su información.
    Cada producto incluye un campo 'id' único para tracking.
    """
    # En Vercel, los archivos en public/ se sirven automáticamente
    # public/static/image.jpg -> accesible como /static/image.jpg
    # Usar rutas directas sin codificación, Flask manejará los espacios
    return [
        {
            "id": "smart-plug",
            "title": "Smart Plug Wi-Fi",
            "description": "Control your devices from your phone in seconds.",
            "category": "Smart Home / Gadgets",
            "image_url": "/static/smart-plug-wifi.jpg",
            "affiliate_url": "https://amzn.to/4qf0UIj"
        },
        {
            "id": "organizer-360",
            "title": "360° Rotating Organizer",
            "description": "Instantly organize your kitchen, bathroom or desk.",
            "category": "Home Organization",
            "image_url": "/static/girador-360.jpg",
            "affiliate_url": "https://amzn.to/4p3AfgR"
        },
        {
            "id": "car-gap",
            "title": "Car Seat Gap Organizer",
            "description": "Stop losing items between your car seats.",
            "category": "Car Accessories",
            "image_url": "/static/organizador.jpg",
            "affiliate_url": "https://amzn.to/3N7rgO8"
        }
    ]

@app.route("/")
def home():
    """
    Ruta principal que renderiza la página de productos afiliados.
    Pasa la lista de productos con toda su información.
    """
    products = get_products()
    return render_template("index.html", products=products)

# Asegurar que Flask sirva archivos estáticos correctamente
# En Vercel, los archivos en public/ se sirven automáticamente
# Esta ruta es para desarrollo local y como fallback
@app.route('/static/<path:filename>')
def serve_static(filename):
    """Sirve archivos estáticos desde la carpeta static o public/static"""
    from flask import send_from_directory
    import os
    from urllib.parse import unquote
    
    # Decodificar el nombre del archivo si viene codificado
    filename_decoded = unquote(filename)
    
    # Obtener el directorio base (funciona tanto en local como en Vercel)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    cwd = os.getcwd()
    
    # Lista de posibles ubicaciones para archivos estáticos (orden de prioridad)
    possible_paths = [
        os.path.join(base_dir, 'public', 'static'),  # Vercel: desde app.py
        os.path.join(cwd, 'public', 'static'),  # Vercel: desde working directory
        os.path.join(base_dir, 'static'),  # Desarrollo local
        os.path.join(cwd, 'static'),  # Fallback
    ]
    
    # Intentar cada path hasta encontrar el archivo
    for static_path in possible_paths:
        if os.path.exists(static_path):
            file_path = os.path.join(static_path, filename_decoded)
            if os.path.exists(file_path):
                # Enviar el archivo con headers apropiados
                response = send_from_directory(static_path, filename_decoded)
                response.headers['Cache-Control'] = 'public, max-age=31536000'
                return response
    
    # Si no se encuentra, retornar 404
    from flask import abort
    abort(404)

@app.route("/click/<product_id>")
def track_click(product_id):
    """
    Ruta de tracking: registra el clic y redirige al affiliate_url real.
    
    Flujo:
    1. Recibe el product_id del clic
    2. Incrementa el contador en clicks.json
    3. Busca el affiliate_url del producto
    4. Redirige al usuario a Amazon
    
    Compatible con Vercel serverless (sin sesiones, sin BD).
    """
    # Incrementar contador de clics
    increment_click(product_id)
    
    # Buscar el affiliate_url del producto
    products = get_products()
    product = next((p for p in products if p['id'] == product_id), None)
    
    if product:
        # Redirigir al affiliate_url real de Amazon
        return redirect(product['affiliate_url'], code=302)
    else:
        # Si el producto no existe, redirigir a home
        return redirect(url_for('home'), code=302)

def get_metrics_data():
    """
    Obtiene los datos de métricas ordenados por clicks (descendente).
    Retorna lista de productos con: title, category, clicks.
    También prepara arrays para gráficos Chart.js (labels y values).
    """
    clicks = get_clicks()
    products = get_products()
    
    # Crear lista de productos con sus clics
    products_with_clicks = []
    total_clicks = 0
    
    # Arrays para gráficos Chart.js
    chart_labels = []
    chart_values = []
    chart_colors = [
        '#0071e3',  # Azul Apple
        '#34c759',  # Verde
        '#ff9500',  # Naranja
        '#af52de',  # Púrpura
        '#ff2d55',  # Rojo
        '#5ac8fa'   # Azul claro
    ]
    
    for product in products:
        product_id = product['id']
        click_count = clicks.get(product_id, 0)
        total_clicks += click_count
        
        products_with_clicks.append({
            'title': product['title'],
            'category': product['category'],
            'clicks': click_count
        })
        
        # Preparar datos para gráficos
        chart_labels.append(product['title'])
        chart_values.append(click_count)
    
    # Ordenar por clicks descendente
    products_with_clicks.sort(key=lambda x: x['clicks'], reverse=True)
    
    # Ordenar arrays de gráficos según el orden de productos ordenados
    # Crear tuplas (label, value) y ordenar por value
    chart_data = list(zip(chart_labels, chart_values))
    chart_data.sort(key=lambda x: x[1], reverse=True)
    chart_labels_sorted, chart_values_sorted = zip(*chart_data) if chart_data else ([], [])
    
    return {
        'products': products_with_clicks,
        'total': total_clicks,
        'chart_labels': list(chart_labels_sorted),
        'chart_values': list(chart_values_sorted),
        'chart_colors': chart_colors[:len(chart_labels)]
    }

@app.route("/admin", methods=['GET', 'POST'])
def admin():
    """
    Panel de administración privado con acceso protegido por clave.
    
    Flujo:
    1. Si no hay clave en query param o POST → mostrar login
    2. Si la clave es correcta → mostrar panel de métricas
    3. Si la clave es incorrecta → mostrar error
    
    Autenticación sin sesiones (compatible con Vercel serverless):
    - Usa query param: /admin?key=MI_CLAVE
    - O POST form con campo 'key'
    """
    # Obtener clave de query param (GET) o form data (POST)
    submitted_key = request.args.get('key') or request.form.get('key')
    error = None
    
    # Validar clave si se envió
    if submitted_key:
        # Validación de clave: comparar con ADMIN_KEY
        if submitted_key == ADMIN_KEY:
            # Clave correcta: cargar y mostrar métricas
            metrics = get_metrics_data()
            return render_template('admin.html', 
                                authenticated=True, 
                                metrics=metrics,
                                key=submitted_key)
        else:
            # Clave incorrecta: mostrar error
            error = "Invalid access key. Please try again."
    
    # Si no hay clave o es incorrecta, mostrar login
    return render_template('admin.html', 
                         authenticated=False, 
                         error=error)

@app.route("/stats")
def stats():
    """
    Ruta pública de stats bloqueada por seguridad.
    Redirige al panel de administración.
    """
    return redirect(url_for('admin'), code=302)

if __name__ == "__main__":
    app.run(debug=True)
