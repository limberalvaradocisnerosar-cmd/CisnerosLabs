import json
import os
from flask import Flask, render_template, url_for, redirect, request

app = Flask(__name__)

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
    return [
        {
            "id": "smart-plug",
            "title": "Smart Plug Wi-Fi",
            "description": "Control your devices from your phone in seconds.",
            "category": "Smart Home / Gadgets",
            "image_url": url_for('static', filename='smart plug wifi.jpg'),
            "affiliate_url": "https://amzn.to/4qf0UIj"
        },
        {
            "id": "organizer-360",
            "title": "360° Rotating Organizer",
            "description": "Instantly organize your kitchen, bathroom or desk.",
            "category": "Home Organization",
            "image_url": url_for('static', filename='girador 360.jpg'),
            "affiliate_url": "https://amzn.to/4p3AfgR"
        },
        {
            "id": "car-gap",
            "title": "Car Seat Gap Organizer",
            "description": "Stop losing items between your car seats.",
            "category": "Car Accessories",
            "image_url": url_for('static', filename='organizador.jpg'),
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
