// ─────────────────────────────────────────────────────────────────────────
// Motor de las tiendas demo de Scalability.
//
// Arquitectura: dominio → estado → vistas. La lógica comercial (catálogo,
// filtros, disponibilidad, totales) no sabe nada de estilos, y la presentación
// no decide precios ni stock. Cada marca aporta su configuración en
// window.TIENDA; el aspecto sale de data-tema.
//
// Rutas (hash):  #/             portada
//                #/catalogo     catálogo con filtros y orden
//                #/producto/id  ficha
// El carrito es un panel lateral y el checkout es simulado: no se cobra nada.
// ─────────────────────────────────────────────────────────────────────────

const T = window.TIENDA;
const MONEDA = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const CLAVE_CARRITO = `scalability-demo-${T.clave}-carrito`;
const CLAVE_UI = `scalability-demo-${T.clave}-ui`;

const $ = (s, raiz = document) => raiz.querySelector(s);
const $$ = (s, raiz = document) => [...raiz.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const precio = (n) => MONEDA.format(n);

// ── Dominio ───────────────────────────────────────────────────────────────
const Dominio = {
  producto: (id) => T.productos.find((p) => p.id === id) || null,

  stock(producto, talle, color) {
    if (!producto) return 0;
    const exacta = producto.variantes.find(
      (v) => (v.talle ?? null) === (talle ?? null) && (v.color ?? null) === (color ?? null),
    );
    if (exacta) return exacta.stock;
    return producto.variantes
      .filter((v) => (talle ? v.talle === talle : true) && (color ? v.color === color : true))
      .reduce((a, v) => a + v.stock, 0);
  },

  filtrar(productos, f) {
    return productos.filter((p) => {
      if (f.categoria && p.categoria !== f.categoria) return false;
      if (f.necesidad && p.necesidad !== f.necesidad) return false;
      if (f.talle && !p.variantes.some((v) => v.talle === f.talle && v.stock > 0)) return false;
      if (f.color && !p.colores.some((c) => c.id === f.color)) return false;
      if (f.precio && p.precio > Number(f.precio)) return false;
      return true;
    });
  },

  ordenar(productos, orden) {
    const copia = [...productos];
    if (orden === "precio-asc") return copia.sort((a, b) => a.precio - b.precio);
    if (orden === "precio-desc") return copia.sort((a, b) => b.precio - a.precio);
    if (orden === "nombre") return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return copia;
  },

  relacionados(producto, n = 4) {
    const misma = T.productos.filter((p) => p.id !== producto.id && p.categoria === producto.categoria);
    const otras = T.productos.filter((p) => p.id !== producto.id && p.categoria !== producto.categoria);
    return misma.concat(otras).slice(0, n);
  },

  subtotal: (carrito) => carrito.reduce((a, i) => a + i.precio * i.cantidad, 0),
  unidades: (carrito) => carrito.reduce((a, i) => a + i.cantidad, 0),
};

// ── Estado ────────────────────────────────────────────────────────────────
const estado = {
  producto: null,
  filtros: { categoria: "", necesidad: "", talle: "", color: "", precio: "" },
  orden: "destacado",
  carrito: [],
  paso: "carrito",
  seleccion: { talle: null, color: null, galeria: 0 },
};

function cargar() {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || "[]");
    estado.carrito = Array.isArray(c) ? c.filter((i) => Dominio.producto(i.id)) : [];
  } catch {
    estado.carrito = [];
  }
  try {
    const ui = JSON.parse(localStorage.getItem(CLAVE_UI) || "{}");
    if (ui && typeof ui === "object") estado.orden = ui.orden || "destacado";
  } catch {}
}

function guardar() {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(estado.carrito));
    localStorage.setItem(CLAVE_UI, JSON.stringify({ orden: estado.orden }));
  } catch {}
}

function evento(nombre, datos = {}) {
  const registro = { nombre, datos: { tienda: T.clave, ...datos }, momento: new Date().toISOString() };
  (window.__eventos = window.__eventos || []).push(registro);
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: nombre, ...registro.datos });
  if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
    console.debug("[tienda]", nombre, registro.datos);
  }
}

