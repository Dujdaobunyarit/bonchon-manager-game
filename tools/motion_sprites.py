# Cuts the team's character art into sprites for the scenario motions.
import glob, os, subprocess
from PIL import Image, ImageDraw
D = "/Users/dujdao_bu/Documents/2569/11_Manager Meeting/asset/"
S = 'private/motion/sprites'; os.makedirs(S, exist_ok=True)
T = '/tmp/claude-503/spr'; os.makedirs(T, exist_ok=True)
def ai(name, out, px):
    subprocess.run(['pdftocairo', '-png', '-transp', '-singlefile', '-scale-to', str(px), D + name, f'{T}/{out}'], check=True, capture_output=True)
    return Image.open(f'{T}/{out}.png').convert('RGBA')
def trim(m):
    return m.crop(m.getbbox())
def save(m, n, h=None):
    m = trim(m)
    if h and m.height > h: m = m.resize((round(m.width * h / m.height), h), Image.LANCZOS)
    m.save(f'{S}/{n}.png'); return m
k = 3
a = ai('เสิฟผญ copy.ai', 'a17', 1400 * k)
def c(x0, y0, x1, y1): return a.crop((x0 * k, y0 * k, x1 * k, y1 * k))
for n, r in dict(f_ok=(150, 105, 378, 730), f_front=(522, 15, 645, 376), f_smile=(706, 18, 830, 378), f_side=(878, 18, 955, 374), f_back34=(995, 22, 1110, 372), f_back=(1145, 18, 1267, 372)).items():
    save(c(*r), n, 760)
heads = {}
for j, (y0, y1) in enumerate([(568, 632), (636, 702), (706, 772)]):
    for i, (x0, x1) in enumerate([(1050, 1106), (1130, 1188), (1208, 1264)]):
        n = ['head_smile', 'head_laugh', 'head_shock', 'head_angry', 'head_open', 'head_sad', 'head_furious', 'head_tired', 'head_cry'][j * 3 + i]
        heads[n] = save(c(x0, y0, x1, y1), n)
save(c(1025, 438, 1062, 488), 'hand_open')
save(c(1228, 436, 1268, 486), 'hand_thumb')
male = {}
for n, f in dict(m_stand='คนยืน.ai', m_shock='คนเครยีด1.ai', m_stress='คนเครียด.ai', m_think='คน_ครุ่นคิเ.ai', m_back='คนตกใจ.ai').items():
    male[n] = save(ai(f, n, 2600), n, 760)
# grumpy staff: team body with the team's angry and tired faces
def swap(body, head, name):
    b = male[body].copy(); h = heads[head]
    w = round(b.width * .42); hh = round(h.height * w / h.width); h2 = h.resize((w, hh), Image.LANCZOS)
    cx = round(b.width * .5)
    box = (cx - w // 2 + 1, -2, cx + w // 2, round(hh * .9))
    ImageDraw.Draw(b).rectangle(box, fill=(0, 0, 0, 0))
    b.alpha_composite(h2, (cx - w // 2, 0)); b.save(f'{S}/{name}.png')
swap('m_stand', 'head_angry', 'm_grumpy'); swap('m_stand', 'head_furious', 'm_furious'); swap('m_stand', 'head_tired', 'm_bored')
# customers from the deck personas, white background removed
for f in sorted(glob.glob('img/persona[0-9].png')):
    m = Image.open(f).convert('RGBA'); px = m.load(); w, h = m.size
    st = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]; seen = set()
    while st:
        x, y = st.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h): continue
        seen.add((x, y))
        r, g, b, _ = px[x, y]
        if min(r, g, b) < 251: continue
        px[x, y] = (0, 0, 0, 0)
        st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    m = trim(m); n = 'c_' + os.path.basename(f)[-5]
    m.save(f'{S}/{n}.png')
for n, f in dict(store='store.ai', logo='white-logo.ai').items():
    ai(f, n, 2000).save(f'{S}/{n}.png')
Image.open(D + 'ที่วางเมนู.png').convert('RGBA').save(f'{S}/menu_stand.png')
# review sheet
fs = sorted(glob.glob(S + '/*.png')); w, h = 190, 300; cols = 10; rows = (len(fs) + cols - 1) // cols
sh = Image.new('RGB', (cols * w, rows * h), (190, 205, 205)); d = ImageDraw.Draw(sh)
for i, f in enumerate(fs):
    m = Image.open(f).convert('RGBA'); m.thumbnail((w - 8, h - 22)); sh.paste(m, (i % cols * w + 4, i // cols * h + 18), m); d.text((i % cols * w + 3, i // cols * h + 3), os.path.basename(f)[:-4], fill=(150, 0, 0))
sh.save('private/motion/refs/sprites.jpg', quality=85); print(len(fs))
