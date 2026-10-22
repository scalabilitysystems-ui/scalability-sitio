# Rediseño del sitio — informe del 22/10/2026

Estado: **implementado y probado en local**. **No publicado**: el VPS no tiene
credenciales de Cloudflare (`wrangler whoami` → sin autenticar). Ver punto 8.

Repo: `~/scalability-sitio`. Commits `561dece` (contenido) y `d4703d2` (SEO y
accesibilidad), sobre `main`, pusheados a GitHub.

---

## 1. Diagnóstico inicial

Lo que había antes de tocar nada:

| Punto | Estado encontrado |
|---|---|
| Posicionamiento | Consultoría de "operación comercial" en tres etapas. El hero hablaba de "cuello de botella" y la oferta no mencionaba marketing ni desarrollo. |
| Marca | Paleta verde sobre negro, isotipo viejo (el logo cambió el 14/10 a la S naranja). |
| Navegación | 2 ítems (`Cómo trabajo`, `Blog`). Sin anclas a servicios. |
| Servicios | No había sección de servicios: una grilla de "componentes" del sistema de WhatsApp. |
| Prueba | Un caso anónimo de una empresa de software, con tabla antes/después. Bien escrito, sin métricas. |
| Conversión | 2 CTA al autotest y uno a WhatsApp; el diagnóstico se ofrecía como producto pago. |
| Forms | Un solo formulario: el del autotest (10 preguntas + captura), que postea a Supabase de forma *best-effort*. |
| SEO | `title`, `description`, `canonical` y `og:` correctos. **Faltaban** `robots.txt`, `sitemap.xml` y datos estructurados. |
| Accesibilidad | Contraste insuficiente: `#FC8301` sobre papel da 2.38:1 (AA pide 4.5) y los botones usaban texto blanco sobre naranja (2.5:1). Sin salto al contenido. Sin `scope` en tablas. |
| Mobile | Nav de 3 ítems se partía en dos renglones. Tabla de dos columnas ilegible a 390 px. |
| Peso | ~33 KB en 2 pedidos, sin dependencias externas ni build. |

## 2. Cambios implementados

**Posicionamiento y home** (reescritura completa de `publico/index.html`):
1. Hero: titular "Tu negocio no necesita piezas sueltas. Necesita una estrategia que las conecte", subtítulo con las cuatro capacidades y CTA principal "Hablemos de tu negocio" (WhatsApp).
2. Diagrama del sistema (HTML, no imagen): Estrategia → Captación → Conversión → Seguimiento → Medición, con la capa de tecnología debajo.
3. Sección de problemas: seis situaciones concretas + cierre "el problema está en el sistema que rodea la campaña".
4. Soluciones: cinco bloques con el mismo esqueleto — para quién / qué problema resuelve / qué se implementa / cuál es el siguiente paso.
5. Método: cinco pasos + aviso de alcance y número por escrito (sin precios publicados).
6. Caso: reestructurado como Contexto / Problema / Solución / Cómo funciona / Qué cambió / Qué sigue necesitando una persona. Sin métricas inventadas.
7. Diferenciación: "No empezamos por la herramienta" + cinco límites explícitos.
8. "¿En qué situación está tu negocio?": cinco opciones que anclan al bloque de solución correspondiente.
9. FAQ reescrita (incluye "¿Hacen tableros de BI?" y "Ya tengo agencia, ¿me sirve igual?").
10. Cierre: "¿Qué está frenando el crecimiento de tu negocio?" + CTA "Quiero analizar mi negocio".

**Autotest** (`diagnostico.html` + `diagnostico-config.json`): pasa a ser el lead magnet
del posicionamiento nuevo ("¿Tu negocio está listo para convertir más consultas?"), con el
cierre adaptado. Las diez preguntas y el scoring se conservaron: ya medían respuesta,
seguimiento, registro y calificación.

**Marca**: naranja `#FC8301` + negro sobre papel cálido. Isotipo nuevo (S negra sobre
cuadrado naranja) en favicon, `icono-180.png` y `og.png` (1200×630), generados por
`herramientas/assets.py` a partir del logo del 14/10.

## 3. Textos y posicionamiento nuevos

Hipótesis aplicada: *marketing estratégico + tecnología para hacer crecer tu negocio*.
Refinamientos sobre el texto propuesto:
- El subtítulo enumera lo que se construye (campañas, sitios, automatización, medición) para que "tecnología" no quede abstracta.
- El diagrama hace visible la conexión estrategia → medición; sin eso el titular es una promesa sin mecanismo.
- La sección de soluciones dice explícitamente que no son cinco servicios para vender juntos.
- La analítica queda como capacidad, con una FAQ que evita el encasillamiento en BI.

## 4. Páginas y componentes modificados

