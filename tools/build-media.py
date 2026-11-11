"""Convert Blender render output (_render/) into web media (public/media/) + manifest.json.

usage: python3 tools/build-media.py <render_dir> <out_dir>

Stills (hero, room stills) become WebP. Every camera move (lift, rooftop, room fly-ins)
becomes a short H.264 film instead of a folder of frames: one request per move, decoded
by the phone's video hardware, and a few megabytes of memory instead of gigabytes.
Each film is written four times:

    film/<name>.hd.mp4       1280x720, forward        film/<name>.sd.mp4       960x540, forward
    film/<name>.hd.rev.mp4   1280x720, reversed       film/<name>.sd.rev.mp4   960x540, reversed

Browsers cannot play video backwards, so "back" plays the reversed file. The site picks
hd or sd per device (src/lib/tier.ts). <name>.first.webp / <name>.last.webp are the end
frames the site dissolves through while the film starts.

Room fly-ins whose camera passes through a wall are split into clean segments (SEGMENTS);
the dissolve across each gap is baked into the film.

Needs ffmpeg: either on PATH, or `pip install imageio-ffmpeg`.
"""
import json, os, shutil, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

FPS = 24
TIERS = {'hd': (1280, 720, 26), 'sd': (960, 540, 27)}  # width, height, x264 crf
DISSOLVE = 8  # frames blended across a cut (~0.33 s)
SEGMENTS = {  # frames (1-based, inclusive) that are clean; picked by eye from contact sheets
    'living': [[1, 36]], 'dining': [[1, 36]], 'balcony': [[1, 36]],
    'master': [[1, 28], [33, 36]], 'bedroom2': [[1, 27], [31, 36]],
    'kitchen': [[1, 28], [34, 36]], 'bathroom': [[1, 26], [33, 36]],
}


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        exe = shutil.which('ffmpeg')
        if not exe:
            sys.exit('ffmpeg not found. Install it, or run: pip install imageio-ffmpeg')
        return exe


FFMPEG = ffmpeg_exe()

# ---------------------------------------------------------------- stills
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

def conv(j):
    s, d, w, q = j
    os.makedirs(os.path.dirname(d), exist_ok=True)
    im = Image.open(s).convert('RGB')
    if im.width != w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(d, 'WEBP', quality=q, method=5)

with ThreadPoolExecutor(8) as ex: list(ex.map(conv, jobs))

# ---------------------------------------------------------------- films
def frame_files(d):
    return sorted(x for x in os.listdir(os.path.join(src, d)) if x.endswith('.jpg'))

def timeline(d, segs):
    """Decoded frames in play order, with a dissolve baked in across each cut."""
    fs = frame_files(d)
    load = lambda i: Image.open(os.path.join(src, d, fs[i - 1])).convert('RGB')
    frames = []
    for n, (a, b) in enumerate(segs):
        clip = [load(i) for i in range(a, b + 1)]
        if n:
            prev = frames[-1]
            frames += [Image.blend(prev, clip[0], k / (DISSOLVE + 1)) for k in range(1, DISSOLVE + 1)]
        frames += clip
    return frames, len(fs)

def encode(frames, path, w, h, crf):
    iw, ih = frames[0].size
    cmd = [
        FFMPEG, '-v', 'error', '-y',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{iw}x{ih}', '-r', str(FPS), '-i', '-',
        '-vf', f'scale={w}:{h}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p',
        '-c:v', 'libx264', '-preset', 'veryslow', '-crf', str(crf),
        # High@3.1 is hardware-decoded by every phone of the last decade; a short GOP starts instantly
        '-profile:v', 'high', '-level', '3.1', '-g', '12', '-bf', '2',
        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-movflags', '+faststart', '-an', path,
    ]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in frames: p.stdin.write(f.tobytes())
    p.stdin.close()
    if p.wait(): sys.exit(f'ffmpeg failed on {path}')

film_dir = os.path.join(out, 'film')
os.makedirs(film_dir, exist_ok=True)
sequences = [('lift', 'lift', None), ('rooftop', 'rooftop', None)]
for r in sorted(os.listdir(os.path.join(src, 'rooms'))):
    sequences.append((f'rooms/{r}', f'rooms-{r}', SEGMENTS.get(r)))

films = {}
def build(seq):
    name, slug, segs = seq
    frames, total = timeline(name, segs or [[1, len(frame_files(name))]])
    for tier, (w, h, crf) in TIERS.items():
        encode(frames, os.path.join(film_dir, f'{slug}.{tier}.mp4'), w, h, crf)
        encode(frames[::-1], os.path.join(film_dir, f'{slug}.{tier}.rev.mp4'), w, h, crf)
    frames[0].save(os.path.join(film_dir, f'{slug}.first.webp'), 'WEBP', quality=84, method=5)
    frames[-1].save(os.path.join(film_dir, f'{slug}.last.webp'), 'WEBP', quality=84, method=5)
    return name, {'file': slug, 'frames': len(frames), 'source_frames': total, 'fps': FPS}

with ThreadPoolExecutor(4) as ex:
    for name, info in ex.map(build, sequences): films[name] = info

json.dump(
    {'v': 2, 'hero': hero, 'stills': stills, 'films': films, 'tiers': list(TIERS), 'ext': 'webp'},
    open(os.path.join(out, 'manifest.json'), 'w'), indent=1,
)
size = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(out) for f in fs)
print(f'{len(jobs)} stills, {len(films)} films, {size / 1e6:.1f} MB in {out}')
