// Landing de /ecommerce.
//
// - Conserva las UTMs de la campaña (primera visita + visita actual) y las manda
//   con el lead, para poder separar los dos enfoques de Meta Ads.
// - Preselecciona el plan cuando la consulta viene de una tarjeta de precios.
// - Emite eventos con nombres estables. No hay píxel de Meta configurado: los
//   eventos quedan en window.__eventos y en dataLayer cuando exista. Cuando se
//   cargue el píxel, se engancha acá sin tocar el HTML.
// - Nunca manda datos personales dentro de un evento.

const API = "https://api2.scalabilitysystems.com.ar";
const CLAVE_FUENTE = "scalability_utm_inicial";

// ── Eventos ────────────────────────────────────────────────────────────────
window.__eventos = window.__eventos || [];
function evento(nombre, datos = {}) {
  window.__eventos.push({ nombre, datos, momento: new Date().toISOString() });
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: nombre, ...datos });
  if (window.fbq) window.fbq("trackCustom", nombre, datos);
  if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
    console.debug("[evento]", nombre, datos);
  }
}

// ── Atribución ─────────────────────────────────────────────────────────────
const CLAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function leerUtms() {
  const params = new URLSearchParams(location.search);
  const actual = {};
  CLAVES_UTM.forEach((k) => {
    const v = params.get(k);
    if (v) actual[k] = v.slice(0, 160);
  });

  let inicial = null;
  try {
    inicial = JSON.parse(localStorage.getItem(CLAVE_FUENTE) || "null");
  } catch {
    inicial = null;
  }

  // La primera fuente conocida no se pisa: si el anuncio trajo la campaña y
  // después la persona vuelve por otro lado, la atribución sigue siendo la del
  // anuncio que la trajo.
  if (!inicial && Object.keys(actual).length) {
    inicial = { ...actual, momento: new Date().toISOString() };
    try {
      localStorage.setItem(CLAVE_FUENTE, JSON.stringify(inicial));
    } catch {}
  }
  return { actual, inicial };
}

const atribucion = leerUtms();

// ── Preselección de plan ───────────────────────────────────────────────────
const selectorPlan = document.getElementById("ec-plan");

function elegirPlan(plan) {
  if (!selectorPlan) return;
  if (!plan) return;
  const opcion = [...selectorPlan.options].find(
    (o) => o.value.toLowerCase() === String(plan).toLowerCase(),
  );
  if (opcion) selectorPlan.value = opcion.value;
}

// ?plan=Inicial o ?plan=Growth en la URL del anuncio
const planUrl = new URLSearchParams(location.search).get("plan");
if (planUrl) elegirPlan(planUrl);

// CTA de cada tarjeta: deja el plan elegido en el formulario
document.querySelectorAll("[data-plan]").forEach((a) => {
  a.addEventListener("click", () => {
    const plan = a.getAttribute("data-plan");
    if (plan) elegirPlan(plan);
    evento("ecommerce_cta_plan", { plan: plan || "sin_plan" });
  });
});

// Aperturas de demo
document.querySelectorAll("[data-demo]").forEach((a) => {
  a.addEventListener("click", () => {
    evento("ecommerce_demo_abrir", { demo: a.getAttribute("data-demo") });
  });
});

// ── Formulario ─────────────────────────────────────────────────────────────
const form = document.getElementById("ec-form");
const aviso = document.getElementById("ec-aviso");
const exito = document.getElementById("ec-exito");
const boton = document.getElementById("ec-enviar");

const MENSAJES = {
  es: {
    nombre: "Indicá tu nombre.",
    negocio: "Indicá el negocio o la marca.",
    contacto: "Dejá un WhatsApp o un email válido.",
    plan: "Elegí un plan.",
    consent: "Necesitamos tu aceptación para poder responderte.",
    revisar: "Revisá los campos marcados.",
    enviando: "Enviando…",
    error: "No se pudo enviar. Probá de nuevo en un momento.",
    red: "No hubo conexión con el servidor. Revisá la conexión y volvé a intentar.",
    demasiados: "Hubo varios envíos seguidos. Esperá unos minutos y probá de nuevo.",
    boton: "Pedir mi propuesta",
  },
};