| Archivo | Qué cambió |
|---|---|
| `publico/index.html` | Reescritura completa (nueve secciones, JSON-LD, skip link, `<main>`). |
| `publico/estilo.css` | Paleta con tres naranjas según uso y contraste; componentes nuevos (`.flujo`, `.problemas`, `.solucion`, `.pasos`, `.situacion`, `.dato`); tabla del caso como tarjetas en mobile; `[hidden]` con `!important`; `scroll-margin-top` para anclas. |
| `publico/diagnostico.html` | Título, descripción, hero y microcopy del lead magnet; `<main>`, skip link, `aria-label` en el nav. |
| `publico/diagnostico-config.json` | `ctaFinal`, mensaje de WhatsApp y texto de cierre. |
| `publico/blog/index.html` y los dos artículos | Nav unificado (Inicio / Soluciones / Blog) y corrección de un ancla rota (`#como` ya no existía). |
| `publico/robots.txt`, `publico/sitemap.xml` | Nuevos. |
| `herramientas/assets.py` | Genera isotipo, icono iOS y `og.png` desde el logo. |
| `LEEME.md` | Documenta posicionamiento vigente, reglas de redacción, contraste y assets. |

## 5. Funcionalidades probadas

Con el sitio servido en local y Chromium real (desktop 1280×900 y móvil 390×844):

- Las siete anclas de navegación y las cinco de soluciones aterrizan **debajo** de la cabecera fija (sin que tape el título). Las cinco opciones de "situación" llevan a su bloque.
- Autotest completo: 10 preguntas → paso de captura → resultado. El resultado se probó **bloqueando el POST** para no escribir en Supabase: la pantalla se arma igual (el guardado es best-effort, como estaba documentado).
- Formulario de captura: 6 campos con 6 `label` asociados; un solo botón "Atrás" visible por pantalla (se corrigió un duplicado que venía de antes: `display:inline-flex` le ganaba a `[hidden]`).
- Sin desborde horizontal en 390 px en portada, autotest, blog, artículo, legales y 404.
- Todos los enlaces internos y recursos responden; sin anclas rotas.
- Peso de la portada: **33 KB en 2 pedidos** (CSS + isotipo), sin fuentes ni scripts externos.

## 6. SEO, responsive y accesibilidad

- Un `h1` por página; jerarquía h2/h3 sin saltos.
- `robots.txt` + `sitemap.xml` con `lastmod`.
- JSON-LD `ProfessionalService` (nombre, mail, teléfono, descripción, área).
- `og:` completos y `og.png` propio de 1200×630.
- Contraste: `--acc-text` 4.64:1 para enlaces y rótulos chicos, `--acc-mid` 3.26:1 solo para títulos grandes, botones con texto negro sobre naranja (7.47:1).
- Salto al contenido, `aria-label` en el nav, `scope="col"` en las tablas, `width`/`height` en imágenes, `prefers-reduced-motion`.
- Mobile: nav reducido a lo esencial (Soluciones + Autotest), tabla del caso como tarjetas con rótulos ANTES/AHORA.

## 7. Integraciones pendientes y limitaciones

- **Captación por mail: no existe.** El autotest guarda el contacto en Supabase y muestra el resultado; no hay plataforma de email. El envío por SMTP de Gmail viene fallando y la migración a Resend sigue pendiente (3 registros DNS).
- **Sin secuencia de seguimiento automática**: no hay consentimiento registrado ni herramienta que lo soporte.
- **Publicación**: bloqueada por falta de token de Cloudflare en el VPS.
- **Analítica web**: no hay ningún medidor instalado (ni GA4 ni Plausible). No se agregó para no introducir un tercero sin decisión.

## 8. Requiere aprobación antes de producción

1. **Publicar** (token nuevo de Pages; el actual está comprometido desde el 23/9 y hay que rotarlo igual).
2. **Nombre de marca en la cabecera**: quedó "Scalability"; el nombre legal "Scalability Systems" sigue en el pie y en legales.
3. **Frases con promesa implícita**: "La primera conversación no tiene costo" y los plazos ("en semanas", "en meses"). Están redactadas para no comprometer fechas cerradas, pero conviene que las leas.
4. **"Soluciones tecnológicas a medida"**: se apoya en trabajo real (sistema de Rauda, panel propio), pero hoy no hay caso publicado. Si querés respaldarlo, falta un caso con nombre o anónimo.
5. **Cifras de resultado del caso de WhatsApp**: hoy no se publican. Si existen mediciones, se pueden sumar como mejora de prueba social.

## 9. Próximas mejoras, por impacto

1. **Página de caso** (P1): el caso de hoy vive dentro de la home. Una URL propia (`/casos/automatizacion-whatsapp`) puede rankear y se linkea desde el resto.
2. **Medición** (P1): sin analítica no se puede afirmar nada sobre conversión. Plausible o GA4 + un evento por CTA.
3. **Resend** (P2): desbloquea la entrega del autotest por mail y una secuencia de tres correos.
4. **Landing por servicio** (P2): cuando haya contenido suficiente para cada uno de los cinco frentes; hoy serían páginas vacías.
5. **Prueba social** (P2): dos o tres casos anónimos más, con el mismo esqueleto del actual.
6. **Checklist descargable** (P3): el autotest ya cumple la función de lead magnet; el checklist en PDF solo tiene sentido cuando exista entrega automática.
