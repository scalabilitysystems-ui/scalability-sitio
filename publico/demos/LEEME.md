# Demos de e-commerce — Norte y Aurea

Dos tiendas de demostración que funcionan como portfolio interactivo de Scalability.
No son tiendas reales: el catálogo, el carrito y el checkout funcionan, el pago es
simulado y no se procesa nada.

- Indumentaria (Norte): https://scalabilitysystems.com.ar/demos/indumentaria/
- Cosmética (Aurea): https://scalabilitysystems.com.ar/demos/cosmetica/
- Embudo comercial: https://scalabilitysystems.com.ar/ecommerce

## Arquitectura

Un motor compartido, dos configuraciones de marca. La lógica comercial no conoce
estilos, y la presentación no decide precios ni stock.

```
publico/demos/
  tienda.css                 sistema visual común; la marca cambia tokens en [data-tema]
  tienda.js                  motor: dominio, estado, vistas, carrito, router
  indumentaria/index.html    marca + catálogo (window.TIENDA) + markup de carrito
  cosmetica/index.html       ídem, con su propio catálogo y paleta
```

En `tienda.js`, por orden:

| Bloque | Responsabilidad |
|---|---|
| `Dominio` | stock por variante, filtros, orden, relacionados, subtotal, unidades |
| `estado` | filtros activos, orden, carrito, paso del checkout, selección de la ficha |
| `arte()` | ilustración SVG por tipo de producto (no hay fotos: silueta + degradé) |
| `vistaPortada` / `vistaCatalogo` / `vistaProducto` | HTML de cada vista |
| `renderCarrito` / `agregar` / `cambiar` | carrito y validación de stock |
| `navegar` | router por hash (`#/`, `#/catalogo`, `#/producto/:id`) |

Reglas que sostienen las dos tiendas:

- **El stock vive en las variantes** (`talle` + `color`). Agregar valida stock, el
  carrito no deja superar el máximo y el botón de compra se deshabilita si no hay.
- **El carrito persiste** en `localStorage` con una clave por tienda
  (`scalability-demo-<clave>-carrito`), así recargar no lo borra y las dos tiendas
  no se pisan.
- **Ninguna vista escribe precios a mano**: todo sale de `Dominio.subtotal()`.
- **El checkout es simulado**: pide nombre y email, genera un número de pedido y lo
  dice explícitamente. No se piden datos de tarjeta.

## Agregar una tercera tienda

1. Copiar `indumentaria/index.html` a `publico/demos/<clave>/index.html`.
2. Reescribir `window.TIENDA`: `clave`, `marca` (logo, universo, hero, filosofía),
   `textos`, `ordenamientos`, `filtros` (categorías, necesidades, talles, colores,
   rangos de precio) y `productos`.
3. Cada producto: `id, nombre, tipo, categoria, precio, colores[], variantes[]`
   (`{talle, color, stock}`), `descripcion`, `detalle`, `destacado`.
   `tipo` elige la silueta SVG: `abrigo, buzo, remera, camisa, pantalon, gorro,
   bufanda, bolso, serum, crema, limpiador, aceite, labial, kit`.
4. Si la marca necesita otra paleta, agregar un bloque `[data-tema="<clave>"]` en
   `tienda.css` con sus tokens. Nada más.

## Medición

Eventos en `window.__eventos` (y `dataLayer` si existe), sin datos personales:

`tienda_vista`, `tienda_portada`, `tienda_catalogo`, `tienda_filtro`, `tienda_orden`,
`tienda_ficha`, `tienda_add_carrito`, `tienda_cantidad`, `tienda_carrito_abrir`,
`tienda_checkout_inicio`, `tienda_checkout_simulado`, `tienda_volver_scalability`.

La vuelta comercial conserva las UTMs de la visita y agrega `demo=<clave>`:
`/ecommerce?utm_source=…&demo=cosmetica#formulario`.

## Antes de publicar

1. `npm` no hace falta: es HTML, CSS y JS servido tal cual.
2. Probar portada, catálogo (filtros y orden), ficha (variantes, stock), carrito
   (sumar, restar, tope de stock) y checkout simulado.
3. Revisar 390, 768 y 1440: sin scroll horizontal y con el carrito usable.
4. Teclado: `Tab` por toda la tienda, `Esc` cierra el carrito.
5. Detector de anti-patrones: `impeccable detect` sobre las cinco vistas.
