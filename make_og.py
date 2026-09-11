from PIL import Image, ImageDraw, ImageFilter, ImageFont
import random

W, H = 1200, 630
BG   = (3, 13, 20)
PH   = (82, 224, 238)
PH2  = (26, 136, 152)
PH3  = (11, 48, 64)

random.seed(275)  # the unlock sequence, because why not

MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
f = lambda n: ImageFont.truetype(MONO, n)

base = Image.new('RGB', (W, H), BG)

# ── drifting numeral field, weighted small like the live page ────────
glyphs = Image.new('RGBA', (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glyphs)
TIERS = [(16, .48, (33, 66)), (23, .27, (66, 117)), (32, .14, (102, 153)),
         (46, .07, (140, 184)), (67, .04, (166, 209))]
for _ in range(190):
    r, acc = random.random(), 0
    for sz, wt, op in TIERS:
        acc += wt
        if r < acc:
            break
    a = random.randint(*op)
    gd.text((random.randint(-20, W), random.randint(-20, H)),
            str(random.randint(0, 9)), font=f(sz), fill=PH + (a,))

glow = glyphs.filter(ImageFilter.GaussianBlur(7))
base = Image.alpha_composite(base.convert('RGBA'), glow)
base = Image.alpha_composite(base, glyphs)

# ── one z-bloom digit, oversized and half dissolved ──────────────────
bl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(bl).text((905, 92), '7', font=f(330), fill=PH + (95,))
px = bl.load()
BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
for y in range(92, 470, 1):
    for x in range(880, 1180):
        if px[x, y][3]:
            if BAYER[((y // 4) % 4) * 4 + ((x // 4) % 4)] < 6:
                px[x, y] = (0, 0, 0, 0)
base = Image.alpha_composite(base, bl.filter(ImageFilter.GaussianBlur(2)))
base = Image.alpha_composite(base, bl)

# ── scrim: the field must never read through the wordmark ────────────
scrim = Image.new('L', (W, H), 0)
ImageDraw.Draw(scrim).rectangle([0, 150, 880, 600], fill=235)
scrim = scrim.filter(ImageFilter.GaussianBlur(90))
base = Image.composite(Image.new('RGB', (W, H), BG).convert('RGBA'), base, scrim)

d = ImageDraw.Draw(base)

# ── header rule and identity plate, echoing the page chrome ──────────
d.line([(0, 96), (W, 96)], fill=PH3, width=2)
d.rectangle([72, 52, 470, 92], outline=(26, 96, 112), width=2)
d.text((88, 63), 'SYSTEM ONLINE', font=f(18), fill=PH2)
d.text((300, 63), '5 ENTRIES', font=f(18), fill=PH2)

# ── wordmark: set as two lines so it reads at thumbnail size ─────────
title = Image.new('RGBA', (W, H), (0, 0, 0, 0))
td = ImageDraw.Draw(title)
td.text((72, 210), 'THEHILL', font=f(96), fill=PH + (255,))
td.text((72, 310), 'BEYONDTHISONE', font=f(96), fill=PH + (255,))
base = Image.alpha_composite(base, title.filter(ImageFilter.GaussianBlur(16)))
base = Image.alpha_composite(base, title.filter(ImageFilter.GaussianBlur(4)))
base = Image.alpha_composite(base, title)
d = ImageDraw.Draw(base)

d.line([(72, 438), (760, 438)], fill=PH3, width=2)
d.text((72, 462), 'An interactive terminal for five open-source projects.',
       font=f(24), fill=(120, 190, 205))

# ── the index, as the page's own bins ────────────────────────────────
names = ['RUBIKIT', 'NOTUMHUD', 'XANALY', 'HYDRA', 'NH\u00b7SA']
fills  = [0.42, 0.30, 0.33, 0.18, 0.11]
x = 72
for nm, pc in zip(names, fills):
    d.text((x, 528), nm, font=f(17), fill=PH2)
    d.rectangle([x, 556, x + 150, 566], outline=(26, 96, 112), width=1)
    d.rectangle([x + 1, 557, x + 1 + int(148 * pc), 565], fill=PH2)
    x += 178

# ── scanlines + vignette, matched to the live overlays ───────────────
sl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(sl)
for y in range(0, H, 4):
    sd.rectangle([0, y, W, y + 1], fill=(0, 0, 0, 40))
base = Image.alpha_composite(base, sl)

vig = Image.new('L', (W, H), 0)
vd = ImageDraw.Draw(vig)
for i in range(220):
    t = i / 220
    vd.ellipse([-560 + t * 560, -360 + t * 360, W + 560 - t * 560, H + 360 - t * 360],
               fill=int(225 * t))
vig = vig.filter(ImageFilter.GaussianBlur(80))
base = Image.composite(base.convert('RGB'), Image.new('RGB', (W, H), (0, 0, 0)), vig)

base.save('/home/claude/thbo/og.png', optimize=True)
print('og.png written', base.size)