// ── Ilustración de producto ───────────────────────────────────────────────
// No hay fotos: cada tipo de producto tiene su silueta SVG sobre un degradé.
// Es honesto (no simula fotografía de stock) y permite que la ficha tenga
// galería sin depender de archivos externos.
const FORMAS = {
  abrigo: "M32 20 L44 12 H76 L88 20 L104 40 L94 50 L84 42 V108 H36 V42 L26 50 L16 40 Z",
  buzo: "M30 22 L46 14 H74 L90 22 L104 44 L92 52 L84 44 V106 H36 V44 L28 52 L16 44 Z",
  remera: "M34 20 L48 14 H72 L86 20 L98 38 L88 46 L80 38 V100 H40 V38 L32 46 L22 38 Z",
  camisa: "M32 20 L48 14 H72 L88 20 L100 40 L90 48 L84 40 V104 H36 V40 L30 48 L20 40 Z",
  pantalon: "M38 18 H82 L88 112 H66 L60 62 L54 112 H32 Z",
  gorro: "M28 78 A32 32 0 0 1 92 78 Z M24 78 H96 V90 H24 Z",
  bufanda: "M34 16 H74 V40 H34 Z M40 40 H68 V116 L54 100 L40 116 Z",
  bolso: "M30 44 H90 L96 112 H24 Z M42 44 V34 A18 18 0 0 1 78 34 V44",
  serum: "M46 34 H74 V108 H46 Z M50 24 H70 V34 H50 Z M54 16 H66 V24 H54 Z",
  crema: "M40 56 H80 V110 H40 Z M44 44 H76 V56 H44 Z M52 34 H68 V44 H52 Z",
  limpiador: "M44 30 H76 V110 H44 Z M54 20 H66 V30 H54 Z M50 14 H70 V20 H50 Z",
  aceite: "M48 38 H72 V108 H48 Z M52 26 H68 V38 H52 Z M58 14 H62 V26 H58 Z",
  labial: "M52 40 H68 V110 H52 Z M55 24 H65 V40 H55 Z M55 24 L60 14 L65 24 Z",
  kit: "M34 44 H86 V106 H34 Z M34 44 L60 24 L86 44 M46 62 H74",
};

const PALETAS = {
  indumentaria: [["#2a2724", "#4a423a"], ["#3a352f", "#5b5147"], ["#24211d", "#3e3730"], ["#332e28", "#544a40"]],
  cosmetica: [["#f6e7e1", "#e6c8bc"], ["#f9f0ea", "#ecd2c6"], ["#f3e1d8", "#dfbcae"], ["#fbf4ef", "#e9d0c4"]],
};

function arte(producto, indice = 0) {
  const paleta = PALETAS[T.clave] || PALETAS.indumentaria;
  const [c1, c2] = paleta[(producto.orden ?? 0) % paleta.length];
  const forma = FORMAS[producto.tipo] || FORMAS.remera;
  const color = producto.colores?.[0]?.hex || (T.clave === "cosmetica" ? "#b06d5b" : "#d8d2c8");
  const giro = [-2, 2, 0][indice % 3];
  const escala = [1, 1.16, 0.92][indice % 3];
  const g = `g-${producto.id}-${indice}`;
  return `<svg viewBox="0 0 120 120" role="img" aria-label="${esc(producto.nombre)}" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="120" height="120" fill="url(#${g})"/>
    <g transform="translate(60 60) rotate(${giro}) scale(${escala}) translate(-60 -60)" opacity="0.92">
      <path d="${forma}" fill="${color}" fill-opacity="0.9" stroke="rgba(0,0,0,0.12)" stroke-width="0.8"/>
    </g>
  </svg>`;
}

// ── Piezas de interfaz ────────────────────────────────────────────────────
function tarjeta(p) {
  const agotado = p.variantes.every((v) => v.stock === 0);
  return `
    <article class="t-card${agotado ? " agotado" : ""}">
      <a class="t-card-foto" href="#/producto/${p.id}" aria-label="${esc(p.nombre)}">
        ${arte(p, 0)}
        ${agotado ? `<span class="t-badge">${esc(T.textos.sinStock)}</span>` : ""}
      </a>
      <div class="t-card-info">
        <a class="t-card-nombre" href="#/producto/${p.id}">${esc(p.nombre)}</a>
        <span class="t-card-precio">${precio(p.precio)}</span>
      </div>
      <button class="t-quick" type="button" data-agregar="${p.id}" ${agotado ? "disabled" : ""}>
        ${agotado ? esc(T.textos.sinStock) : esc(T.textos.agregar)}
      </button>
    </article>`;
}