const M = MENSAJES.es;

function limpiar() {
  ["nombre", "negocio", "contacto", "plan", "consent"].forEach((c) => {
    const err = document.getElementById(`ec-e-${c}`);
    if (err) { err.hidden = true; err.textContent = ""; }
    const campo = document.getElementById(`ec-${c}`);
    if (campo) campo.removeAttribute("aria-invalid");
  });
  if (aviso) aviso.hidden = true;
}

function marcar(campo, mensaje) {
  const err = document.getElementById(`ec-e-${campo}`);
  const input = document.getElementById(`ec-${campo}`);
  if (err) { err.hidden = false; err.textContent = mensaje; }
  if (input) input.setAttribute("aria-invalid", "true");
}

const esEmail = (v) => /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(v);
const esTelefono = (v) => (v.match(/\d/g) || []).length >= 6;

let formIniciado = false;
if (form) {
  form.addEventListener("focusin", () => {
    if (!formIniciado) {
      formIniciado = true;
      evento("ecommerce_form_inicio");
    }
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    limpiar();

    const datos = {
      nombre: document.getElementById("ec-nombre").value.trim(),
      negocio: document.getElementById("ec-negocio").value.trim(),
      contacto: document.getElementById("ec-contacto").value.trim(),
      plan: document.getElementById("ec-plan").value,
      sitio: document.getElementById("ec-sitio").value.trim(),
      consent: document.getElementById("ec-consent").checked,
      fuente: atribucion.inicial || {},
      fuente_actual: atribucion.actual,
      pagina: location.pathname + location.search,
      referrer: document.referrer || "",
    };

    let ok = true;
    if (datos.nombre.length < 2) { marcar("nombre", M.nombre); ok = false; }
    if (datos.negocio.length < 2) { marcar("negocio", M.negocio); ok = false; }
    if (!esEmail(datos.contacto) && !esTelefono(datos.contacto)) {
      marcar("contacto", M.contacto); ok = false;
    }
    if (!datos.plan) { marcar("plan", M.plan); ok = false; }
    if (!datos.consent) { marcar("consent", M.consent); ok = false; }

    evento("ecommerce_form_submit", { plan: datos.plan || "sin_plan" });

    if (!ok) {
      aviso.hidden = false;
      aviso.dataset.tipo = "error";
      aviso.textContent = M.revisar;
      return;
    }

    boton.disabled = true;
    boton.textContent = M.enviando;
    aviso.hidden = false;
    aviso.dataset.tipo = "info";
    aviso.textContent = M.enviando;

    try {
      const res = await fetch(`${API}/api/ecommerce/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await res.json().catch(() => ({}));

      if (res.status === 422 && cuerpo.campo) {
        marcar(cuerpo.campo === "contacto" ? "contacto" : cuerpo.campo, M[cuerpo.campo] || M.nombre);
        aviso.textContent = M.revisar;
        return;
      }
      if (res.status === 429) {
        aviso.textContent = M.demasiados;
        return;
      }
      if (!res.ok) {
        aviso.textContent = M.error;
        return;
      }

      evento("ecommerce_lead_creado", { plan: datos.plan });
      form.hidden = true;
      aviso.hidden = true;
      exito.hidden = false;
      exito.focus();
    } catch {
      aviso.textContent = M.red;
    } finally {
      boton.disabled = false;
      boton.textContent = M.boton;
    }
  });
}

const otra = document.getElementById("ec-otra");
if (otra) {
  otra.addEventListener("click", () => {
    form.reset();
    form.hidden = false;
    exito.hidden = true;
    limpiar();
    document.getElementById("ec-nombre").focus();
  });
}

// La vuelta desde una demo trae ?demo=<clave>: así se mide qué demo genera
// consultas y no sólo cuántos abrieron la tienda de ejemplo.
const demoOrigen = new URLSearchParams(location.search).get("demo");
if (demoOrigen) evento("ecommerce_desde_demo", { demo: demoOrigen });

evento("ecommerce_vista", { plan_url: planUrl || "", demo_origen: demoOrigen || "" });
