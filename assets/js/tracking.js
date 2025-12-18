// tracking.js
// Escucha los clicks en botones de tipo "View on Amazon"
// y registra el evento en la tabla `clicks` sin bloquear la redirección.

document.addEventListener("click", (e) => {
  const target = e.target.closest(".track-click");
  if (!target) return;

  const productId = target.dataset.id;
  const url = target.dataset.url;

  // Intentamos registrar el click de forma silenciosa y sin bloquear
  if (window.supabaseClient && productId) {
    try {
      // No esperamos la promesa: la redirección no se bloquea
      window.supabaseClient.from("clicks").insert({
        product_id: productId,
        user_agent: navigator.userAgent,
      });
    } catch (_err) {
      // Errores silenciosos, no molestamos al usuario ni bloqueamos
    }
  }

  if (url) {
    window.location.href = url;
  }
});
