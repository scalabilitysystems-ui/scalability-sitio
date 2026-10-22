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

**Lo que el sitio vende hoy** (agosto 2026 en adelante): consultoría de operación
comercial en tres etapas — **medir** (diagnóstico pago, línea base del Día 1), **construir**
(las cinco piezas: oferta, canal, entrega, recurrencia, cobro, y la tecnología solo si el
problema la pide) y **medir de nuevo** (Día 1 contra Día 30/90/120, mensual). No se vende
un bot: la herramienta es la última decisión, nunca la primera. El autotest de 10 preguntas
(`diagnostico.html`) es la puerta de entrada gratis; el diagnóstico es el producto pago.

> Los marcadores entre corchetes (`[EMAIL]`, `[CUIT]`, `[PLAZO]` y demás) ya
> están todos completados. Si alguna vez agregás una página nueva, verificá
> con `grep -o "\[[A-ZÁÉÍÓÚÑ ]\{3,\}\]" *.html` que no quede ninguno.

## Branding y assets

Paleta vigente: naranja `#FC8301`, negro `#131211`, papel `#FBF9F6`. El isotipo es la S
caligráfica negra sobre cuadrado naranja. Todos los colores viven en las variables de
`:root` al principio de `publico/estilo.css` — no hay colores sueltos en el HTML.

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

La portada está armada sobre la propuesta de tres etapas (medir, construir, medir de
nuevo) y en ese orden aparecen las secciones: síntoma, propuesta, cómo trabajo, el caso
anónimo de la empresa de software, lo que no hago, preguntas y contacto. Si la propuesta
comercial cambia, cambia primero el documento del procedimiento y después esta portada —
no al revés.

El único CTA que importa es el de WhatsApp. El autotest es el segundo camino, para el que
todavía no quiere escribir.
