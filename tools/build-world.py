#!/usr/bin/env python3
"""
FCBG scroll-world clip builder.

The scroll-world skill (.claude/skills/scroll-world) normally renders its camera
chain with AI video models (Higgsfield / Monid). This script is a local,
zero-cost backend for the same engine: it turns the company's real job-site
photos into a continuous "blueprint -> built" camera flight.

  dive_i      : blueprint of scene i  ->  diagonal wipe into the real photo,
                camera pushing in the whole time.
  conn_i      : photo i keeps pushing in, collapses back into its blueprint, then
                the linework of scene i+1 is drafted over it (sweep) while i fades.

Seams are frame-identical by construction (SKILL.md Step 5): every connector's
first frame is rendered with exactly the same parameters as the previous dive's
last frame, and its last frame is exactly the next dive's first frame.

Usage:  python3 tools/build-world.py            (needs numpy, Pillow, ffmpeg)
Output: public/world/{dive,conn}-N.mp4, -m.mp4 portrait variants, poster webps.
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "public", "img")
OUT = os.path.join(ROOT, "public", "world")

SCENES = ["framing.png", "drywall.png", "exte.png", "paint.png", "cleaning.png", "main.jpg"]

FPS = 30
DIVE_F = 150   # 5 s
CONN_F = 72    # 2.4 s
Z_DIVE = (1.0, 1.16)
Z_CONN_END = 1.28  # connector keeps pushing into photo i before collapsing

# brand palette (style.css): deep green, green, sage
BG = np.array([0x00, 0x2a, 0x15], np.float32) / 255  # a touch deeper than #003a1d
GRID = np.array([0x1a, 0x4f, 0x30], np.float32) / 255
LINE = np.array([0xE0, 0xE8, 0xD7], np.float32) / 255
ACCENT = np.array([0x2c, 0x97, 0x4b], np.float32) / 255


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def cover(im, W, H, focus=(0.5, 0.5)):
    s = max(W / im.width, H / im.height)
    r = im.resize((max(W, round(im.width * s)), max(H, round(im.height * s))), Image.LANCZOS)
    x = int((r.width - W) * focus[0]); y = int((r.height - H) * focus[1])
    return r.crop((x, y, x + W, y + H))


def make_grid(W, H):
    g = np.zeros((H, W), np.float32)
    step = max(24, W // 48)
    g[::step, :] = 0.35; g[:, ::step] = 0.35
    g[:: step * 4, :] = 0.8; g[:, :: step * 4] = 0.8
    # sheet border + title block, like a drawing sheet
    m = step
    g[m, m:-m] = 1; g[-m, m:-m] = 1; g[m:-m, m] = 1; g[m:-m, -m] = 1
    return g


def edge_map(photo):
    """drafting linework from an RGB float image (computed at output resolution)."""
    im = Image.fromarray((np.clip(photo, 0, 1) * 255).astype(np.uint8), "RGB").convert("L")
    g = im.filter(ImageFilter.GaussianBlur(1.3))
    e = np.asarray(g.filter(ImageFilter.FIND_EDGES), np.float32) / 255
    e = np.clip((e - 0.04) * 10, 0, 1)
    return np.asarray(Image.fromarray((e * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255


class Scene:
    def __init__(self, name, W, H):
        src = Image.open(os.path.join(IMG, name)).convert("RGB")
        base = cover(src, W, H)
        base = ImageOps.autocontrast(base, cutoff=0.5)
        self.photo = np.asarray(base, np.float32) / 255
        self.edges = edge_map(self.photo)


def zoom(arr, z, W, H):
    if abs(z - 1) < 1e-4:
        return arr
    cw, ch = W / z, H / z
    x0, y0 = (W - cw) / 2, (H - ch) / 2
    mode = "RGB" if arr.ndim == 3 else "L"
    im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), mode)
    im = im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))
    return np.asarray(im, np.float32) / 255


class Renderer:
    def __init__(self, W, H):
        self.W, self.H = W, H
        self.grid = make_grid(W, H)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.diag = (xx / W) * 0.72 + (yy / H) * 0.28          # 0..1 wipe field
        self.sweep_x = xx / W
        cx, cy = xx / W - 0.5, yy / H - 0.5
        self.vign = 1 - 0.55 * np.clip((cx * cx + cy * cy) * 1.6, 0, 1)
        self.scenes = [Scene(n, W, H) for n in SCENES]

    def blueprint(self, edge_layers):
        """edge_layers: list of (edge_array, alpha) composited onto the drafting sheet."""
        img = np.broadcast_to(BG, (self.H, self.W, 3)).copy()
        img = img + (GRID - BG) * self.grid[..., None] * 0.55
        for e, a in edge_layers:
            if a <= 0:
                continue
            img = img + (LINE - img) * (e * a)[..., None]
        return img * (0.8 + 0.2 * self.vign[..., None])

    def wipe(self, bp, photo, p):
        """diagonal reveal of photo over blueprint; p 0..1. Bright accent line on the edge."""
        if p <= 0:
            return bp
        if p >= 1:
            return photo
        edge = p * 1.25 - 0.1
        m = smooth((edge - self.diag) / 0.04)
        line = np.exp(-((self.diag - edge) / 0.006) ** 2)
        out = bp * (1 - m[..., None]) + photo * m[..., None]
        return out + (LINE - out) * (line * 0.9)[..., None]

    # ---- the two segment kinds -------------------------------------------------------
    def dive_frame(self, i, t):
        s = self.scenes[i]
        z = Z_DIVE[0] + (Z_DIVE[1] - Z_DIVE[0]) * smooth(t * 0.5 + 0.5 * t)  # gentle ease-out
        ph = zoom(s.photo, z, self.W, self.H)
        e = edge_map(ph) if abs(z - 1) > 1e-4 else s.edges
        bp = self.blueprint([(e, 1.0)])
        p = smooth((t - 0.16) / 0.5)
        return self.wipe(bp, ph, p)

    def conn_frame(self, i, t):
        a, b = self.scenes[i], self.scenes[i + 1]
        # phase 1 (0-.45): photo a keeps pushing, dissolves back to its blueprint
        za = Z_DIVE[1] + (Z_CONN_END - Z_DIVE[1]) * smooth(t / 0.7)
        pha = zoom(a.photo, za, self.W, self.H)
        ea = edge_map(pha)
        fade_a = 1 - smooth((t - 0.35) / 0.4)                 # a's linework fades
        sweep = smooth((t - 0.3) / 0.62)                       # b's linework drafted L->R
        mb = smooth((sweep * 1.15 - self.sweep_x) / 0.06) if sweep > 0 else np.zeros_like(self.sweep_x)
        if t >= 1:
            mb = np.ones_like(self.sweep_x); fade_a = 0.0
        bp = self.blueprint([(ea, fade_a), (b.edges * mb, 1.0)])
        back = smooth(t / 0.38)                                # photo -> blueprint
        return pha * (1 - back) + bp * back if back < 1 else bp


def encode(frames_fn, n, path, W, H, gop):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
           "-preset", "slow", "-crf", "21", "-g", str(gop), "-pix_fmt", "yuv420p",
           "-movflags", "+faststart", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for k in range(n):
        f = frames_fn(k / (n - 1))
        p.stdin.write((np.clip(f, 0, 1) * 255).astype(np.uint8).tobytes())
    p.stdin.close()
    if p.wait():
        sys.exit(f"ffmpeg failed on {path}")


def save_still(arr, path):
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(path, "WEBP", quality=82)


def build(W, H, suffix, gop):
    r = Renderer(W, H)
    N = len(SCENES)
    for i in range(N):
        print(f"[{suffix or 'desktop'}] dive {i}")
        encode(lambda t, i=i: r.dive_frame(i, t), DIVE_F, os.path.join(OUT, f"dive-{i}{suffix}.mp4"), W, H, gop)
        save_still(r.dive_frame(i, 0.0), os.path.join(OUT, f"still-{i}{suffix}.webp"))
        save_still(r.dive_frame(i, 1.0), os.path.join(OUT, f"photo-{i}{suffix}.webp"))
        if i < N - 1:
            # seam check: connector endpoints == dive endpoints (rendered with the same fn)
            d_end, c0 = r.dive_frame(i, 1.0), r.conn_frame(i, 0.0)
            c1, d_next = r.conn_frame(i, 1.0), r.dive_frame(i + 1, 0.0)
            print(f"   seam {i}: in={np.abs(d_end - c0).max():.4f} out={np.abs(c1 - d_next).max():.4f}")
            print(f"[{suffix or 'desktop'}] conn {i}")
            encode(lambda t, i=i: r.conn_frame(i, t), CONN_F, os.path.join(OUT, f"conn-{i}{suffix}.mp4"), W, H, gop)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    if which in ("all", "desktop"):
        build(1280, 720, "", 8)
    if which in ("all", "mobile"):
        build(720, 1280, "-m", 4)   # native portrait composition, tighter GOP for phone seeks
