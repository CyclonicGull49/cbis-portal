from PIL import Image
import os

SIZES = [
    (2732, 2732, 'splash-2732x2732.png'),
    (2732, 2732, 'splash-2732x2732-1.png'),
    (2732, 2732, 'splash-2732x2732-2.png'),
]

BG_COLOR = (26, 13, 48)
LOGO_PATH = 'public/logo.png'
OUTPUT_DIR = 'ios/App/App/Assets.xcassets/Splash.imageset'

logo = Image.open(LOGO_PATH).convert('RGBA')

for w, h, filename in SIZES:
    bg = Image.new('RGBA', (w, h), BG_COLOR + (255,))
    logo_size = int(min(w, h) * 0.35)
    logo_resized = logo.resize((logo_size, logo_size), Image.LANCZOS)
    x = (w - logo_size) // 2
    y = (h - logo_size) // 2
    bg.paste(logo_resized, (x, y), logo_resized)
    out_path = os.path.join(OUTPUT_DIR, filename)
    bg.convert('RGB').save(out_path, 'PNG')
    print(f'✅ {out_path}')

print('Splash screens generadas.')