function grilla(productos) {
  if (!productos.length) {
    return `<p class="t-vacio">${esc(T.textos.sinResultados)} <button class="t-link" type="button" data-limpiar>${esc(T.textos.limpiar)}</button></p>`;
  }
  return `<h2 class="t-solo-lectores">${esc(T.textos.catalogo)}</h2>
    <div class="t-grilla">${productos.map(tarjeta).join("")}</div>`;
}

// ── Vistas ────────────────────────────────────────────────────────────────
function vistaPortada() {
  const destacados = T.productos.filter((p) => p.destacado).slice(0, 8);
  return `
    <section class="t-portada" aria-labelledby="t-portada-titulo">
      <div class="t-portada-texto">
        <p class="t-et">${esc(T.marca.universo)}</p>
        <h1 id="t-portada-titulo">${T.marca.hero.titulo}</h1>
        <p class="t-bajada">${esc(T.marca.hero.bajada)}</p>
        <a class="t-cta" href="#/catalogo">${esc(T.marca.hero.cta)} <span aria-hidden="true">→</span></a>
      </div>
      <div class="t-portada-arte" aria-hidden="true">
        ${T.productos.slice(0, 2).map((p, i) => `<div class="t-portada-art">${arte(p, i + 1)}</div>`).join("")}
      </div>
    </section>

    <nav class="t-strip" aria-label="${esc(T.textos.categorias)}">
      ${T.filtros.categorias
        .map((c) => `<a href="#/catalogo/${c.id}" class="t-strip-link">${esc(c.nombre)}<span aria-hidden="true">→</span></a>`)
        .join("")}
    </nav>

    <section class="t-seccion">
      <div class="t-seccion-cabeza">
        <h2>${esc(T.textos.destacados)}</h2>
        <a class="t-link" href="#/catalogo">${esc(T.textos.verTodo)}</a>
      </div>
      ${grilla(destacados)}
    </section>

    ${
      T.marca.filosofia
        ? `<section class="t-filo">
            <div class="t-filo-arte" aria-hidden="true">${arte(T.productos[3] || T.productos[0], 2)}</div>
            <div class="t-filo-texto">
              <h2>${esc(T.marca.filosofia.titulo)}</h2>
              <p>${esc(T.marca.filosofia.texto)}</p>
            </div>
          </section>`
        : ""
    }`;
}

