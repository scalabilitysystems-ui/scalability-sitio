// Carrusel de frentes: scroll-snap nativo, sin dependencias.
// Botones, puntos, teclado y arrastre con el mouse. Las imágenes son de fondo:
// si falta alguna, queda el degradado y no se rompe nada.
(() => {
  const pista = document.getElementById("pista");
  if (!pista) return;

  const slides = [...pista.querySelectorAll(".frente")];
  const puntos = [...document.querySelectorAll("#puntos button")];
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");

  // La posición se calcula con rectángulos, no con offsetLeft: el slide es
  // position:relative, así que su offsetParent no es la pista y el cálculo
  // quedaba corto (el carrusel frenaba entre dos slides).
  const posicionDe = (s) =>
    s.getBoundingClientRect().left - pista.getBoundingClientRect().left + pista.scrollLeft;

  // Las imágenes del carrusel van con loading="lazy": sin esto, al pasar de
  // slide la foto todavía no está descargada y se ve el fondo negro.
  const precargar = (i) => {
    [i, i + 1].forEach((n) => {
      const img = slides[n] && slides[n].querySelector(".frente-img");
      if (img && !img.dataset.pedida) {
        img.dataset.pedida = "1";
        const previa = new Image();
        previa.src = img.currentSrc || img.src;
      }
    });
  };

  const irA = (i, suave = true) => {
    const n = Math.max(0, Math.min(slides.length - 1, i));
    const s = slides[n];
    precargar(n);
    pista.scrollTo({ left: posicionDe(s), behavior: suave && !reducir.matches ? "smooth" : "auto" });
  };

  // El slide activo es el más cercano al borde izquierdo visible.
  const actual = () => {
    const x = pista.scrollLeft;
    let mejor = 0;
    let dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(posicionDe(s) - x);
      if (d < dist) { dist = d; mejor = i; }
    });
    return mejor;
  };

  const pintar = () => {
    const i = actual();
    puntos.forEach((b, n) => {
      if (n === i) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    prev.disabled = pista.scrollLeft <= 2;
    next.disabled = pista.scrollLeft >= pista.scrollWidth - pista.clientWidth - 2;
  };

  prev.addEventListener("click", () => irA(actual() - 1));
  next.addEventListener("click", () => irA(actual() + 1));
  puntos.forEach((b, i) => b.addEventListener("click", () => irA(i)));

  // Teclado sobre la pista
  pista.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); irA(actual() + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); irA(actual() - 1); }
  });

  // Arrastre con el mouse (el touch ya lo hace el navegador solo)
  let arrastrando = false, inicioX = 0, inicioScroll = 0, movido = false;
  pista.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    arrastrando = true; movido = false;
    inicioX = e.clientX; inicioScroll = pista.scrollLeft;
    pista.setPointerCapture(e.pointerId);
    pista.classList.add("arrastrando");
  });
  pista.addEventListener("pointermove", (e) => {
    if (!arrastrando) return;
    const d = e.clientX - inicioX;
    if (Math.abs(d) > 4) movido = true;
    pista.scrollLeft = inicioScroll - d;
  });
  const soltar = () => {
    if (!arrastrando) return;
    arrastrando = false;
    pista.classList.remove("arrastrando");
    if (movido) irA(actual());
  };
  pista.addEventListener("pointerup", soltar);
  pista.addEventListener("pointercancel", soltar);

  let cuadro = null;
  pista.addEventListener("scroll", () => {
    if (cuadro) return;
    cuadro = requestAnimationFrame(() => { pintar(); cuadro = null; });
  }, { passive: true });

  // Los links de "¿En qué situación está la empresa?" mueven el carrusel.
  document.querySelectorAll("[data-frente]").forEach((a) => {
    a.addEventListener("click", () => irA(Number(a.dataset.frente)));
  });

  window.addEventListener("resize", () => { pintar(); });
  pintar();
  precargar(0);
})();
