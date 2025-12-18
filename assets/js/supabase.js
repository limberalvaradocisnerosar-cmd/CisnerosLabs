// Inicialización única de Supabase para todo el frontend
// Sustituye las constantes por los valores reales de tu proyecto.

const SUPABASE_URL = "https://xodxlywwsqppmcyvtoci.supabase.co"; // TODO: cambia por tu URL real
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZHhseXd3c3FwcG1jeXZ0b2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMDkwNjYsImV4cCI6MjA4MTU4NTA2Nn0.7JjZrMEJMZ_mYwa4Y3F3imAFWCCt9WWOyR6WcCeqRUg"; // TODO: cambia por tu anon key real

// Email permitido para acceder al dashboard de admin
const SUPABASE_ADMIN_EMAIL = "limberalvaradocisneros@gmail.com"; // TODO: cambia por tu email de administrador

// La librería @supabase/supabase-js v2 viene desde el CDN y expone window.supabase
const { createClient } = window.supabase;

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exponemos los objetos globalmente para que los demás scripts puedan usarlos
window.supabaseClient = supabaseClient;
window.SUPABASE_ADMIN_EMAIL = SUPABASE_ADMIN_EMAIL;