function vistaCatalogo(categoriaURL) {
  if (categoriaURL) estado.filtros.categoria = categoriaURL;
  const base = Dominio.filtrar(T.productos, estado.filtros);
  const lista = Dominio.ordenar(base, estado.orden);
  const f = T.filtros;

  const grupo = (titulo, nombre, opciones, actual) => `
    <fieldset class="t-filtro-grupo">
      <legend>${esc(titulo)}</legend>
      <div class="t-chips">
        ${opciones
          .map(
            (o) => `<button class="t-chip" type="button" data-filtro="${nombre}" data-valor="${esc(o.id)}"
              aria-pressed="${String(String(actual) === String(o.id))}">${esc(o.nombre)}</button>`,
          )
          .join("")}
      </div>
    </fieldset>`;

  return `
    <section class="t-catalogo">
      <header class="t-catalogo-cabeza">
        <h1>${esc(T.textos.catalogo)}</h1>
        <p class="t-micro">${lista.length} ${lista.length === 1 ? esc(T.textos.pieza) : esc(T.textos.piezas)}</p>
      </header>

      <div class="t-catalogo-layout">
        <form class="t-filtros" id="t-filtros" aria-label="${esc(T.textos.filtros)}">
          <button class="t-filtros-toggle" type="button" id="t-filtros-toggle" aria-expanded="false" aria-controls="t-filtros-panel">
            ${esc(T.textos.filtros)}
          </button>
          <div class="t-filtros-panel" id="t-filtros-panel">
            ${grupo(T.textos.categoria, "categoria", [{ id: "", nombre: T.textos.todas }, ...f.categorias], estado.filtros.categoria)}
            ${f.necesidades ? grupo(T.textos.necesidad, "necesidad", [{ id: "", nombre: T.textos.todas }, ...f.necesidades], estado.filtros.necesidad) : ""}
            ${f.talles ? grupo(T.textos.talle, "talle", [{ id: "", nombre: T.textos.todos }, ...f.talles], estado.filtros.talle) : ""}
            ${f.colores ? grupo(T.textos.color, "color", [{ id: "", nombre: T.textos.todos }, ...f.colores], estado.filtros.color) : ""}
            ${grupo(T.textos.precio, "precio", [{ id: "", nombre: T.textos.todos }, ...f.precios], estado.filtros.precio)}
            <button class="t-link" type="button" data-limpiar>${esc(T.textos.limpiar)}</button>
          </div>
        </form>

        <div class="t-resultados">
          <div class="t-orden">
            <label for="t-orden">${esc(T.textos.ordenar)}</label>
            <select id="t-orden">
              ${T.ordenamientos
                .map((o) => `<option value="${o.id}"${estado.orden === o.id ? " selected" : ""}>${esc(o.nombre)}</option>`)
                .join("")}
            </select>
          </div>
          <div id="t-resultados">${grilla(lista)}</div>
        </div>
      </div>
    </section>`;
}

function vistaProducto(p) {
  const talle = estado.seleccion.talle;
  const color = estado.seleccion.color;
  const stock = Dominio.stock(p, talle, color);
  const agotado = stock <= 0;

  return `
    <nav class="t-migas" aria-label="Ruta">
      <a href="#/">${esc(T.textos.inicio)}</a><span aria-hidden="true">/</span>
      <a href="#/catalogo/${p.categoria}">${esc(T.filtros.categorias.find((c) => c.id === p.categoria)?.nombre || T.textos.catalogo)}</a>
      <span aria-hidden="true">/</span><span aria-current="page">${esc(p.nombre)}</span>
    </nav>

    <article class="t-ficha-pagina">
      <div class="t-galeria">
        <div class="t-galeria-principal">${arte(p, estado.seleccion.galeria)}</div>
        <div class="t-galeria-minis" role="group" aria-label="${esc(T.textos.vistas)}">
          ${[0, 1, 2]
            .map(
              (i) => `<button class="t-mini" type="button" data-galeria="${i}" aria-pressed="${estado.seleccion.galeria === i}" aria-label="${esc(T.textos.vista)} ${i + 1}">${arte(p, i)}</button>`,
            )
            .join("")}
        </div>
      </div>

      <div class="t-ficha-datos">
        <p class="t-et">${esc(p.coleccion || "")}</p>
        <h1>${esc(p.nombre)}</h1>
        <p class="t-ficha-precio">${precio(p.precio)}</p>

        ${p.colores?.length ? `
          <div class="t-selector">
            <p class="t-selector-titulo">${esc(T.textos.color)}: <strong>${esc(p.colores.find((c) => c.id === color)?.nombre || p.colores[0].nombre)}</strong></p>
            <div class="t-swatches">
              ${p.colores.map((c) => `<button class="t-swatch${color === c.id ? " activo" : ""}" type="button" data-color="${c.id}"
                style="--sw:${c.hex}" aria-pressed="${color === c.id}" aria-label="${esc(c.nombre)}" title="${esc(c.nombre)}"></button>`).join("")}
            </div>
          </div>` : ""}

        ${p.variantes.some((v) => v.talle) ? `
          <div class="t-selector">
            <div class="t-selector-cabeza">
              <p class="t-selector-titulo">${esc(T.textos.talle)}${talle ? `: <strong>${esc(talle)}</strong>` : ""}</p>
              ${T.guia ? `<button class="t-link" type="button" id="t-guia-abrir">${esc(T.textos.guia)}</button>` : ""}
            </div>
            <div class="t-talles">
              ${[...new Set(p.variantes.map((v) => v.talle))].filter(Boolean).map((t) => {
                const s = Dominio.stock(p, t, color);
                return `<button class="t-talle${talle === t ? " activo" : ""}${s === 0 ? " agotado" : ""}" type="button" data-talle="${esc(t)}"
                  aria-pressed="${talle === t}" ${s === 0 ? "disabled" : ""}>${esc(t)}</button>`;
              }).join("")}
            </div>
          </div>` : ""}

        <p class="t-disponibilidad${agotado ? " agotado" : ""}">
          ${agotado ? esc(T.textos.sinStock) : stock <= 3 ? `${esc(T.textos.ultimas)} ${stock}` : esc(T.textos.disponible)}
        </p>

        <button class="t-cta t-ancho" type="button" id="t-ficha-agregar" ${agotado ? "disabled" : ""}>
          ${agotado ? esc(T.textos.sinStock) : esc(T.textos.agregarCarrito)}
        </button>

        <details class="t-acordeon" open>
          <summary>${esc(T.textos.descripcion)}</summary>
          <p>${esc(p.descripcion)}</p>
        </details>
        ${p.detalle ? `<details class="t-acordeon"><summary>${esc(T.textos.detalle)}</summary><p>${esc(p.detalle)}</p></details>` : ""}
        ${T.guia ? `<details class="t-acordeon" id="t-guia"><summary>${esc(T.textos.guiaTitulo)}</summary>${T.guia}</details>` : ""}
      </div>
    </article>

    <section class="t-seccion">
      <div class="t-seccion-cabeza"><h2>${esc(T.textos.relacionados)}</h2></div>
      ${grilla(Dominio.relacionados(p))}
    </section>`;
}

