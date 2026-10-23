#!/usr/bin/env bash
# Publica el sitio y verifica el dominio real.
#
#    herramientas/publicar.sh                    # commit + push + verificación
#    herramientas/publicar.sh "mensaje"          # idem, con mensaje propio
#
# El proyecto de Pages está conectado a GitHub: empujar a main publica. NO hace falta
# token ni wrangler. Este script existe para no olvidarse el sello de versiones ni la
# verificación posterior (un push "exitoso" puede servir una hoja vieja de caché).

set -euo pipefail
cd "$(dirname "$0")/.."

DOMINIO="https://scalabilitysystems.com.ar"
MENSAJE="${1:-}"

echo "→ 1/4 Sello de versiones"
~/.hermes/hermes-agent/venv/bin/python3 herramientas/versionar.py | sed 's/^/    /'

echo "→ 2/4 Commit y push"
if [ -z "$(git status --porcelain)" ]; then
  echo "    sin cambios para commitear; igual se verifica abajo"
else
  git add -A
  git commit -q -m "${MENSAJE:-Publicación del sitio}"
fi
git push -q origin main
echo "    push ok ($(git rev-parse --short HEAD))"

echo "→ 3/4 Esperando el build de Pages"
hash_local=$(md5sum publico/estilo.css | cut -d' ' -f1)
listo=0
for i in $(seq 1 40); do
  vivo=$(curl -sf "$DOMINIO/estilo.css?b=$RANDOM$i" 2>/dev/null | md5sum | cut -d' ' -f1 || true)
  if [ "$vivo" = "$hash_local" ]; then listo=1; break; fi
  sleep 5
done
[ "$listo" = "1" ] && echo "    el dominio ya sirve la versión nueva" || echo "    (todavía sirve la anterior: se verifica igual)"

echo "→ 4/4 Verificación en $DOMINIO"
fallas=0
# Con reintento: justo después de un deploy, Cloudflare puede estar cambiando de
# deployment y devolver 502 por unos segundos. Un fallo aislado no es un defecto.
comprobar() {
  for intento in 1 2; do
    if eval "$2" >/dev/null 2>&1; then printf "    ✓ %s\n" "$1"; return 0; fi
    [ "$intento" = "1" ] && sleep 6
  done
  printf "    ✘ %s\n" "$1"; fallas=$((fallas+1))
}
comprobar "portada con sello de versión" "curl -sf '$DOMINIO/?b=$(date +%s)' | grep -q 'estilo.css?v='"
comprobar "titular nuevo"                "curl -sf '$DOMINIO/?b=$(date +%s)' | grep -q 'no necesita piezas sueltas'"
comprobar "método Día 1"                 "curl -sf '$DOMINIO/?b=$(date +%s)' | grep -q 'método Día 1'"
comprobar "carrusel"                     "curl -sf '$DOMINIO/?b=$(date +%s)' | grep -q 'carrusel-pista'"

hash_vivo=$(curl -sf "$DOMINIO/estilo.css?b=$(date +%s)" | md5sum | cut -d' ' -f1)
if [ "$hash_local" = "$hash_vivo" ]; then
  echo "    ✓ hoja de estilos idéntica a la local (${hash_local:0:8})"
else
  echo "    ✘ hoja distinta (local ${hash_local:0:8} / vivo ${hash_vivo:0:8})"; fallas=$((fallas+1))
fi

for f in marketing sitios automatizacion software analitica; do
  comprobar "imagen $f" "curl -sf -o /dev/null '$DOMINIO/img/$f.jpg?b=$(date +%s)'"
done
comprobar "sitemap"  "curl -sf -o /dev/null '$DOMINIO/sitemap.xml'"
comprobar "robots"   "curl -sf -o /dev/null '$DOMINIO/robots.txt'"
comprobar "autotest" "curl -sf -o /dev/null '$DOMINIO/diagnostico'"

echo
if [ "$fallas" -eq 0 ]; then
  echo "✔ Publicado y verificado en $DOMINIO"
else
  echo "✘ $fallas comprobaciones fallaron — revisar el deployment en el dashboard"
  exit 1
fi
