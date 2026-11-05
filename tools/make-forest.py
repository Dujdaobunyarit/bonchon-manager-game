# Draws the original forest scene for game 1 into img/forest.svg. Run: python3 tools/make-forest.py
import random, math
random.seed(11)
W, H = 1600, 900
o = []
add = o.append

def blobs(cx, cy, w, h, n, r0, r1, fill):
    s = []
    for _ in range(n):
        a = random.random() * math.tau
        d = random.random() ** .6
        s.append(f'<circle cx="{cx + math.cos(a) * d * w:.0f}" cy="{cy + math.sin(a) * d * h:.0f}" r="{random.uniform(r0, r1):.0f}"/>')
    add(f'<g fill="{fill}">{"".join(s)}</g>')

def trunk(x, top, bottom, w0, w1, fill, lean=0):
    add(f'<path fill="{fill}" d="M{x - w1} {bottom} C{x - w1 * .7} {bottom - 90},{x - w0 + lean} {top + 200},{x - w0 + lean} {top} L{x + w0 + lean} {top} C{x + w0 + lean} {top + 200},{x + w1 * .7} {bottom - 90},{x + w1} {bottom} Z"/>')

def leaf(x, y, l, w, ang, fill, vein):
    add(f'<g transform="translate({x} {y}) rotate({ang})"><path fill="{fill}" d="M0 0 C{-w} {-l * .3},{-w} {-l * .8},0 {-l} C{w} {-l * .8},{w} {-l * .3},0 0Z"/><path stroke="{vein}" stroke-width="4" fill="none" d="M0 0 L0 {-l * .9}"/></g>')

