"""Convert Blender render output (_render/) into web media (public/media/) + manifest.json.

usage: python3 tools/build-media.py <render_dir> <out_dir>
Room fly-ins whose camera passes through a wall are split into segments (SEGMENTS):
the site plays each segment and dissolves across the gap.
"""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageStat

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
jobs = []

def add(s, d, w, q):
    jobs.append((os.path.join(src, s), os.path.join(out, d), w, q))

hero = []
for f in sorted(os.listdir(os.path.join(src, 'hero'))):
    k = f[5:-4]  # hero_all.jpg -> all
    hero.append(k); add(f'hero/{f}', f'hero/{k}.webp', 1920, 80)
stills = []
for f in sorted(os.listdir(os.path.join(src, 'stills'))):
    k = f[:-4]; stills.append(k); add(f'stills/{f}', f'stills/{k}.webp', 1920, 82)

seq = {}
def frames(d): return sorted(x for x in os.listdir(os.path.join(src, d)) if x.endswith('.jpg'))
for name in ['lift', 'rooftop']:
    fs = frames(name); seq[name] = len(fs)
    for f in fs: add(f'{name}/{f}', f'{name}/{f[:-4]}.webp', 1280, 76)
SEGMENTS = {  # frames (1-based, inclusive) that are clean; picked by eye from contact sheets
    'living': [[1, 36]], 'dining': [[1, 36]], 'balcony': [[1, 36]],
    'master': [[1, 28], [33, 36]], 'bedroom2': [[1, 27], [31, 36]],
    'kitchen': [[1, 28], [34, 36]], 'bathroom': [[1, 26], [33, 36]],
}
segs = {}
for r in sorted(os.listdir(os.path.join(src, 'rooms'))):
    fs = frames(f'rooms/{r}')
    seq[f'rooms/{r}'] = len(fs)
    sg = SEGMENTS.get(r, [[1, len(fs)]]); segs[f'rooms/{r}'] = sg
    for a, b in sg:
        for i in range(a, b + 1):
            f = fs[i - 1]; add(f'rooms/{r}/{f}', f'rooms/{r}/{f[:-4]}.webp', 1280, 76)

def conv(j):
    s, d, w, q = j
    os.makedirs(os.path.dirname(d), exist_ok=True)
    im = Image.open(s).convert('RGB')
    if im.width != w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(d, 'WEBP', quality=q, method=5)
with ThreadPoolExecutor(8) as ex: list(ex.map(conv, jobs))
json.dump({'hero': hero, 'stills': stills, 'seq': seq, 'segs': segs, 'ext': 'webp'}, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)
print(len(jobs), 'files')
