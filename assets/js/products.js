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

  const cardsHtml = data
    .map((product) => {
      const description =
        product.description ||
        "Simple, practical upgrade designed to make everyday routines feel easier, not more complicated.";

      return `
        <article class="product-card">
          <div class="product-image-wrap">
            <img
              src="${product.image_url}"
              class="product-image"
              loading="lazy"
              alt="${product.name}"
            >
          </div>
          <h2 class="product-title">${product.name}</h2>
          <p class="product-category">${product.category}</p>
          <p class="product-description">
            ${description}
          </p>
          <button
            type="button"
            data-id="${product.id}"
            data-url="${product.affiliate_url}"
            class="product-cta track-click"
          >
            <span>See details on Amazon</span>
          </button>
        </article>
      `;
    })
    .join("");

  container.innerHTML = cardsHtml;
});
