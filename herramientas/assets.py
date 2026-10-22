"""Genera los assets del rebranding: favicon (S negra sobre naranja) y og.png.

Se corre con el python del venv de Hermes, que tiene PIL.
"""
from PIL import Image, ImageDraw, ImageFont
import pathlib

SRC = pathlib.Path('/home/ubuntu/Scalability/comercial/casa-macio/assets')
OUT = pathlib.Path('/home/ubuntu/scalability-sitio/publico')
ORANGE = (252, 131, 1)
INK = (18, 17, 16)
BG = (251, 249, 246)

s = Image.open(SRC / 'logo-s-negro.png').convert('RGBA')
bbox = s.split()[3].getbbox()          # la S sobre transparente, recortada al hueso
s = s.crop(bbox)


def tile(size, pad_ratio=0.235, radius_ratio=0.225, bg=ORANGE, fg=INK):
    """Cuadrado naranja con esquinas redondeadas y la S centrada adentro."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * radius_ratio)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=bg)

    max_w = size * (1 - pad_ratio * 2)
    max_h = size * (1 - pad_ratio * 2)
    k = min(max_w / s.width, max_h / s.height)
    w, h = max(1, int(s.width * k)), max(1, int(s.height * k))
    sym = s.resize((w, h), Image.LANCZOS)
    sym = sym.copy()
    alpha = sym.split()[3]
    flat = Image.new('RGBA', sym.size, fg + (255,))
    flat.putalpha(alpha)
    img.alpha_composite(flat, ((size - w) // 2, (size - h) // 2))
    return img


# favicon / icono del header
for size, name in ((512, 'icono.png'), (180, 'icono-180.png')):
    tile(size).save(OUT / name, optimize=True)

# og:image 1200x630
og = Image.new('RGB', (1200, 630), BG)
d = ImageDraw.Draw(og)
d.rectangle([0, 0, 1200, 8], fill=ORANGE)
logo = tile(240)
og.paste(logo, (96, 96), logo)
bold = ImageFont.truetype('/home/ubuntu/.local/share/fonts/DejaVuSansCondensed-Bold.ttf', 96)
semi = ImageFont.truetype('/home/ubuntu/.local/share/fonts/DejaVuSansCondensed.ttf', 38)
small = ImageFont.truetype('/home/ubuntu/.local/share/fonts/DejaVuSansCondensed.ttf', 30)
d.text((96, 372), 'Scalability', font=bold, fill=INK)
d.text((96, 486), 'Operación comercial medida, construida y funcionando', font=semi, fill=(95, 90, 85))
d.text((96, 546), 'scalabilitysystems.com.ar', font=small, fill=ORANGE)
og.save(OUT / 'og.png', optimize=True)

for f in ('icono.png', 'icono-180.png', 'og.png'):
    p = OUT / f
    print(f, Image.open(p).size, p.stat().st_size // 1024, 'KB')
