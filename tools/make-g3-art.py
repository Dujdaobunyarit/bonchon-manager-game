# Builds game 3 art from the team's files: store background and round persona faces from deck page 48.
import io, sys
from pptx import Presentation
from PIL import Image, ImageDraw
D = "/Users/dujdao_bu/Documents/2569/11_Manager Meeting/"
im = Image.open(D + "Copy of Copy of BASIC AREA COACH.png").convert('RGB')
im = im.resize((1920, round(im.height * 1920 / im.width)), Image.LANCZOS)
im.save('img/store.jpg', quality=80, optimize=True, progressive=True)
p = Presentation(D + "New_Service_Final_v2 (1).pptx")
pic = next(s for s in p.slides[47].shapes if s.shape_type == 13 and s.width > 10000000)
src = Image.open(io.BytesIO(pic.image.blob)).convert('RGB')
k = src.width / 800
# centre x, centre y, radius on the 800 px wide view, in persona order p1..p7
C = [(563, 92, 46), (482, 138, 47), (741, 136, 47), (508, 325, 47), (653, 98, 46), (711, 331, 47), (603, 365, 47)]
sheet = Image.new('RGB', (7 * 150, 150), 'white')
for i, (x, y, r) in enumerate(C):
    x, y, r = x * k, y * k, r * k
    c = src.crop((round(x - r), round(y - r), round(x + r), round(y + r))).resize((240, 240), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (960, 960), 0)
    ImageDraw.Draw(m).ellipse((0, 0, 959, 959), fill=255)
    c.putalpha(m.resize((240, 240), Image.LANCZOS))
    c.save(f'img/face{i + 1}.png', optimize=True)
    t = c.copy(); t.thumbnail((150, 150)); sheet.paste(t, (i * 150, 0), t)
sheet.save(sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-503/faces.jpg', quality=85)
print(im.size, src.size)
