// Motor de las tiendas demo.
//
// Una sola implementación, dos marcas: el catálogo y los textos llegan en
// window.TIENDA y el aspecto cambia con data-tema. El carrito vive en
// localStorage por tienda, así recargar no lo borra.
//
// El checkout es simulado a propósito: no hay pasarela de pagos conectada y no
// se cobra nada. La confirmación lo dice con todas las letras.

const T = window.TIENDA;
const CLAVE_CARRITO = `scalability-demo-carrito-${T.clave}`;
const MONEDA = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const estado = {
  filtro: "todas",
  carrito: [],
  ficha: null,
  variante: null,
  paso: "carrito", // carrito | checkout | listo
};

// ── Persistencia ──────────────────────────────────────────────────────────
function leerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarCarrito() {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(estado.carrito));
  } catch {}
}

// ── Eventos ───────────────────────────────────────────────────────────────
function evento(nombre, datos = {}) {
  const registro = { nombre, datos: { tienda: T.clave, ...datos }, momento: new Date().toISOString() };
  (window.__eventos = window.__eventos || []).push(registro);
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: nombre, ...registro.datos });
  if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
    console.debug("[tienda]", nombre, registro.datos);
  }
}

// ── Utilidades ────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const precio = (n) => MONEDA.format(n);
const total = () => estado.carrito.reduce((a, i) => a + i.precio * i.cantidad, 0);
const unidades = () => estado.carrito.reduce((a, i) => a + i.cantidad, 0);
const producto = (id) => T.productos.find((p) => p.id === id);
// Las demos no tienen fotos reales: la ficha muestra las iniciales del producto
// en lugar de repetir el nombre que ya está abajo.
const iniciales = (texto) =>
  texto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

// ── Render: grilla y filtros ──────────────────────────────────────────────
function renderFiltros() {
  const cont = $("#t-filtros");
  if (!T.categorias?.length) {
    cont.hidden = true;
    return;
  }
  const opciones = [{ id: "todas", nombre: T.textos.todas }, ...T.categorias];
  cont.replaceChildren(
    ...opciones.map((cat) => {
      const b = document.createElement("button");
      b.className = "t-chip";
      b.type = "button";
      b.textContent = cat.nombre;
      b.setAttribute("aria-pressed", String(estado.filtro === cat.id));
      b.addEventListener("click", () => {
        estado.filtro = cat.id;
        evento("tienda_filtro", { filtro: cat.id });
        renderFiltros();
        renderGrilla();
      });
      return b;
    }),
  );
}

function renderGrilla() {
  const cont = $("#t-grilla");
  const lista = T.productos.filter((p) => estado.filtro === "todas" || p.cat === estado.filtro);

  cont.replaceChildren(
    ...lista.map((p) => {
      const art = document.createElement("article");
      art.className = "t-producto";

      const foto = document.createElement("button");
      foto.className = "t-foto";
      foto.type = "button";
      foto.textContent = iniciales(p.nombre);
      foto.setAttribute("aria-label", `${T.textos.ver} ${p.nombre}`);
      foto.addEventListener("click", () => abrirFicha(p.id));

      const h3 = document.createElement("h3");
      h3.textContent = p.nombre;

      const pr = document.createElement("p");
      pr.className = "t-precio";
      pr.textContent = precio(p.precio);

      const add = document.createElement("button");
      add.className = "t-agregar";
      add.type = "button";
      add.textContent = T.textos.agregar;
      add.addEventListener("click", () => agregar(p.id, null));

      art.append(foto, h3, pr, add);
      return art;
    }),
  );
}

// ── Ficha ─────────────────────────────────────────────────────────────────
function abrirFicha(id) {
  const p = producto(id);
  if (!p) return;
  estado.ficha = p;
  estado.variante = p.variantes?.[0] ?? null;
  evento("tienda_ficha", { producto: p.id });

  const ficha = $("#t-ficha");
  $("#t-ficha-nombre").textContent = p.nombre;
  $("#t-ficha-precio").textContent = precio(p.precio);
  $("#t-ficha-desc").textContent = p.desc;

  const variantes = $("#t-variantes");
  variantes.hidden = !p.variantes?.length;
  variantes.replaceChildren(
    ...(p.variantes ?? []).map((v) => {
      const b = document.createElement("button");
      b.className = "t-variante";
      b.type = "button";
      b.textContent = v;
      b.setAttribute("aria-pressed", String(estado.variante === v));
      b.addEventListener("click", () => {
        estado.variante = v;
        [...variantes.children].forEach((x) => x.setAttribute("aria-pressed", String(x.textContent === v)));
      });
      return b;
    }),
  );

  $("#t-ficha-agregar").onclick = () => {
    agregar(p.id, estado.variante);
    cerrarFicha();
  };

  ficha.hidden = false;
  $("#t-ficha-cerrar").focus();
}

function cerrarFicha() {
  $("#t-ficha").hidden = true;
  estado.ficha = null;
}

// ── Carrito ───────────────────────────────────────────────────────────────
function agregar(id, variante) {
  const p = producto(id);
  if (!p) return;
  const clave = `${id}${variante ? `-${variante}` : ""}`;
  const existente = estado.carrito.find((i) => i.clave === clave);
  if (existente) {
    existente.cantidad += 1;
  } else {
    estado.carrito.push({
      clave,
      id,
      nombre: p.nombre,
      precio: p.precio,
      variante,
      cantidad: 1,
    });
  }
  guardarCarrito();
  evento("tienda_add_carrito", { producto: id, variante: variante || "" });
  renderCarrito();
  abrirCarrito();
}

