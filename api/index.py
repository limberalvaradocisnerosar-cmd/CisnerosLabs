import sys
import os

# Agregar el directorio raíz al path para importar app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel serverless function handler
# Exporta la app Flask para que Vercel pueda usarla

# Handler para Vercel
def handler(request):
    return app(request.environ, request.start_response) if hasattr(request, 'environ') else app