// ── Carrito ───────────────────────────────────────────────────────────────
function renderCarrito() {
  const unidades = Dominio.unidades(estado.carrito);
  const contador = $("#t-contador");
  contador.textContent = String(unidades);
  contador.hidden = unidades === 0;

  const items = $("#t-items");
  const subtotal = Dominio.subtotal(estado.carrito);
  $("#t-subtotal").textContent = precio(subtotal);

  if (!estado.carrito.length) {
    items.innerHTML = `<p class="t-vacio">${esc(T.textos.carritoVacio)}</p>`;
    $("#t-panel-pie").hidden = true;
    return;
  }

  $("#t-panel-pie").hidden = false;
  items.innerHTML = estado.carrito
    .map((i) => {
      const p = Dominio.producto(i.id);
      return `<div class="t-item">
        <a class="t-item-foto" href="#/producto/${i.id}">${arte(p, 0)}</a>
        <div class="t-item-info">
          <strong>${esc(i.nombre)}</strong>
          <span>${[i.talle, p?.colores.find((c) => c.id === i.color)?.nombre].filter(Boolean).map(esc).join(" · ")}</span>
          <span>${precio(i.precio)}</span>
        </div>
        <div class="t-cantidad" role="group" aria-label="Cantidad">
          <button type="button" data-restar="${i.clave}" aria-label="Quitar una unidad">−</button>
          <span>${i.cantidad}</span>
          <button type="button" data-sumar="${i.clave}" aria-label="Agregar una unidad">+</button>
        </div>
      </div>`;
    })
    .join("");
}

function agregar(id, talle = null, color = null) {
  const p = Dominio.producto(id);
  if (!p) return;

  const t = talle ?? (p.variantes.some((v) => v.talle) ? null : null);
  const c = color ?? (p.colores?.[0]?.id ?? null);

  if (p.variantes.some((v) => v.talle) && !t) {
    // Sin talle elegido no se agrega: se abre la ficha para que lo elija.
    location.hash = `#/producto/${id}`;
    avisar(T.textos.elegiTalle);
    return;
  }

  const stock = Dominio.stock(p, t, c);
  const clave = `${id}|${t ?? ""}|${c ?? ""}`;
  const enCarrito = estado.carrito.find((i) => i.clave === clave)?.cantidad ?? 0;

  if (stock === 0) {
    avisar(T.textos.sinStockAviso);
    return;
  }
  if (enCarrito >= stock) {
    avisar(`${T.textos.stockMaximo} ${stock}`);
    return;
  }

  if (enCarrito) {
    estado.carrito.find((i) => i.clave === clave).cantidad += 1;
  } else {
    estado.carrito.push({ clave, id, nombre: p.nombre, precio: p.precio, talle: t, color: c, cantidad: 1 });
  }

  guardar();
  renderCarrito();
  abrirCarrito();
  evento("tienda_add_carrito", { producto: id, talle: t || "", color: c || "" });
}

