// Hero animado de entrada + transformación a franja marquee
// - Aparece fullscreen al cargar
// - Hace fade + scale in
// - Se desvanece y deja solo la franja horizontal infinita

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("hero-overlay");
  const strip = document.getElementById("hero-strip");

  if (!overlay || !strip) return;

  // Hacemos visible el overlay con una ligera animación
  requestAnimationFrame(() => {
    overlay.classList.remove("pointer-events-none");
    overlay.classList.remove("opacity-0", "scale-95");
    overlay.classList.add("opacity-100", "scale-100");
  });

  // Después de ~1.8s empezamos a desvanecer el overlay
  const SHOW_DURATION_MS = 1800;

  setTimeout(() => {
    overlay.classList.remove("opacity-100", "scale-100");
    overlay.classList.add("opacity-0", "scale-95");

    // Al terminar la transición, lo ocultamos completamente
    const TRANSITION_MS = 700;
    setTimeout(() => {
      overlay.classList.add("hidden");

      // Mostramos la franja hero-strip con efecto suave
      strip.classList.remove("hidden");
      strip.classList.add("animate-hero-strip-in");
    }, TRANSITION_MS);
  }, SHOW_DURATION_MS);
});


