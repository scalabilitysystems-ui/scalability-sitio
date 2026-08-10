# Sitio — Scalability Systems

Tres archivos, sin build ni dependencias. Se publica en GitHub Pages en cinco minutos.

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

## Publicar

```bash
cd sitio
git init
git add .
git commit -m "Sitio inicial"
git branch -M main
git remote add origin https://github.com/<usuario>/scalability-sitio.git
git push -u origin main
```

En GitHub: **Settings → Pages → Source: Deploy from a branch → main → / (root) → Save**.

En un par de minutos queda en:

```
https://<usuario>.github.io/scalability-sitio/
https://<usuario>.github.io/scalability-sitio/privacidad.html
```

**Esa segunda URL es la que va en Meta.**

## Dominio propio, cuando lo tengas

1. Crear un archivo `CNAME` con una línea: `torquesystems.com`
2. En tu proveedor de dominio, apuntar los registros A a las IP de GitHub Pages
3. En Settings → Pages, cargar el dominio y activar *Enforce HTTPS*

Después de eso, la URL de privacidad pasa a ser `torquesystems.com/privacidad.html` — acordate de actualizarla en Meta.

## Nota

La portada es deliberadamente mínima: hoy su función es que la política tenga dónde vivir y que Meta vea algo serio. Cuando haya casos con números, ahí sí vale la pena trabajarla.
