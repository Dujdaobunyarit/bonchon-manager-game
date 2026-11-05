# Renders the team's Illustrator files to transparent PNGs and builds review sheets.
import glob, os, subprocess, sys
from PIL import Image, ImageDraw
D = "/Users/dujdao_bu/Documents/2569/11_Manager Meeting/"
OUT = 'private/motion/art'; REF = 'private/motion/refs'
os.makedirs(OUT, exist_ok=True)
names = []
for i, f in enumerate(sorted(glob.glob(D + 'asset/*.ai'))):
    n = f'a{i:02d}'
    subprocess.run(['pdftocairo', '-png', '-transp', '-singlefile', '-scale-to', '1400', f, f'{OUT}/{n}'], capture_output=True)
    names.append((n, os.path.basename(f)))
for f in sorted(glob.glob(D + 'store/*.ai')):
    pass
print(names)
def sheet(items, path, cols=5, w=300, h=260):
    rows = (len(items) + cols - 1) // cols
    c = Image.new('RGB', (cols * w, rows * h), (120, 120, 120)); d = ImageDraw.Draw(c)
    for i, (label, p) in enumerate(items):
        try:
            m = Image.open(p).convert('RGBA'); m.thumbnail((w - 8, h - 26))
            c.paste(m, (i % cols * w + 4, i // cols * h + 22), m)
        except Exception as e:
            pass
        d.text((i % cols * w + 4, i // cols * h + 4), label, fill=(255, 255, 0))
    c.save(path, quality=82)
sheet([(n, f'{OUT}/{n}.png') for n, _ in names], f'{REF}/assets.jpg')
sheet([(os.path.basename(f)[:10], f) for f in sorted(glob.glob(D + 'store/*.jpg'))] + [('menu', D + 'asset/ที่วางเมนู.png'), ('artboard', D + 'asset/1x/Artboard 1.png'), ('photo', D + 'asset/100125_0509.jpg'), ('shot', D + 'Screenshot 2569-11-05 at 11.47.17.png')], f'{REF}/store.jpg', cols=4, w=360, h=270)
sheet([(f's{i}', f'{REF}/scene{i}.jpg') for i in range(1, 11)], f'{REF}/scenes.jpg', cols=4, w=420, h=220)
