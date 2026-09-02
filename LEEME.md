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

> **Los links legales salieron del nav superior** (17/08 estaban ahí). En el
> nav quedaron sólo "Cómo trabajo" y "Blog"; Privacidad, Condiciones y
> Eliminar datos siguen en el pie de **todas** las páginas, que es lo que pide
> Meta. Con cinco ítems el nav se rompía en pantallas chicas.

## Antes de tocar el texto: leer POSICIONAMIENTO.md

**`POSICIONAMIENTO.md` es la fuente de verdad del discurso del sitio.** Dice
qué vendemos, cuál es el mecanismo, contra qué nos comparan y qué no se dice
nunca. Si un cambio de texto contradice algo de ahí, primero se discute el
posicionamiento y después se toca el HTML.

Al final de ese documento está el análisis de qué le falta a la página hoy —
prueba, componentes, un CTA único y una vía de contacto que no sea sólo un
mail.

> Los marcadores entre corchetes (`[EMAIL]`, `[CUIT]`, `[PLAZO]` y demás) ya
> están todos completados. Si alguna vez agregás una página nueva, verificá
> con `grep -o "\[[A-ZÁÉÍÓÚÑ ]\{3,\}\]" *.html` que no quede ninguno.

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

La portada ya no es mínima: tiene el antecedente anónimo, los cinco
componentes del sistema y un CTA único por WhatsApp, según lo que pedía
POSICIONAMIENTO.md. Si vuelve a quedar desactualizada respecto de ese
documento, se corrige ahí primero.
