# Larger reference views for planning the motion scenes.
import io, json
from pptx import Presentation
from PIL import Image
R = 'private/motion/refs/'
m = Image.open('private/motion/art/a17.png').convert('RGBA'); print('a17', m.size)
bg = Image.new('RGBA', m.size, (150, 150, 150, 255)); bg.alpha_composite(m); bg.convert('RGB').save(R + 'a17.jpg', quality=85)
p = Presentation("/Users/dujdao_bu/Documents/2569/11_Manager Meeting/อัปเดทNew Service.pptx")
out = Image.new('RGB', (1400, 5 * 330), 'white')
k = 0
for i, s in enumerate(p.slides):
    tx = [sh.text_frame.text.strip() for sh in s.shapes if sh.has_text_frame and sh.text_frame.text.strip()]
    if tx and tx[0].startswith('สถานการณ์ที่') and any(sh.name == 'Scene' for sh in s.shapes):
        pic = next(sh for sh in s.shapes if sh.name == 'Scene')
        im = Image.open(io.BytesIO(pic.image.blob)).convert('RGB')
        c = im.crop((0, 120, 1400, 620)).resize((700, 250))
        out.paste(c, (k % 2 * 700, k // 2 * 330)); k += 1
out.save(R + 'quotes.jpg', quality=85)
