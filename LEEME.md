# Sitio — Scalability Systems

Tres archivos, sin build ni dependencias.

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

## Antes de publicar: completar los corchetes

Están marcados **en rojo** en la página para que no se te escapen.

| Marcador | Dónde |
|---|---|
| `[EMAIL]` | ambas páginas |
| `[FECHA]` | privacidad |
| `[RAZÓN SOCIAL]`, `[CUIT]`, `[DOMICILIO]` | privacidad |
| `[BASE DE DATOS]`, `[HOSTING]`, `[REGIÓN]` | privacidad, tabla de proveedores |
| `[PLAZO]` | privacidad, retención — sugerido: 12 meses |

Buscá `[` en los dos HTML y no queda ninguno sin reemplazar.

## Actualizar el sitio publicado

No hace falta tocar GitHub ni ningún dashboard. Con el token de Cloudflare
guardado en `C:\Users\Usuario\.cloudflare\scalabilitysystems.token`
(permiso `Account → Cloudflare Pages → Edit`):

```bash
cd sitio
export CLOUDFLARE_API_TOKEN=$(cat /c/Users/Usuario/.cloudflare/scalabilitysystems.token | sed '1s/^\xef\xbb\xbf//')
export CLOUDFLARE_ACCOUNT_ID=a40806a8bb6fb2b0c40bf29850bf3345
npx wrangler pages deploy . --project-name scalability-sitio --branch main
```

Queda arriba en segundos, sin esperar propagación de DNS (el dominio y el
certificado ya están conectados). El `sed` le saca un BOM que quedó en el
archivo del token — sin eso, Wrangler tira un error de header inválido.

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

La portada es deliberadamente mínima: hoy su función es que la política tenga dónde vivir y que Meta vea algo serio. Cuando haya casos con números, ahí sí vale la pena trabajarla.
