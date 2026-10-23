// Landing del Creative Diversification Playbook.
//
// - Valida en el cliente y muestra los errores del servidor campo por campo.
// - Conserva los UTM de la visita y la primera fuente conocida (no la pisa).
// - Emite eventos con nombres estables. NO hay proveedor de analítica instalado:
//   los eventos quedan en window.__eventos y en el dataLayer si alguna vez se agrega.
//   No se envía ningún dato personal en eventos ni en parámetros.

const API = "https://api2.scalabilitysystems.com.ar";
const CLAVE_FUENTE = "scalability_fuente_inicial";

const form = document.getElementById("pb-form");
const estado = document.getElementById("pb-estado");
const ok = document.getElementById("pb-ok");
const boton = document.getElementById("pb-enviar");

// ── Eventos ────────────────────────────────────────────────────────────────
window.__eventos = window.__eventos || [];
function evento(nombre, datos = {}) {
  const registro = { nombre, datos, momento: new Date().toISOString() };
  window.__eventos.push(registro);
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: nombre, ...datos });
  if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
    console.debug("[evento]", nombre, datos);
  }
}

// ── Atribución ─────────────────────────────────────────────────────────────
function leerUtms() {
  const p = new URLSearchParams(location.search);
  const claves = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const fuente = {};
  claves.forEach((k) => { const v = p.get(k); if (v) fuente[k] = v.slice(0, 160); });
  if (Object.keys(fuente).length === 0) {
    try {
      const guardada = JSON.parse(localStorage.getItem(CLAVE_FUENTE) || "null");
      if (guardada) return { ...guardada, actual: {} };
      return { actual: {} };
    } catch { return { actual: {} }; }
  }
  // La primera fuente conocida se guarda y no se sobrescribe con visitas posteriores.
  let inicial = null;
  try { inicial = JSON.parse(localStorage.getItem(CLAVE_FUENTE) || "null"); } catch {}
  if (!inicial) {
    inicial = { ...fuente, momento: new Date().toISOString() };
    try { localStorage.setItem(CLAVE_FUENTE, JSON.stringify(inicial)); } catch {}
  }
  return { actual: fuente, inicial };
}

const atribucion = leerUtms();

// ── Envío ──────────────────────────────────────────────────────────────────
function mostrarEstado(texto, tipo = "error") {
  estado.hidden = false;
  estado.textContent = texto;
  estado.dataset.tipo = tipo;
}

function limpiarErrores() {
  ["nombre", "email", "form"].forEach((campo) => {
    const p = document.getElementById(`pb-error-${campo}`);
    if (p) { p.hidden = true; p.textContent = ""; }
  });
  [document.getElementById("pb-nombre"), document.getElementById("pb-email")]
    .forEach((i) => i && i.removeAttribute("aria-invalid"));
}

function marcarError(campo, mensaje) {
  const p = document.getElementById(`pb-error-${campo}`);
  const input = document.getElementById(`pb-${campo}`);
  if (p) { p.hidden = false; p.textContent = mensaje; }
  if (input) input.setAttribute("aria-invalid", "true");
}

function validarCliente(datos) {
  let valido = true;
  if (!datos.nombre || datos.nombre.trim().length < 2) {
    marcarError("nombre", "Indique su nombre.");
    valido = false;
  }
  if (!/^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(datos.email.trim())) {
    marcarError("email", "Indique un email válido, por ejemplo nombre@empresa.com.");
    valido = false;
  }
  return valido;
}

let empezado = false;
form.addEventListener("focusin", () => {
  if (!empezado) { empezado = true; evento("lead_magnet_form_start"); }
});

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  limpiarErrores();
  evento("lead_magnet_form_submit");

  const datos = {
    nombre: document.getElementById("pb-nombre").value,
    email: document.getElementById("pb-email").value,
    empresa: document.getElementById("pb-empresa").value,
    consent_marketing: document.getElementById("pb-consent").checked,
    consent_version: "2026-10-22",
    fuente: atribucion.inicial || atribucion.actual || {},
    fuente_actual: atribucion.actual || {},
    referrer: document.referrer || "",
    pagina: location.pathname + location.search,
  };

  if (!validarCliente(datos)) {
    mostrarEstado("Revise los campos marcados.");
    return;
  }

  boton.disabled = true;
  const textoOriginal = boton.textContent;
  boton.textContent = "Enviando…";
  mostrarEstado("Enviando la solicitud…", "info");

  try {
    const res = await fetch(`${API}/api/playbook/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await res.json().catch(() => ({}));

    if (res.status === 422 && cuerpo.campo) {
      marcarError(cuerpo.campo, cuerpo.campo === "email"
        ? "Indique un email válido, por ejemplo nombre@empresa.com."
        : "Revise este campo.");
      mostrarEstado("Revise los campos marcados.");
      return;
    }
    if (res.status === 429) {
      mostrarEstado("Se hicieron varios intentos seguidos. Espere unos minutos y vuelva a probar.");
      return;
    }
    if (!res.ok) {
      mostrarEstado("No se pudo registrar la solicitud. Vuelva a intentar en un momento.");
      return;
    }

    evento("lead_magnet_lead_created", { repetido: !!cuerpo.repetido });
    if (datos.consent_marketing) evento("lead_magnet_marketing_consent");
    estado.hidden = true;
    mostrarConfirmacion(cuerpo);
  } catch (e) {
    // Sin conexión o API caída: el usuario puede reintentar, no se pierde lo escrito.
    mostrarEstado("No hubo conexión con el servidor. Revise la conexión y vuelva a intentar.");
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
});

function mostrarConfirmacion(cuerpo) {
  form.hidden = true;
  ok.hidden = false;
  ok.focus();

  const texto = document.getElementById("pb-ok-texto");
  const acciones = document.getElementById("pb-ok-acciones");
  texto.textContent = cuerpo.repetido
    ? "Ya había una solicitud con este email. No hace falta repetirla."
    : "Registramos su solicitud de la guía.";

  acciones.replaceChildren();
  if (cuerpo.pdf_disponible) {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = `${API}/api/playbook/pdf`;
    a.textContent = "Descargar el PDF";
    a.addEventListener("click", () => evento("lead_magnet_download"));
    acciones.appendChild(a);
  } else {
    const p = document.createElement("p");
    p.className = "micro";
    p.textContent = "El archivo todavía no está cargado en el servidor: la solicitud quedó registrada y se avisa por correo cuando esté disponible.";
    texto.after(p);
  }
}

window.addEventListener("error", (e) => {
  if (location.hostname === "127.0.0.1") console.warn("[playbook]", e.message);
});