function cambiar(clave, delta) {
  const item = estado.carrito.find((i) => i.clave === clave);
  if (!item) return;
  const p = Dominio.producto(item.id);
  const stock = Dominio.stock(p, item.talle, item.color);
  const nueva = item.cantidad + delta;

  if (nueva <= 0) {
    estado.carrito = estado.carrito.filter((i) => i.clave !== clave);
  } else if (nueva > stock) {
    avisar(`${T.textos.stockMaximo} ${stock}`);
    return;
  } else {
    item.cantidad = nueva;
    evento("tienda_cantidad", { producto: item.id, cantidad: nueva });
  }
  guardar();
  renderCarrito();
}

// ── Panel del carrito ─────────────────────────────────────────────────────
function abrirCarrito() {
  $("#t-panel").hidden = false;
  document.body.classList.add("t-con-panel");
  paso("carrito");
  evento("tienda_carrito_abrir");
  $("#t-panel-cerrar").focus();
}

function cerrarCarrito() {
  $("#t-panel").hidden = true;
  document.body.classList.remove("t-con-panel");
}

function paso(cual) {
  estado.paso = cual;
  $("#t-carrito-vista").hidden = cual !== "carrito";
  $("#t-checkout").hidden = cual !== "checkout";
  $("#t-confirmacion").hidden = cual !== "listo";
}

function iniciarCheckout() {
  if (!estado.carrito.length) return;
  paso("checkout");
  evento("tienda_checkout_inicio", { unidades: Dominio.unidades(estado.carrito), total: Dominio.subtotal(estado.carrito) });
  $("#t-co-nombre").focus();
}

