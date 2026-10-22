# Sitio — Scalability Systems

Sin build ni dependencias. El sitio público vive en `publico/` — es lo único
que se sube al hosting. Todo lo que está fuera de esa carpeta (este archivo,
POSICIONAMIENTO.md, PRODUCT.md, ANTECEDENTE.md, `.git`, `.claude`,
`.impeccable`) es material interno y **nunca** se despliega.

> ⚠️ **17/08/2026:** un deploy con `wrangler pages deploy .` (apuntando a la
> raíz, antes de que existiera `publico/`) subió por error toda la carpeta,
> incluyendo `ANTECEDENTE.md` y `.git`. Se corrigió moviendo el sitio público
> a `publico/` y redesplegando sólo esa carpeta. Por eso el comando de abajo
> apunta a `publico`, no a `.` — no lo cambies.

**Estado: publicado.** Vive en Cloudflare Pages (proyecto `scalability-sitio`),
con dominio propio conectado — no en GitHub Pages, que era el plan original
de este documento cuando se escribió (el repo en GitHub sigue existiendo,
pero ya no es lo que sirve el sitio).

```
https://scalabilitysystems.com.ar
https://scalabilitysystems.com.ar/privacidad   ← esta va en Meta
https://scalabilitysystems.com.ar/terminos
https://scalabilitysystems.com.ar/eliminacion-datos
```

> Cloudflare Pages saca el `.html` de las URLs solo (redirect 308 desde
> `/privacidad.html` a `/privacidad`). Usá siempre la forma sin extensión.

## El blog

Vive en `publico/blog/`. Un archivo HTML por nota, más `index.html` que las
lista. Sin generador ni build: se escribe el HTML a mano, igual que el resto
del sitio.

```
publico/blog/index.html                 → /blog
publico/blog/claude-code-autonomo.html  → /blog/claude-code-autonomo
```

Para agregar una nota: copiá el HTML de una existente, cambiá el contenido, y
sumá el bloque `<a class="entrada">` al índice. Los estilos de artículo ya
están en `estilo.css` bajo el comentario "Artículos del blog" — **no hace falta
tocar CSS** salvo que aparezca un elemento nuevo.

Cada nota tiene que llevar `canonical` y las etiquetas `og:` completas: el
tráfico llega compartido desde redes y sin eso el link se ve roto al pegarlo.

> **Los links legales salieron del nav superior** (17/08 estaban ahí) y siguen
> sólo en el pie de **todas** las páginas, que es lo que pide Meta. En la portada
> el nav lleva tres ítems ("Cómo trabajo", "La propuesta", "Autotest"); en el
> teléfono se oculta el primero por CSS, porque tres ítems más la marca no entran
> en una línea. Con cinco ítems se rompía en pantallas chicas.

## Antes de tocar el texto: leer el documento de la propuesta

**La fuente de verdad del discurso es el procedimiento comercial**, no este repo:
`~/Scalability/comercial/procedimiento-estrategia-comercial.md` (siete fases, con el
criterio de "está hecha" de cada una) y `~/Scalability/comercial/propuesta-piloto-rauda.md`
como ejemplo de propuesta escrita. Si un cambio de texto contradice ese documento,
primero se discute la propuesta y después se toca el HTML.

**Lo que el sitio vende hoy** (octubre 2026): **marketing estratégico y tecnología**.
Cinco frentes — estrategia y crecimiento comercial, sitios y sistemas de conversión,
automatización de procesos comerciales, soluciones tecnológicas a medida y analítica —
sobre un método de cinco pasos: entender, diagnosticar, definir y priorizar, diseñar e
implementar, medir y optimizar.

Las reglas de redacción que no se rompen:
- **El método tiene nombre propio: “Método Día 1”.** Es la medición del punto de partida
  (con fecha) contra la que se compara todo lo posterior. Se nombra igual en la portada, en
  el caso y en las preguntas. Es el equivalente a lo que Bain llama *Results Delivery*: lo
  que una consultora tiene y una agencia no.
- La analítica es una capacidad, **no** el posicionamiento. Si el sitio empieza a parecer
  una consultora de BI, está mal.
- La herramienta sale del problema: nunca “necesitás tal software” antes de mostrarlo.
- No se publican precios, cifras de resultado, ni casos con nombre de cliente. Lo que no
  se puede respaldar, no se escribe.
- El autotest de 10 preguntas (`diagnostico.html`) es el lead magnet: la única vía de
  captación con formulario, y el resultado se ve en pantalla.

## SEO y accesibilidad (lo que ya está puesto)

- `publico/robots.txt` y `publico/sitemap.xml` (con `lastmod` por página: **actualizarlo
  cuando cambia una URL**).
- JSON-LD `ProfessionalService` en la portada. Si cambia el teléfono o el mail, se cambian
  ahí también.
- Un solo `h1` por página, `canonical` y `og:` completos en todas.
- La paleta está separada en `--acc` (rellenos), `--acc-mid` (solo títulos grandes) y
  `--acc-text` (enlaces y rótulos chicos). **No usar `--acc` para texto**: sobre papel da
  2.38:1 y no pasa AA. Los botones van con texto negro sobre naranja (7.47:1).
- La tabla del caso se convierte en tarjetas en el teléfono (dos columnas de 170 px no se
  leen).
- Salto al contenido (`.saltar`) en la portada y en el autotest.

