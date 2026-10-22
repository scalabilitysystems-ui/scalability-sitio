"""Sella los assets con un hash en la URL (?v=xxxxxxxx).

Cloudflare cachea 4 horas por defecto. Sin esto, cambiar estilo.css o una foto
del carrusel deja el preview mostrando la versión anterior y parece que el
trabajo no se aplicó. Se corre después de tocar CSS, JS o imágenes.

    ~/.hermes/hermes-agent/venv/bin/python3 herramientas/versionar.py
"""
import hashlib
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent / "publico"
HTML = RAIZ / "index.html"


def huella(ruta: pathlib.Path) -> str:
    return hashlib.md5(ruta.read_bytes()).hexdigest()[:8]


def versionar(html: str) -> str:
    # <link href="estilo.css">, <script src="carrusel.js">, <img src="img/x.jpg">
    # Ojo: el asset ya puede venir con ?v=… de una corrida anterior; si el patrón lo
    # excluye, el archivo deja de detectarse y nunca se actualiza su versión.
    assets = sorted({m for m in re.findall(r'(?:href|src)="((?:img/)?[^"?]+\.(?:css|js|jpg|png))', html)})
    for rel in assets:
        ruta = RAIZ / rel
        if not ruta.exists():
            continue
        html = re.sub(rf'(?P<attr>href|src)="{re.escape(rel)}(?:\?v=[a-f0-9]+)?"',
                      lambda m, rel=rel, v=huella(ruta): f'{m.group("attr")}="{rel}?v={v}"',
                      html)
    return html


if __name__ == "__main__":
    texto = HTML.read_text(encoding="utf-8")
    nuevo = versionar(texto)
    if nuevo != texto:
        HTML.write_text(nuevo, encoding="utf-8")
    for m in re.finditer(r'(?:href|src)="([^"]+\?v=[a-f0-9]+)"', nuevo):
        print(" ", m.group(1))
    print("sellado:", "sí" if nuevo != texto else "no hacía falta")