function confirmar(ev) {
  ev.preventDefault();
  const nombre = $("#t-co-nombre").value.trim();
  const email = $("#t-co-email").value.trim();
  const error = $("#t-co-error");

  if (nombre.length < 2 || !/^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(email)) {
    error.hidden = false;
    error.textContent = T.textos.checkoutError;
    return;
  }
  error.hidden = true;

  const numero = `DEMO-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const total = Dominio.subtotal(estado.carrito);
  evento("tienda_checkout_simulado", { unidades: Dominio.unidades(estado.carrito), total });

  $("#t-conf-numero").textContent = numero;
  $("#t-conf-monto").textContent = precio(total);
  estado.carrito = [];
  guardar();
  renderCarrito();
  paso("listo");
}

// Aviso efímero (stock, talle faltante)
let temporizador;
function avisar(texto) {
  const caja = $("#t-toast");
  caja.textContent = texto;
  caja.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (caja.hidden = true), 2600);
}

// ── Router ────────────────────────────────────────────────────────────────
function navegar() {
  const ruta = (location.hash || "#/").replace(/^#\/?/, "");
  const [seccion, param] = ruta.split("/");

  if (seccion === "producto" && param) {
    const p = Dominio.producto(param);
    if (p) {
      estado.producto = p;
      estado.seleccion = {
        talle: [...new Set(p.variantes.map((v) => v.talle))].filter(Boolean)[0] ?? null,
        color: p.colores?.[0]?.id ?? null,
        galeria: 0,
      };
      $("#t-main").innerHTML = vistaProducto(p);
      revelar();
      evento("tienda_ficha", { producto: p.id });
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
  }

  if (seccion === "catalogo") {
    estado.producto = null;
    $("#t-main").innerHTML = vistaCatalogo(param || estado.filtros.categoria || "");
    revelar();
    evento("tienda_catalogo", { categoria: param || estado.filtros.categoria || "" });
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }

  estado.producto = null;
  $("#t-main").innerHTML = vistaPortada();
  revelar();
  evento("tienda_portada");
  window.scrollTo({ top: 0, behavior: "instant" });
}

// ── Interacción ───────────────────────────────────────────────────────────
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-agregar], [data-talle], [data-color], [data-galeria], [data-sumar], [data-restar], [data-filtro], [data-limpiar], [data-portada]");
  if (!t) return;

  if (t.matches("[data-agregar]")) {
    agregar(t.getAttribute("data-agregar"));
  } else if (t.matches("[data-talle]")) {
    estado.seleccion.talle = t.getAttribute("data-talle");
    $("#t-main").innerHTML = vistaProducto(estado.producto);
  } else if (t.matches("[data-color]")) {
    estado.seleccion.color = t.getAttribute("data-color");
    $("#t-main").innerHTML = vistaProducto(estado.producto);
  } else if (t.matches("[data-galeria]")) {
    estado.seleccion.galeria = Number(t.getAttribute("data-galeria"));
    $("#t-main").innerHTML = vistaProducto(estado.producto);
  } else if (t.matches("[data-sumar]")) {
    cambiar(t.getAttribute("data-sumar"), 1);
  } else if (t.matches("[data-restar]")) {
    cambiar(t.getAttribute("data-restar"), -1);
  } else if (t.matches("[data-filtro]")) {
    const nombre = t.getAttribute("data-filtro");
    const valor = t.getAttribute("data-valor");
    estado.filtros[nombre] = estado.filtros[nombre] === valor ? "" : valor;
    $("#t-main").innerHTML = vistaCatalogo("");
    revelar();
    evento("tienda_filtro", { filtro: nombre, valor: estado.filtros[nombre] || "todos" });
  } else if (t.matches("[data-limpiar]")) {
    estado.filtros = { categoria: "", necesidad: "", talle: "", color: "", precio: "" };
    $("#t-main").innerHTML = vistaCatalogo("");
    revelar();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "t-orden") {
    estado.orden = e.target.value;
    guardar();
    const actual = $("#t-resultados");
    const lista = Dominio.ordenar(Dominio.filtrar(T.productos, estado.filtros), estado.orden);
    actual.innerHTML = grilla(lista);
    revelar();
    evento("tienda_orden", { orden: estado.orden });
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "t-filtros-toggle") {
    const panel = $("#t-filtros-panel");
    const abierto = panel.classList.toggle("abierto");
    e.target.setAttribute("aria-expanded", String(abierto));
  }
  if (e.target.id === "t-ficha-agregar") {
    const p = estado.producto;
    agregar(p.id, estado.seleccion.talle, estado.seleccion.color);
  }
  if (e.target.id === "t-guia-abrir") {
    $("#t-guia")?.setAttribute("open", "");
    $("#t-guia")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

$("#t-carrito-abrir").addEventListener("click", abrirCarrito);
$("#t-panel-cerrar").addEventListener("click", cerrarCarrito);
$("#t-comprar").addEventListener("click", iniciarCheckout);
$("#t-seguir").addEventListener("click", cerrarCarrito);
$("#t-volver-carrito").addEventListener("click", () => paso("carrito"));
$("#t-checkout").addEventListener("submit", confirmar);

addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#t-panel").hidden) cerrarCarrito();
});

addEventListener("hashchange", navegar);

// CTA comercial: conserva UTMs y agrega la demo de origen.
const destino = $("#t-volver-comercial");
if (destino) {
  const params = new URLSearchParams(location.search);
  params.set("demo", T.clave);
  destino.setAttribute("href", `/ecommerce?${params.toString()}#formulario`);
  destino.addEventListener("click", () => evento("tienda_volver_scalability"));
}

// Aparición progresiva (se llama después de cada render)
const prefiereQuieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
function revelar() {
  requestAnimationFrame(() => {
    $$(".t-card, .t-portada-texto, .t-portada-arte, .t-filo").forEach((el) => el.classList.add("entra"));
  });
}

cargar();
document.documentElement.setAttribute("data-tema", T.clave);
$("#t-marca").innerHTML = T.marca.logo || esc(T.marca.nombre);
document.title = `${T.marca.nombre} — demo de Scalability`;
navegar();
renderCarrito();
revelar();
if (prefiereQuieto) document.documentElement.classList.add("sin-motion");
evento("tienda_vista");