add(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">')
add('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9f7ee"/><stop offset=".6" stop-color="#f4fde0"/><stop offset="1" stop-color="#d6f5c4"/></linearGradient>
<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbd1" stop-opacity=".95"/><stop offset="1" stop-color="#fffbd1" stop-opacity="0"/></radialGradient>
<linearGradient id="meadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9ee75"/><stop offset="1" stop-color="#52c56f"/></linearGradient>
<linearGradient id="bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b3f48"/><stop offset="1" stop-color="#94605a"/></linearGradient>
<linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>''')
add(f'<rect width="{W}" height="{H}" fill="url(#sky)"/><circle cx="800" cy="310" r="430" fill="url(#sun)"/>')

# far forest
for x in [150, 330, 500, 640, 960, 1100, 1270, 1450]:
    trunk(x, 40, 640, random.randint(9, 15), random.randint(20, 30), '#b5ddd0', random.randint(-12, 12))
blobs(800, 90, 900, 110, 34, 70, 150, '#a4e0c8')
blobs(250, 470, 330, 60, 14, 40, 90, '#9fdcc0')
blobs(1350, 470, 330, 60, 14, 40, 90, '#9fdcc0')

# middle forest
for x, w in [(235, 28), (430, 22), (1180, 24), (1370, 30)]:
    trunk(x, 30, 690, w, w * 2, '#7fb3a3', random.randint(-14, 14))
blobs(330, 120, 420, 90, 24, 60, 125, '#62c3a0')
blobs(1270, 120, 420, 90, 24, 60, 125, '#62c3a0')
blobs(210, 560, 260, 60, 16, 45, 95, '#55bd97')
blobs(1390, 560, 260, 60, 16, 45, 95, '#55bd97')
blobs(800, 610, 210, 26, 10, 26, 50, '#7fd5a5')

# light shafts
for x, d in [(560, 170), (800, 130), (1010, 190)]:
    add(f'<polygon fill="url(#shaft)" points="{x - 40},0 {x + 60},0 {x + d + 90},720 {x + d - 90},720"/>')

# meadow
add(f'<path fill="url(#meadow)" d="M0 660 C260 600,520 640,800 628 C1080 616,1340 600,{W} 656 L{W} {H} L0 {H}Z"/>')
add('<ellipse cx="800" cy="745" rx="480" ry="66" fill="#dcf77f" opacity=".85"/><ellipse cx="240" cy="772" rx="230" ry="26" fill="#3bab66" opacity=".4"/><ellipse cx="1370" cy="768" rx="240" ry="28" fill="#3bab66" opacity=".4"/>')
for _ in range(46):
    x, y = random.randint(40, W - 40), random.randint(660, 860)
    add(f'<path stroke="#2e9c60" stroke-width="4" fill="none" stroke-linecap="round" d="M{x} {y} q-5 -13 -9 -16 M{x} {y} q1 -14 1 -20 M{x} {y} q5 -13 9 -16"/>')
for _ in range(16):
    x, y, c = random.randint(120, W - 120), random.randint(680, 830), random.choice(['#fff6a8', '#ffb4c8', '#ffffff'])
    add(f'<g fill="{c}"><circle cx="{x - 5}" cy="{y}" r="5"/><circle cx="{x + 5}" cy="{y}" r="5"/><circle cx="{x}" cy="{y - 5}" r="5"/><circle cx="{x}" cy="{y + 5}" r="5"/></g><circle cx="{x}" cy="{y}" r="3.5" fill="#f5a623"/>')

# framing trees
add('<path fill="url(#bark)" d="M-20 720 C70 650,90 450,50 240 C40 170,20 60,0 -10 L210 -10 C205 110,230 210,250 300 C290 320,340 300,405 235 L430 262 C370 340,300 380,262 372 C290 500,320 620,405 720 C280 700,120 700,-20 720Z"/>')
add('<path fill="url(#bark)" d="M1620 730 C1520 660,1500 460,1540 260 C1550 170,1570 60,1590 -10 L1390 -10 C1395 110,1370 210,1350 310 C1310 330,1260 310,1195 245 L1170 272 C1230 350,1300 392,1338 384 C1310 510,1280 630,1190 730 C1320 708,1480 708,1620 730Z"/>')
for d in ['M120 180 C150 300,120 450,160 610', 'M180 250 C200 380,190 500,240 640', 'M1470 190 C1440 310,1470 460,1430 620', 'M1410 270 C1395 390,1400 510,1360 650']:
    add(f'<path d="{d}" stroke="#54303a" stroke-width="5" fill="none" opacity=".55"/>')
blobs(250, 40, 430, 90, 30, 80, 150, '#1f7a6c')
blobs(1350, 40, 430, 90, 30, 80, 150, '#1f7a6c')
blobs(800, -30, 620, 40, 22, 70, 120, '#2a9078')
blobs(120, 90, 240, 80, 14, 55, 100, '#165e57')
blobs(1480, 90, 240, 80, 14, 55, 100, '#165e57')

# animals
# owl on the left branch
add('''<g transform="translate(372 188)"><ellipse cx="0" cy="34" rx="40" ry="50" fill="#8a5b3d"/><ellipse cx="0" cy="48" rx="24" ry="30" fill="#e7cfa4"/><path d="M-38 -2 L-30 -30 L-14 -10 L14 -10 L30 -30 L38 -2 Z" fill="#8a5b3d"/><circle cx="-15" cy="6" r="15" fill="#fff"/><circle cx="15" cy="6" r="15" fill="#fff"/><circle cx="-13" cy="7" r="7" fill="#27303a"/><circle cx="13" cy="7" r="7" fill="#27303a"/><path d="M-6 16 L0 28 L6 16Z" fill="#f4a93b"/></g>''')
# parrot on the right branch
add('''<g transform="translate(1232 196)"><path d="M12 70 L34 132 L-2 84Z" fill="#2d8bd0"/><ellipse cx="0" cy="38" rx="28" ry="44" fill="#e8403a"/><circle cx="-4" cy="-4" r="27" fill="#e8403a"/><path d="M-28 -4 C-48 -2,-46 22,-30 18 C-30 10,-28 6,-22 4Z" fill="#ffc42e"/><circle cx="-10" cy="-8" r="9" fill="#fff"/><circle cx="-12" cy="-8" r="4.5" fill="#27303a"/><path d="M16 22 C40 40,38 72,12 78Z" fill="#2eb872"/></g>''')
# monkey hanging from the canopy
add('''<g transform="translate(1120 140)"><path d="M-16 -140 C-22 -70,-20 -20,-16 28" stroke="#6b432e" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M24 78 C74 80,72 140,38 132" stroke="#6b432e" stroke-width="10" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="76" rx="32" ry="40" fill="#7c4f36"/><path d="M16 46 C40 66,36 104,18 120" stroke="#6b432e" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="-2" cy="24" r="33" fill="#7c4f36"/><circle cx="-37" cy="22" r="11" fill="#d6a97c"/><circle cx="33" cy="22" r="11" fill="#d6a97c"/><ellipse cx="-2" cy="30" rx="23" ry="19" fill="#e8c79d"/><circle cx="-11" cy="20" r="4.5" fill="#27303a"/><circle cx="8" cy="20" r="4.5" fill="#27303a"/><path d="M-10 37 Q-2 45,7 37" stroke="#27303a" stroke-width="3" fill="none"/></g>''')
# deer peeking from the left bushes
add('''<g transform="translate(310 590)"><path d="M-22 -48 L-34 -92 M-28 -74 L-46 -84 M22 -48 L34 -92 M28 -74 L46 -84" stroke="#7a5236" stroke-width="7" stroke-linecap="round" fill="none"/><ellipse cx="-42" cy="-30" rx="20" ry="10" fill="#bb8450" transform="rotate(-18 -42 -30)"/><ellipse cx="42" cy="-30" rx="20" ry="10" fill="#bb8450" transform="rotate(18 42 -30)"/><path d="M-32 -30 C-34 -58,34 -58,32 -30 C30 0,14 34,0 36 C-14 34,-30 0,-32 -30Z" fill="#c8915b"/><ellipse cx="0" cy="18" rx="14" ry="13" fill="#f0dcc0"/><circle cx="0" cy="11" r="6" fill="#2b2320"/><circle cx="-14" cy="-20" r="5.5" fill="#2b2320"/><circle cx="14" cy="-20" r="5.5" fill="#2b2320"/><g fill="#f0dcc0"><circle cx="-20" cy="-40" r="3"/><circle cx="20" cy="-40" r="3"/></g></g>''')
add('''<g transform="translate(690 810) scale(.85)"><path d="M-22 -48 L-34 -92 M-28 -74 L-46 -84 M22 -48 L34 -92 M28 -74 L46 -84" stroke="#7a5236" stroke-width="7" stroke-linecap="round" fill="none"/><ellipse cx="-42" cy="-30" rx="20" ry="10" fill="#bb8450" transform="rotate(-18 -42 -30)"/><ellipse cx="42" cy="-30" rx="20" ry="10" fill="#bb8450" transform="rotate(18 42 -30)"/><path d="M-32 -30 C-34 -58,34 -58,32 -30 C30 0,14 34,0 36 C-14 34,-30 0,-32 -30Z" fill="#c8915b"/><ellipse cx="0" cy="18" rx="14" ry="13" fill="#f0dcc0"/><circle cx="0" cy="11" r="6" fill="#2b2320"/><circle cx="-14" cy="-20" r="5.5" fill="#2b2320"/><circle cx="14" cy="-20" r="5.5" fill="#2b2320"/><g fill="#f0dcc0"><circle cx="-20" cy="-40" r="3"/><circle cx="20" cy="-40" r="3"/></g></g>''')
# rabbit on the right
add('''<g transform="translate(915 812) scale(.95)"><ellipse cx="-13" cy="-58" rx="10" ry="34" fill="#f4eee4"/><ellipse cx="13" cy="-58" rx="10" ry="34" fill="#f4eee4"/><ellipse cx="-13" cy="-58" rx="5" ry="24" fill="#ffc7cf"/><ellipse cx="13" cy="-58" rx="5" ry="24" fill="#ffc7cf"/><ellipse cx="0" cy="26" rx="32" ry="34" fill="#f4eee4"/><circle cx="0" cy="-14" r="27" fill="#f4eee4"/><circle cx="-9" cy="-18" r="4" fill="#27303a"/><circle cx="9" cy="-18" r="4" fill="#27303a"/><path d="M-4 -8 L4 -8 L0 -3Z" fill="#f2889c"/></g>''')

# bushes and foreground leaves
blobs(120, 665, 210, 42, 14, 34, 72, '#2da67e')
blobs(1490, 665, 210, 42, 14, 34, 72, '#2da67e')
for x, y, l, w, a, f, v in [(70, 900, 310, 72, -24, '#0f6f76', '#0a555c'), (190, 910, 340, 80, -4, '#128a89', '#0d6a69'), (320, 915, 240, 62, 20, '#0f6f76', '#0a555c'), (10, 880, 240, 58, -48, '#19a08d', '#127a6c'),
                            (1530, 900, 310, 72, 24, '#0f6f76', '#0a555c'), (1410, 910, 340, 80, 4, '#128a89', '#0d6a69'), (1280, 915, 240, 62, -20, '#0f6f76', '#0a555c'), (1590, 880, 240, 58, 48, '#19a08d', '#127a6c'),
                            (560, 925, 150, 50, -14, '#178c7c', '#106a5e'), (1040, 925, 150, 50, 14, '#178c7c', '#106a5e')]:
    leaf(x, y, l, w, a, f, v)
add('<g><path d="M452 905 C450 840,462 800,476 760" stroke="#116b5d" stroke-width="6" fill="none"/><g transform="translate(478 748)"><ellipse cx="-20" cy="-3" rx="24" ry="13" fill="#ff8f4a" transform="rotate(14 -20 -3)"/><ellipse cx="20" cy="-3" rx="24" ry="13" fill="#ff8f4a" transform="rotate(-14 20 -3)"/><ellipse cx="0" cy="-20" rx="15" ry="24" fill="#ffc06b"/><circle r="9" fill="#ffe08a"/></g></g>')
add('</svg>')
open('img/forest.svg', 'w', encoding='utf8').write('\n'.join(o))
print(sum(len(x) for x in o) // 1024, 'KB')
