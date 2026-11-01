#!/usr/bin/env python3
"""
FCBG service-gallery builder.

Generates public/Gallery1.html … Gallery5.html plus optimised WebP photos in
public/img/work/ from the TRADES manifest below. Every page shares
public/css/site.css + public/css/gallery.css and public/js/gallery.js.

To add a photo: drop the original anywhere under public/ (e.g. public/img/work/src/),
append an entry to that trade's "photos" list, then run:

    python3 tools/build-galleries.py

Requires Pillow (with WebP support). Only real FCBG job-site photos belong here.
"""
import html
import os

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
OUT_DIR = os.path.join(PUB, "img", "work")
FULL_MAX = 1800   # longest side of the full-size webp
THUMB_W = 480

# Order = build sequence on the home page. "file" keeps the original URLs that
# index.html / site.js already link to.
TRADES = [
    {
        "id": "framing", "file": "Gallery1.html", "num": "01", "title": "Framing", "phase": "Structure",
        "lead": "Walls, trusses and blocking laid out straight from the drawings — plumb, square and on schedule.",
        "scope": [
            ("Wood & metal framing", "Load-bearing and partition walls in wood or light-gauge metal, laid out from the plans."),
            ("Trusses", "Roof and floor trusses set, braced and tied in before the envelope goes on."),
            ("Blocking", "Backing and fire blocking placed for every trade that follows."),
        ],
        "photos": [
            ("img/framing.png", "Interior walls & roof trusses", "Wood-framed interior walls with roof trusses overhead and French doors framed in"),
        ],
    },
    {
        "id": "drywall", "file": "Gallery3.html", "num": "02", "title": "Drywall", "phase": "Enclosure",
        "lead": "Hang, tape and finish, unit after unit — clean lines and fire-rated assemblies ready for paint.",
        "scope": [
            ("Hang", "Board hung tight to framing on walls and ceilings, unit after unit."),
            ("Tape & finish", "Joints taped, coated and sanded to the finish level the spec calls for."),
            ("Fire-rated assemblies", "Rated walls and ceilings built to the listed assembly."),
        ],
        "photos": [
            ("img/drywall.png", "Unit interior — board hung & finished", "Apartment unit interior with drywall hung and finished and floors protected"),
        ],
    },
    {
        "id": "exterior", "file": "Gallery2.html", "num": "03", "title": "Exterior", "phase": "Envelope",
        "lead": "Siding, trim and roofing that keep Florida weather out and give every building its character.",
        "scope": [
            ("Siding", "Lap and panel siding installed straight, sealed and ready for paint."),
            ("Trim", "Corners, windows, fascia and soffit trimmed out clean."),
            ("Roofing", "Roof coverings that close in the building and stand up to Florida storms."),
        ],
        "photos": [
            ("img/multifamily.png", "Multifamily — lap siding, trim & balconies", "Three-story multifamily building with lap siding, white trim and balcony railings"),
            ("img/exte.png", "Lap siding & trim detail", "Close-up of painted lap siding meeting white corner trim"),
            ("img/exterior.png", "Buildings around the pool deck", "Finished multifamily buildings and clubhouse around a resort-style pool"),
            ("img/main.jpg", "Clubhouse roof & amenity deck from above", "Aerial view of a clubhouse roof, pool and landscaped amenity deck"),
        ],
    },
    {
        "id": "paint", "file": "Gallery4.html", "num": "04", "title": "Paint", "phase": "Finish",
        "lead": "Interior and exterior coatings, millwork and detail — the finish clients actually see and touch.",
        "scope": [
            ("Interior", "Walls, ceilings and doors brought to a clean, even finish."),
            ("Exterior", "Siding and trim coated to protect the envelope and hold color."),
            ("Millwork & touch-up", "Built-ins and trim detailed, then punch-list touch-up before turnover."),
        ],
        "photos": [
            ("img/paint.png", "Clubhouse library — green millwork & built-ins", "Clubhouse library with deep-green painted built-in shelving and millwork"),
            ("img/clubhouse.png", "Clubhouse great room — coffered ceiling & trim", "Clubhouse great room with a white coffered ceiling and painted trim"),
        ],
    },
    {
        "id": "cleaning", "file": "Gallery5.html", "num": "05", "title": "Cleaning", "phase": "Turnover",
        "lead": "Rough and final cleans that leave every unit safe, spotless and ready for walkthrough.",
        "scope": [
            ("Rough clean", "Debris cleared between trades so every crew walks into a safe site."),
            ("Final clean", "Floors, glass, fixtures and finishes cleaned for walkthrough."),
            ("Punch & turnover", "Units checked and handed over turnover-ready."),
        ],
        "photos": [
            ("img/cleaning.png", "Rough clean between trades", "FCBG crew in safety vests clearing debris from a unit interior"),
            ("img/building.png", "Clubhouse, turnover-ready after final clean", "Finished clubhouse interior after the final clean, ready for handover"),
        ],
    },
]