> Los marcadores entre corchetes (`[EMAIL]`, `[CUIT]`, `[PLAZO]` y demás) ya
> están todos completados. Si alguna vez agregás una página nueva, verificá
> con `grep -o "\[[A-ZÁÉÍÓÚÑ ]\{3,\}\]" *.html` que no quede ninguno.

## Branding y assets

Paleta vigente: naranja `#FC8301`, negro `#131211`, papel `#FBF9F6`. El isotipo es la S
caligráfica negra sobre cuadrado naranja. Todos los colores viven en las variables de
`:root` al principio de `publico/estilo.css` — no hay colores sueltos en el HTML.

**Tipografía:** los títulos van en **Petrona** (serif variable de Impallari Type,
Argentina, OFL), auto-hospedada en `publico/fuentes/`. El texto corrido usa la sans del
sistema. No se carga ninguna fuente desde un tercero.

### Reglas de diseño que no se rompen

Estas salieron de la pasada de Impeccable y son las que evitan que el sitio vuelva a
parecer armado por un modelo:

- **Sin rótulos chiquitos arriba de los títulos** (los `eyebrow`/kicker en mayúsculas).
  El título se banca solo.
- **Sin tarjetas** para los problemas ni para los servicios: listas con hairlines y
  bloques en dos columnas. Tarjetas solo para contenido realmente encapsulado, y nunca
  una tarjeta dentro de otra.
- **Sin bordes de color a la izquierda** en avisos, citas o notas: una regla de 1px
  arriba o abajo alcanza.
- **Sin glifos unicode como íconos**: los chevrons y el tilde son SVG enmascarados.
- **Sin sombras de color** (el halo naranja del hover se sacó).
- No animar `width`, `padding` ni `margin`: la barra del autotest usa `transform`. 
- Contraste: `--acc` nunca es color de texto; para eso están `--acc-mid` y `--acc-text`.

| Archivo | Para qué |
|---|---|
| `publico/icono.png` | favicon y logo de la cabecera (512 px) |
| `publico/icono-180.png` | icono de pantalla de inicio en iPhone |
| `publico/og.png` | imagen que se ve al compartir el link (1200×630) |

Los tres se regeneran con `herramientas/assets.py` (necesita PIL; en el VPS corre con
`~/.hermes/hermes-agent/venv/bin/python3`), que parte de
`~/Scalability/comercial/casa-macio/assets/logo-s-negro.png`. Si cambia el logo, se cambia
ese archivo y se vuelve a correr el script: no se editan los PNG a mano.

## Actualizar el sitio publicado

No hace falta tocar GitHub ni ningún dashboard. Con el token de Cloudflare
guardado en `C:\Users\Usuario\.cloudflare\scalabilitysystems.token`
(permiso `Account → Cloudflare Pages → Edit`):

**PowerShell** (es la consola que uso; la de abajo es para Git Bash):

```powershell
cd C:\Users\Usuario\Desktop\AGENCIA\sitio
$env:CLOUDFLARE_API_TOKEN = (Get-Content "$HOME\.cloudflare\scalabilitysystems.token" -Raw).Trim()
$env:CLOUDFLARE_ACCOUNT_ID = "a40806a8bb6fb2b0c40bf29850bf3345"
npx wrangler pages deploy publico --project-name scalability-sitio --branch main
```

El `.Trim()` importa: si el archivo del token termina en salto de línea, ese
carácter entra en la variable y Cloudflare rechaza la autenticación con un
error que no menciona nada del espacio de más.

**Git Bash / WSL:**

```bash
cd sitio
export CLOUDFLARE_API_TOKEN=$(cat /c/Users/Usuario/.cloudflare/scalabilitysystems.token)
export CLOUDFLARE_ACCOUNT_ID=a40806a8bb6fb2b0c40bf29850bf3345
npx wrangler pages deploy publico --project-name scalability-sitio --branch main
```

**Siempre `publico`, nunca `.`** — ver la advertencia arriba.

Queda arriba en segundos, sin esperar propagación de DNS (el dominio y el
certificado ya están conectados).

Seguí commiteando a `git` igual si querés, es sólo historial — el commit en
sí no dispara ningún deploy (no hay integración con GitHub armada).

## Cómo quedó conectado el dominio (referencia, ya hecho)

Proyecto de Pages `scalability-sitio`, con un CNAME en la zona de
Cloudflare: `scalabilitysystems.com.ar` → `scalability-sitio.pages.dev`
(proxied). El certificado lo emite y renueva Cloudflare solo. Si alguna vez
hay que rehacerlo desde cero, el comando que agrega el dominio es:

```
POST /accounts/{account_id}/pages/projects/scalability-sitio/domains
{"name": "scalabilitysystems.com.ar"}
```

Ese llamado NO crea el DNS solo — el CNAME hay que cargarlo aparte (se
armó a mano la primera vez).

## Nota

La portada sigue este orden, y no es decorativo: **problema → soluciones → método → caso →
diferenciación → situación del visitante → preguntas → contacto**. Primero el visitante se
reconoce en una situación, después ve qué se hace con eso, después cómo se trabaja y recién
ahí la prueba. Si la propuesta comercial cambia, se cambia el orden de las secciones y el
hero primero — no el CSS.

El único CTA que importa es el de WhatsApp. El autotest es el segundo camino, para el que
todavía no quiere escribir.