function cambiarCantidad(clave, delta) {
  const item = estado.carrito.find((i) => i.clave === clave);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) estado.carrito = estado.carrito.filter((i) => i.clave !== clave);
  guardarCarrito();
  renderCarrito();
}

function renderCarrito() {
  $("#t-contador").textContent = String(unidades());
  $("#t-contador").hidden = unidades() === 0;
  $("#t-subtotal").textContent = precio(total());

  const items = $("#t-items");
  const pie = $("#t-panel-pie");
  const vacio = $("#t-vacio");

  if (!estado.carrito.length) {
    items.replaceChildren();
    vacio.hidden = false;
    pie.hidden = true;
    return;
  }

  vacio.hidden = true;
  pie.hidden = false;
  items.replaceChildren(
    ...estado.carrito.map((i) => {
      const fila = document.createElement("div");
      fila.className = "t-item";

      const foto = document.createElement("div");
      foto.className = "t-item-foto";

      const detalle = document.createElement("div");
      const nombre = document.createElement("strong");
      nombre.textContent = i.nombre;
      const extra = document.createElement("span");
      extra.textContent = `${i.variante ? i.variante + " · " : ""}${precio(i.precio)}`;
      detalle.append(nombre, extra);

      const cant = document.createElement("div");
      cant.className = "t-cantidad";
      const menos = document.createElement("button");
      menos.type = "button";
      menos.textContent = "−";
      menos.setAttribute("aria-label", `Quitar una unidad de ${i.nombre}`);
      menos.addEventListener("click", () => cambiarCantidad(i.clave, -1));
      const n = document.createElement("span");
      n.textContent = String(i.cantidad);
      const mas = document.createElement("button");
      mas.type = "button";
      mas.textContent = "+";
      mas.setAttribute("aria-label", `Agregar una unidad de ${i.nombre}`);
      mas.addEventListener("click", () => cambiarCantidad(i.clave, 1));
      cant.append(menos, n, mas);

      fila.append(foto, detalle, cant);
      return fila;
    }),
  );
}

function abrirCarrito() {
  $("#t-panel").hidden = false;
  estado.paso = "carrito";
  $("#t-checkout").hidden = true;
  $("#t-confirmacion").hidden = true;
  $("#t-panel-pie").hidden = !estado.carrito.length;
  $("#t-items").hidden = false;
  evento("tienda_carrito_abrir");
  $("#t-panel-cerrar").focus();
}

function cerrarCarrito() {
  $("#t-panel").hidden = true;
}

// ── Checkout simulado ─────────────────────────────────────────────────────
function iniciarCheckout() {
  if (!estado.carrito.length) return;
  estado.paso = "checkout";
  $("#t-items").hidden = true;
  $("#t-panel-pie").hidden = true;
  $("#t-checkout").hidden = false;
  evento("tienda_checkout_inicio", { unidades: unidades(), total: total() });
  $("#t-co-nombre").focus();
}

function confirmarCheckout(ev) {
  ev.preventDefault();
  const nombre = $("#t-co-nombre").value.trim();
  const email = $("#t-co-email").value.trim();
  const error = $("#t-co-error");

  if (nombre.length < 2 || !/^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(email)) {
    error.hidden = false;
    error.textContent = "Completá nombre y un email válido para simular el pedido.";
    return;
  }
  error.hidden = true;

  const numero = `DEMO-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const monto = total();

  evento("tienda_checkout_simulado", { unidades: unidades(), total: monto });

  $("#t-checkout").hidden = true;
  const conf = $("#t-confirmacion");
  conf.hidden = false;
  $("#t-conf-numero").textContent = numero;
  $("#t-conf-monto").textContent = precio(monto);

  estado.carrito = [];
  guardarCarrito();
  renderCarrito();
  $("#t-vacio").hidden = true;
}

// ── Arranque ──────────────────────────────────────────────────────────────
estado.carrito = leerCarrito();
document.documentElement.setAttribute("data-tema", T.clave);
$("#t-marca").textContent = T.marca;
$("#t-portada-titulo").textContent = T.hero.titulo;
$("#t-portada-texto").textContent = T.hero.bajada;
$("#t-portada-etiqueta").textContent = T.hero.etiqueta;
document.title = `${T.marca} — demo de Scalability`;
document.querySelectorAll("[data-volver]").forEach((a) => {
  a.setAttribute("href", a.getAttribute("data-volver"));
});

renderFiltros();
renderGrilla();
renderCarrito();

$("#t-carrito-abrir").addEventListener("click", abrirCarrito);
$("#t-panel-cerrar").addEventListener("click", cerrarCarrito);
$("#t-ficha-cerrar").addEventListener("click", cerrarFicha);
$("#t-ficha").addEventListener("click", (e) => {
  if (e.target.id === "t-ficha") cerrarFicha();
});
$("#t-checkout").addEventListener("submit", confirmarCheckout);
$("#t-seguir").addEventListener("click", cerrarCarrito);
$("#t-comprar").addEventListener("click", iniciarCheckout);

addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("#t-ficha").hidden) cerrarFicha();
  else if (!$("#t-panel").hidden) cerrarCarrito();
});

// CTA de vuelta a la landing: se registra antes de salir.
document.querySelectorAll("[data-volver]").forEach((a) => {
  a.addEventListener("click", () => evento("tienda_volver_scalability", { destino: a.getAttribute("data-volver") }));
});

evento("tienda_vista");
