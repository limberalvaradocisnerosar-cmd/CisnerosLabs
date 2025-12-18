// products.js
// Carga de productos desde la tabla `products` en Supabase
// y renderizado de cards con diseño premium orientado a conversión.

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("products");
  if (!container) return;

  if (!window.supabaseClient) {
    console.error("Supabase client no inicializado");
    return;
  }

  // Cargamos todos los productos públicos
  const { data, error } = await window.supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML =
      '<p class="text-sm text-gray-500">No se pudieron cargar los productos ahora mismo.</p>';
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML =
      '<p class="text-sm text-gray-500">Pronto añadiremos nuestros mejores hallazgos.</p>';
    return;
  }

  // Mapeo de descripciones conversacionales (3 líneas: dolor → solución → curiosidad)
  const productDescriptions = {
    "smart plug": "Siempre dejás cosas enchufadas sin darte cuenta.<br>Este enchufe te deja controlarlo todo desde el celular.<br>Una vez que lo usás, no volvés atrás.",
    "smart plug wi-fi": "Siempre dejás cosas enchufadas sin darte cuenta.<br>Este enchufe te deja controlarlo todo desde el celular.<br>Una vez que lo usás, no volvés atrás.",
    "organizador": "Cajones desordenados que te hacen perder tiempo todos los días.<br>Este organizador hace visible todo de un solo vistazo.<br>Mirá por qué la gente lo usa más de lo que esperaba.",
    "rotating organizer": "Cajones desordenados que te hacen perder tiempo todos los días.<br>Este organizador hace visible todo de un solo vistazo.<br>Mirá por qué la gente lo usa más de lo que esperaba.",
    "360° rotating organizer": "Cajones desordenados que te hacen perder tiempo todos los días.<br>Este organizador hace visible todo de un solo vistazo.<br>Mirá por qué la gente lo usa más de lo que esperaba.",
    "car": "Objetos que se pierden entre los asientos constantemente.<br>Una solución simple que evita distracciones al manejar.<br>En Amazon se ve claro cómo funciona.",
    "car organizer": "Objetos que se pierden entre los asientos constantemente.<br>Una solución simple que evita distracciones al manejar.<br>En Amazon se ve claro cómo funciona.",
    "car seat gap organizer": "Objetos que se pierden entre los asientos constantemente.<br>Una solución simple que evita distracciones al manejar.<br>En Amazon se ve claro cómo funciona."
  };

  const cardsHtml = data
    .map((product) => {
      const productName = (product.name || "").trim();
      const productUrl = product.affiliate_url || "#";
      
      // Buscar descripción (case insensitive, busca por palabras clave)
      const nameLower = productName.toLowerCase();
      let description = null;
      
      // Buscar coincidencia exacta o por palabras clave
      for (const key in productDescriptions) {
        if (nameLower.includes(key)) {
          description = productDescriptions[key];
          break;
        }
      }
      
      // Si no hay coincidencia, usar descripción del producto o genérica
      if (!description) {
        description = product.description || 
                     "Siempre te pasa algo que molesta todos los días.<br>Esta solución simple lo arregla sin complicaciones.<br>En Amazon se ve cómo funciona.";
      }

      return `
        <article class="product-card">
          <div class="product-image-wrap">
            <img
              src="${product.image_url}"
              class="product-image"
              loading="lazy"
              alt="${productName}"
            >
          </div>
          <p class="product-description">${description}</p>
          <button
            type="button"
            data-id="${product.id}"
            data-url="${productUrl}"
            class="product-cta track-click"
          >
            <span>View on Amazon →</span>
          </button>
        </article>
      `;
    })
    .join("");

  // Limpiar contenido existente (fallback) y reemplazar con productos de Supabase
  container.innerHTML = cardsHtml;
});
