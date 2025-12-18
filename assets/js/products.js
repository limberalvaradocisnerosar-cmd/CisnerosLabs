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

  // Ordenar para que Smart Plug aparezca primero (más universal)
  if (data && data.length > 0) {
    data.sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();
      
      // Smart Plug primero
      if (aName.includes("plug") || aName.includes("wifi")) return -1;
      if (bName.includes("plug") || bName.includes("wifi")) return 1;
      
      return 0;
    });
  }

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

  // Mapeo de descripciones conversacionales en inglés
  const productDescriptions = {
    "smart plug": "You always leave lights or devices plugged in without realizing it.<br>This plug lets you control everything from your phone.<br>Once you use it, it becomes part of your routine.",
    "smart plug wi-fi": "You always leave lights or devices plugged in without realizing it.<br>This plug lets you control everything from your phone.<br>Once you use it, it becomes part of your routine.",
    "wifi": "You always leave lights or devices plugged in without realizing it.<br>This plug lets you control everything from your phone.<br>Once you use it, it becomes part of your routine.",
    "plug": "You always leave lights or devices plugged in without realizing it.<br>This plug lets you control everything from your phone.<br>Once you use it, it becomes part of your routine.",
    "organizador": "Messy drawers and shelves waste your time every day.<br>This organizer makes everything visible in seconds.<br>On Amazon you'll see why people end up using it all the time.",
    "rotating": "Messy drawers and shelves waste your time every day.<br>This organizer makes everything visible in seconds.<br>On Amazon you'll see why people end up using it all the time.",
    "rotating organizer": "Messy drawers and shelves waste your time every day.<br>This organizer makes everything visible in seconds.<br>On Amazon you'll see why people end up using it all the time.",
    "360": "Messy drawers and shelves waste your time every day.<br>This organizer makes everything visible in seconds.<br>On Amazon you'll see why people end up using it all the time.",
    "girador": "Messy drawers and shelves waste your time every day.<br>This organizer makes everything visible in seconds.<br>On Amazon you'll see why people end up using it all the time.",
    "car": "Items that get lost between seats and distract you while driving.<br>This simple solution keeps everything in place.<br>See on Amazon how it makes every trip more comfortable.",
    "car organizer": "Items that get lost between seats and distract you while driving.<br>This simple solution keeps everything in place.<br>See on Amazon how it makes every trip more comfortable.",
    "car seat": "Items that get lost between seats and distract you while driving.<br>This simple solution keeps everything in place.<br>See on Amazon how it makes every trip more comfortable.",
    "gap": "Items that get lost between seats and distract you while driving.<br>This simple solution keeps everything in place.<br>See on Amazon how it makes every trip more comfortable.",
    "auto": "Items that get lost between seats and distract you while driving.<br>This simple solution keeps everything in place.<br>See on Amazon how it makes every trip more comfortable."
  };

  const cardsHtml = data
    .map((product) => {
      const productName = (product.name || "").trim();
      const productUrl = product.affiliate_url || "#";
      
      // Buscar descripción conversacional (case insensitive, busca por palabras clave)
      const nameLower = productName.toLowerCase();
      let description = null;
      
      // Buscar coincidencia por palabras clave (priorizar matches más largos primero)
      const sortedKeys = Object.keys(productDescriptions).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        if (nameLower.includes(key)) {
          description = productDescriptions[key];
          break;
        }
      }
      
      // SIEMPRE usar descripción conversacional, nunca la de Supabase
      // Si no hay coincidencia, usar genérica conversacional
      if (!description) {
        description = "Something annoying happens to you every day.<br>This simple solution fixes it without complications.<br>See how it works on Amazon.";
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
          <p class="product-description"><strong>${productName}</strong><br>${description}</p>
          <a
            href="/go.html?id=${product.id}"
            class="product-cta"
          >
            <span>Get it now on Amazon →</span>
          </a>
        </article>
      `;
    })
    .join("");

  // Limpiar contenido existente (fallback) y reemplazar con productos de Supabase
  container.innerHTML = cardsHtml;
});
