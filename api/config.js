// API endpoint para servir configuración desde variables de entorno de Vercel
// Este endpoint expone las variables de entorno de forma segura
// Vercel serverless function

module.exports = function handler(req, res) {
    // Configurar CORS para permitir acceso desde cualquier origen
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');
    
    // Retornar configuración desde variables de entorno de Vercel
    // Estas variables se configuran en: Vercel Dashboard → Settings → Environment Variables
    res.status(200).json({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
        allowedEmail: process.env.ALLOWED_EMAIL || ''
    });
};