PHONE_EN = ("+16562493803", "656.249.3803")
PHONE_ES = ("+18133780337", "813.378.0337")
EMAIL = "FCBuildingroup@gmail.com"

e = lambda s: html.escape(s, quote=True)


def optimise(src_rel, out_name):
    """Write full + thumb WebP; return (full_rel, thumb_rel, w, h)."""
    os.makedirs(OUT_DIR, exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(os.path.join(PUB, src_rel))).convert("RGB")
    full = im.copy()
    full.thumbnail((FULL_MAX, FULL_MAX), Image.LANCZOS)
    full.save(os.path.join(OUT_DIR, out_name + ".webp"), "WEBP", quality=80, method=6)
    th = im.copy()
    th.thumbnail((THUMB_W, THUMB_W * 2), Image.LANCZOS)
    th.save(os.path.join(OUT_DIR, out_name + "-t.webp"), "WEBP", quality=70, method=6)
    return f"img/work/{out_name}.webp", f"img/work/{out_name}-t.webp", full.width, full.height


def page(t, photos):
    n = len(photos)
    others = [o for o in TRADES if o is not t]
    idx = TRADES.index(t)
    nxt = TRADES[(idx + 1) % len(TRADES)]

    nav_links = "\n".join(
        f'      <a href="{o["file"]}"{' aria-current="page" class="is-active"' if o is t else ''}>{o["title"]}</a>'
        for o in TRADES)
    menu_links = "\n".join(
        f'      <a href="{o["file"]}"{' aria-current="page"' if o is t else ''}><small>{o["num"]}</small>{o["title"]}</a>'
        for o in TRADES)

    slides, thumbs = [], []
    for i, (full, thumb, w, h, cap, alt) in enumerate(photos):
        active = i == 0
        load = 'fetchpriority="high"' if active else 'loading="lazy"'
        slides.append(
            f'          <li class="g-slide{" is-active" if active else ""}" role="group" aria-roledescription="slide" '
            f'aria-label="{i + 1} of {n}" data-caption="{e(cap)}"{'' if active else ' aria-hidden="true"'}>\n'
            f'            <img class="g-slide__bg" src="{thumb}" alt="" aria-hidden="true">\n'
            f'            <img class="g-slide__img" src="{full}" alt="{e(alt)}" width="{w}" height="{h}" {load} decoding="async">\n'
            f'          </li>')
        thumbs.append(
            f'        <li><button class="g-thumb{" is-active" if active else ""}" type="button" data-index="{i}" '
            f'aria-label="Show photo {i + 1}: {e(cap)}"{' aria-current="true"' if active else ''}>'
            f'<img src="{thumb}" alt="" loading="lazy"><span class="mono">{i + 1:02d}</span></button></li>')

    scope = "\n".join(
        f'        <li><span class="mono">{t["num"]}.{k + 1}</span><b>{e(a)}</b><p>{e(b)}</p></li>'
        for k, (a, b) in enumerate(t["scope"]))
    more = "\n".join(
        f'        <li><a href="{o["file"]}"><span class="mono">{o["num"]}</span><b>{o["title"]}</b>'
        f'<em>{" · ".join(e(s[0]) for s in o["scope"])}</em><i class="fa-solid fa-arrow-right"></i></a></li>'
        for o in others)

    single = " is-single" if n == 1 else ""
    first_cap = e(photos[0][4])
    title = t["title"]

    return f"""<!DOCTYPE html>
<!-- Generated by tools/build-galleries.py — edit the manifest there, not this file. -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title} Gallery — FCBG · First Class Building Group</title>
  <meta name="description" content="{e(title)} by First Class Building Group: {e(t['lead'])}">
  <meta name="theme-color" content="#002a15">
  <link rel="shortcut icon" href="logo.ico" type="image/x-icon">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer">
  <link rel="stylesheet" href="css/site.css">
  <link rel="stylesheet" href="css/gallery.css">
</head>
<body class="gallery-page" data-trade="{t['id']}">

  <div class="cursor" aria-hidden="true"><span class="cursor__x"></span><span class="cursor__y"></span><span class="cursor__dot"></span></div>

  <!-- ============ NAV ============ -->
  <header class="nav">
    <a class="nav__brand" href="index.html" aria-label="FCBG home">
      <img src="img/logo-mark.webp" alt="FCBG logo" width="44" height="44">
      <span><b>FCBG</b><small>First Class Building Group</small></span>
    </a>
    <nav class="nav__links" aria-label="Service galleries">
{nav_links}
    </nav>
    <a class="btn btn--ghost nav__home" href="index.html"><i class="fa-solid fa-arrow-left"></i><span>Home</span></a>
    <button class="nav__burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
  </header>

  <div class="menu" id="menu" aria-hidden="true">
    <div class="menu__grid"></div>
    <nav aria-label="Mobile">
      <a href="index.html" class="menu__home"><small>←</small>Home</a>
{menu_links}
    </nav>
    <div class="menu__foot mono">
      <a href="tel:{PHONE_EN[0]}">EN · {PHONE_EN[1]}</a>
      <a href="tel:{PHONE_ES[0]}">ES · {PHONE_ES[1]}</a>
    </div>
  </div>

  <main>
    <!-- ============ HEADER ============ -->
    <section class="g-hero" aria-labelledby="g-title">
      <div class="bp-grid"></div>
      <a class="g-back mono" href="index.html#services"><i class="fa-solid fa-arrow-left"></i> Back to home</a>
      <div class="sheet-label mono"><span>{t['num']}</span> Service gallery <span class="sheet-label__line"></span> Sheet G-1{t['num']}</div>
      <h1 class="g-title" id="g-title" aria-label="{title} — {t['phase']}">
        <span class="g-title__line" data-dir="-1">{title}</span>
        <span class="g-title__line outline" data-dir="1">{t['phase']}<em>.</em></span>
      </h1>
      <div class="g-hero__foot">
        <p class="g-lead">{e(t['lead'])}</p>
        <ul class="g-meta mono">
          <li><span>Phase</span><b>{t['num']} / 05</b></li>
          <li><span>Photos</span><b>{n:02d}</b></li>
          <li><span>Region</span><b>Florida</b></li>
        </ul>
      </div>
    </section>

    <!-- ============ VIEWER ============ -->
    <section class="g-viewer{single}" aria-roledescription="carousel" aria-label="{title} project photos">
      <div class="g-stage-wrap">
        <div class="g-stage bp-corners" tabindex="0" aria-describedby="g-hint">
          <ul class="g-slides">
{chr(10).join(slides)}
          </ul>
          <button class="g-expand" type="button" aria-label="View photo full screen"><i class="fa-solid fa-expand"></i></button>
        </div>
        <svg class="g-dims" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="bp-line" d="M0 -3 H100 M0 -5 V-1 M100 -5 V-1" vector-effect="non-scaling-stroke"/>
          <path class="bp-line" d="M-3 0 V100 M-5 0 H-1 M-5 100 H-1" vector-effect="non-scaling-stroke"/>
        </svg>
        <span class="tag tag--a mono">{t['title'].upper()}</span>
      </div>

      <div class="g-bar">
        <p class="g-caption" aria-live="polite"><span class="mono g-count"><b>01</b> / {n:02d}</span><span class="g-caption__text">{first_cap}</span></p>
        <div class="g-ctrl">
          <button class="g-btn g-prev" type="button" aria-label="Previous photo"><i class="fa-solid fa-arrow-left"></i></button>
          <button class="g-btn g-next" type="button" aria-label="Next photo"><i class="fa-solid fa-arrow-right"></i></button>
        </div>
      </div>
      <div class="g-progress" aria-hidden="true"><i></i></div>
      <ul class="g-thumbs" aria-label="Choose a photo">
{chr(10).join(thumbs)}
      </ul>
      <p class="g-hint mono" id="g-hint">Use ← → keys or swipe · Click photo to enlarge</p>
    </section>

    <!-- ============ SCOPE ============ -->
    <section class="g-scope section" aria-label="Scope of work">
      <div class="sheet-label mono"><span>{t['num']}</span> Scope of work <span class="sheet-label__line"></span> Spec</div>
      <ol class="g-scope__list">
{scope}
      </ol>
    </section>

    <!-- ============ OTHER TRADES ============ -->
    <section class="g-more section" aria-label="Other trades">
      <div class="sheet-label mono"><span>→</span> Other trades <span class="sheet-label__line"></span> Schedule of work</div>
      <ol class="svc-list">
{more}
      </ol>
      <div class="g-more__foot">
        <a class="btn btn--ghost magnetic" href="index.html"><i class="fa-solid fa-arrow-left"></i><span>Back to home</span></a>
        <a class="btn btn--primary magnetic" href="{nxt['file']}"><span>Next: {nxt['title']}</span><i class="fa-solid fa-arrow-right"></i></a>
      </div>
    </section>

    <!-- ============ CONTACT ============ -->
    <section class="contact g-contact" aria-labelledby="g-contact-title">
      <div class="bp-grid"></div>
      <h2 class="g-contact__title" id="g-contact-title">Need {title.lower()} on your next build<em>?</em></h2>
      <div class="contact__grid">
        <a class="card magnetic" href="tel:{PHONE_EN[0]}"><span class="mono">English</span><b>{PHONE_EN[1]}</b><i class="fa-solid fa-phone"></i></a>
        <a class="card magnetic" href="tel:{PHONE_ES[0]}"><span class="mono">Español</span><b>{PHONE_ES[1]}</b><i class="fa-solid fa-phone"></i></a>
        <a class="card card--wide magnetic" href="mailto:{EMAIL}"><span class="mono">Email</span><b>{EMAIL}</b><i class="fa-solid fa-envelope"></i></a>
      </div>
    </section>
  </main>

  <footer class="footer">
    <a href="index.html" aria-label="FCBG home"><img src="logo-letras.png" alt="FCBG — First Class Building Group" class="footer__logo" loading="lazy"></a>
    <div class="footer__social">
      <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
      <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
    </div>
    <small class="mono">© <span class="year">2026</span> First Class Building Group · All rights reserved</small>
  </footer>

  <!-- ============ LIGHTBOX ============ -->
  <dialog class="g-lightbox" aria-label="{title} photo, full screen">
    <img alt="">
    <p class="mono g-lightbox__cap"></p>
    <button class="g-btn g-lightbox__close" type="button" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    <button class="g-btn g-lightbox__prev g-prev" type="button" aria-label="Previous photo"><i class="fa-solid fa-arrow-left"></i></button>
    <button class="g-btn g-lightbox__next g-next" type="button" aria-label="Next photo"><i class="fa-solid fa-arrow-right"></i></button>
  </dialog>

  <script src="vendor/gsap.min.js"></script>
  <script src="vendor/ScrollTrigger.min.js"></script>
  <script src="vendor/SplitText.min.js"></script>
  <script src="vendor/DrawSVGPlugin.min.js"></script>
  <script src="vendor/lenis.min.js"></script>
  <script src="js/gallery.js"></script>
</body>
</html>
"""


def main():
    for t in TRADES:
        photos = []
        for k, (src, cap, alt) in enumerate(t["photos"], 1):
            full, thumb, w, h = optimise(src, f"{t['id']}-{k:02d}")
            photos.append((full, thumb, w, h, cap, alt))
        with open(os.path.join(PUB, t["file"]), "w", encoding="utf-8") as f:
            f.write(page(t, photos))
        print(f"{t['file']:14} {t['title']:9} {len(photos)} photo(s)")


if __name__ == "__main__":
    main()
