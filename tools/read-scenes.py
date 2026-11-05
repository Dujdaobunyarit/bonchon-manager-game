# Prints scenario notes from the updated deck and saves the scene art for reference.
import io, os, json
from pptx import Presentation
from PIL import Image
OUT = 'private/motion/refs'; os.makedirs(OUT, exist_ok=True)
p = Presentation("/Users/dujdao_bu/Documents/2569/11_Manager Meeting/อัปเดทNew Service.pptx")
data = []
for i, s in enumerate(p.slides):
    tx = [sh.text_frame.text.strip() for sh in s.shapes if sh.has_text_frame and sh.text_frame.text.strip()]
    if not tx or not tx[0].startswith('สถานการณ์ที่') or not any(sh.name == 'Scene' for sh in s.shapes): continue
    n = s.notes_slide.notes_text_frame.text.strip() if s.has_notes_slide else ''
    pic = next(sh for sh in s.shapes if sh.name == 'Scene')
    im = Image.open(io.BytesIO(pic.image.blob)).convert('RGB')
    no = tx[0].replace('สถานการณ์ที่', '').strip()
    print(f'=== slide {i + 1} {tx[0]} | {tx[1]} | scene {im.size}\n{tx[2]}\nNOTES: {n[:900]}\n')
    im.thumbnail((640, 640)); im.save(f'{OUT}/scene{no}.jpg', quality=82)
    data.append(dict(slide=i + 1, no=no, title=tx[1], situation=tx[2], notes=n))
json.dump(data, open('private/motion/scenes.json', 'w'), ensure_ascii=False, indent=1)
