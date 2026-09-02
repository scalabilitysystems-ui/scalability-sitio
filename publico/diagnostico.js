// Diagnóstico — V1. Scoring en el navegador, resultado instantáneo.
// El copy y los pesos viven en diagnostico-config.json; acá sólo la mecánica:
// una pregunta por pantalla, progreso, captura, scoring y resultado.

const API = "https://api.scalabilitysystems.com.ar";

let config = null;
let respuestas = {}; // slug -> { etiqueta, peso }
let contacto = {};   // slug -> valor
let pasoActual = 0;  // índice sobre config.preguntas
let enCaptura = false;

function el(tag, props = {}, hijos = []) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "class") e.className = v;
    else if (k === "texto") e.textContent = v;
    else e.setAttribute(k, v);
  });
  hijos.forEach((h) => e.appendChild(h));
  return e;
}

// ── Pantallas ──────────────────────────────────────────────────────────────

const landing = document.getElementById("diag-landing");
const quiz = document.getElementById("quiz");

function mostrarQuiz() {
  landing.hidden = true;
  quiz.hidden = false;
  irAPregunta(0);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Preguntas ──────────────────────────────────────────────────────────────

const contPregunta = document.getElementById("paso-actual");
const textoProgreso = document.getElementById("progreso-texto");
const barraProgreso = document.getElementById("progreso-fill");
const btnAtras = document.getElementById("btn-atras");

function actualizarProgreso() {
  const total = config.preguntas.length;
  const actual = pasoActual + 1;
  textoProgreso.textContent = `Pregunta ${actual} de ${total}`;
  barraProgreso.style.width = `${(actual / total) * 100}%`;
  btnAtras.hidden = pasoActual === 0;
}

function irAPregunta(indice) {
  if (indice < 0) return;
  pasoActual = indice;
  renderPregunta(config.preguntas[pasoActual]);
  actualizarProgreso();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPregunta(paso) {
  contPregunta.replaceChildren();

  contPregunta.appendChild(el("h2", { texto: paso.pregunta, class: "pregunta-titulo" }));
  if (paso.ayuda) contPregunta.appendChild(el("p", { texto: paso.ayuda, class: "ayuda" }));

  const grupo = el("div", { class: "opciones" });
  paso.opciones.forEach((op) => {
    const boton = el("button", { type: "button", class: "opcion" }, [
      document.createTextNode(op.etiqueta),
    ]);
    if (respuestas[paso.slug]?.etiqueta === op.etiqueta) boton.classList.add("elegida");
    boton.addEventListener("click", () => {
      respuestas[paso.slug] = { etiqueta: op.etiqueta, peso: op.peso };
      if (pasoActual === config.preguntas.length - 1) {
        mostrarCaptura();
      } else {
        irAPregunta(pasoActual + 1);
      }
    });
    grupo.appendChild(boton);
  });
  contPregunta.appendChild(grupo);
}

// ── Captura ────────────────────────────────────────────────────────────────

function mostrarCaptura() {
  enCaptura = true;
  contPregunta.replaceChildren();

  contPregunta.appendChild(el("h2", { texto: config.captura.titulo, class: "pregunta-titulo" }));
  contPregunta.appendChild(el("p", { texto: config.captura.bajada, class: "ayuda" }));

  const form = el("form", { id: "form-captura" });

  config.captura.campos.forEach((campo) => {
    const div = el("div", { class: "campo" });
    div.appendChild(el("label", { for: `campo-${campo.slug}`, texto: campo.etiqueta }));

    if (campo.tipo === "select") {
      const select = el("select", { id: `campo-${campo.slug}` });
      const vacio = el("option", { value: "", texto: "—" });
      select.appendChild(vacio);
      campo.opciones.forEach((op) => select.appendChild(el("option", { value: op, texto: op })));
      if (campo.requerido) select.setAttribute("required", "");
      select.addEventListener("change", () => { contacto[campo.slug] = select.value; });
      div.appendChild(select);
    } else {
      const input = el("input", {
        type: campo.tipo === "email" ? "email" : "text",
        id: `campo-${campo.slug}`,
      });
      if (campo.requerido) input.setAttribute("required", "");
      if (campo.tipo === "texto") input.setAttribute("inputmode", "text");
      input.addEventListener("input", () => { contacto[campo.slug] = input.value; });
      div.appendChild(input);
    }
    form.appendChild(div);
  });

  const nav = el("div", { class: "paso-nav" });
  const btnVolver = el("button", { type: "button", class: "btn btn-ghost" }, [
    document.createTextNode("Atrás"),
  ]);
  btnVolver.addEventListener("click", () => {
    enCaptura = false;
    irAPregunta(config.preguntas.length - 1);
  });
  nav.appendChild(btnVolver);

  const btnVer = el("button", { type: "submit", class: "btn" }, [
    document.createTextNode(config.captura.cta),
  ]);
  nav.appendChild(btnVer);

  form.appendChild(nav);
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    mostrarResultado();
  });

  contPregunta.appendChild(form);

  actualizarProgreso();
  textoProgreso.textContent = "Último paso";
  btnAtras.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreTotal() {
  return config.preguntas.reduce((acc, p) => acc + (respuestas[p.slug]?.peso ?? 0), 0);
}

function nivelPara(score) {
  return config.niveles.find((n) => score >= n.min && score <= n.max);
}

// Cada dimensión se normaliza a porcentaje (su máximo difiere), y el cuello
// principal es la que peor porcentaje tiene. Empate: la de mayor puntaje
// absoluto; si persiste, el orden del config.
function cuelloPrincipal() {
  let peor = null;
  let peorPct = -1;
  config.dimensiones.forEach((dim) => {
    const maximo = dim.preguntas.reduce((acc, slug) => {
      const paso = config.preguntas.find((p) => p.slug === slug);
      return acc + Math.max(...paso.opciones.map((o) => o.peso));
    }, 0);
    const puntaje = dim.preguntas.reduce((acc, slug) => acc + (respuestas[slug]?.peso ?? 0), 0);
    const pct = maximo ? (puntaje / maximo) * 100 : 0;
    if (pct > peorPct) {
      peorPct = pct;
      peor = { dim, puntaje, pct };
    }
  });
  return peor?.dim ?? config.dimensiones[0];
}

// ── Resultado ──────────────────────────────────────────────────────────────

function mostrarResultado() {
  const score = scoreTotal();
  const nivel = nivelPara(score);
  const cuello = cuelloPrincipal();

  contPregunta.replaceChildren();

  const card = el("div", { class: "resultado" });

  card.appendChild(el("div", { class: `nivel nivel-${nivel.numero}` }, [
    el("span", { texto: `Nivel ${nivel.numero} · ${nivel.nombre}` }),
  ]));

  card.appendChild(el("h2", { texto: nivel.titulo }));
  card.appendChild(el("p", { texto: nivel.texto }));
  card.appendChild(el("p", { texto: nivel.mensaje, class: "nivel-mensaje" }));

  const dim = el("div", { class: "dimension" });
  dim.appendChild(el("h3", { texto: `Tu principal cuello de botella: ${cuello.nombre}` }));
  dim.appendChild(el("p", { texto: cuello.frase }));
  dim.appendChild(el("h4", { texto: "Qué haría primero" }));
  const lista = el("ol");
  cuello.pasos.forEach((p) => lista.appendChild(el("li", { texto: p })));
  dim.appendChild(lista);
  dim.appendChild(el("p", { texto: config.cierreDimension, class: "dim-cierre" }));
  card.appendChild(dim);

  contPregunta.appendChild(card);

  const cta = el("div", { class: "cta-post" });
  cta.appendChild(el("h2", { texto: config.ctaFinal.titulo }));
  cta.appendChild(el("p", { texto: config.ctaFinal.texto }));

  const mensaje = config.whatsapp.mensaje
    .replace("{nivel}", `Nivel ${nivel.numero} · ${nivel.nombre}`)
    .replace("{dimension}", cuello.nombre.toLowerCase());
  const url = `https://wa.me/${config.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;

  const acciones = el("div", { class: "acciones" });
  acciones.appendChild(el("a", { class: "btn", href: url, target: "_blank", rel: "noopener" }, [
    document.createTextNode(config.ctaFinal.boton),
  ]));
  cta.appendChild(acciones);
  cta.appendChild(el("p", { texto: config.ctaFinal.debajo, class: "cta-debajo" }));

  contPregunta.appendChild(cta);

  textoProgreso.textContent = "Diagnóstico listo";
  barraProgreso.style.width = "100%";
  btnAtras.hidden = true;

  window.scrollTo({ top: 0, behavior: "smooth" });

  enviar(nivel, cuello, score);
}

// ── Envío best-effort ──────────────────────────────────────────────────────

// El resultado ya se mostró. Esto intenta guardar el diagnóstico en la
// plataforma; si el endpoint todavía no acepta el formato nuevo, falla en
// silencio y no afecta nada de lo que ve el visitante.
function enviar(nivel, cuello, score) {
  const payload = {
    contacto: {
      nombre: contacto.nombre ?? "",
      email: contacto.email ?? "",
      whatsapp: contacto.whatsapp ?? "",
      empresa: contacto.empresa ?? "",
      equipo: contacto.equipo ?? "",
      facturacion: contacto.facturacion ?? "",
    },
    respuestas: Object.fromEntries(
      Object.entries(respuestas).map(([slug, r]) => [slug, r.etiqueta])
    ),
    resultado: {
      score,
      nivelClave: nivel.clave,
      nivelNombre: nivel.nombre,
      cuelloClave: cuello.clave,
      cuelloNombre: cuello.nombre,
    },
  };

  fetch(`${API}/api/diagnostico/enviar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((e) => console.warn("[diagnostico] guardado diferido", e));
}

// ── Arranque ───────────────────────────────────────────────────────────────

async function iniciar() {
  const res = await fetch("diagnostico-config.json");
  config = await res.json();

  document.getElementById("btn-empezar").addEventListener("click", mostrarQuiz);
  btnAtras.addEventListener("click", () => {
    if (enCaptura) {
      enCaptura = false;
      irAPregunta(config.preguntas.length - 1);
    } else {
      irAPregunta(pasoActual - 1);
    }
  });
}

iniciar();
