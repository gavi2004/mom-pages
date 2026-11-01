#!/usr/bin/env python3
"""Generates public/Gallery1-5.html (one page per trade) from a single template.

Only real FCBG job-site photos from public/img are used. To add photos for a trade,
drop them in public/img and list them under that trade's "photos" below, then run:

    python3 tools/build-galleries.py
"""
import html
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")

# filename: (Gallery number, trade, hero photo, alt, intro, extra trade photos as (file, alt))
TRADES = [
    (1, "Framing", "framing.webp", "Wood framing and roof trusses inside a building under construction",
     "The structure goes up straight from the drawings, on residential and multifamily projects.", []),
    (2, "Exterior", "exte.webp", "Exterior siding on a building",
     "Siding and roofing that keep Florida weather out and give every building its character.", []),
    (3, "Drywall", "drywall.webp", "Crew installing drywall in a multifamily unit",
     "Walls closed in unit after unit, with clean lines ready for paint.", []),
    (4, "Paint", "paint.webp", "Finished painted clubhouse interior",
     "Interior and exterior paint — the finish clients actually see and touch.", []),
    (5, "Cleaning", "cleaning.webp", "Clean, finished clubhouse interior ready for handover",
     "A properly managed, clean environment for the client when the work is done.", []),
]

# finished-project photos shown on every gallery page
WORK = [
    ("multifamily.webp", "Multifamily building with balconies"),
    ("clubhouse.webp", "Clubhouse interior with coffered ceiling"),
    ("exterior.webp", "Aerial view of pool deck and buildings"),
    ("building.webp", "Finished clubhouse interior"),
    ("main.webp", "Aerial view of clubhouse and pool"),
]

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{trade} — FCBG Gallery</title>
  <meta name="description" content="{trade} by First Class Building Group — residential and multifamily construction in Florida.">
  <meta name="theme-color" content="#002a15">
  <meta property="og:title" content="{trade} — FCBG">
  <meta property="og:image" content="https://fcbg-mom-pages.vercel.app/img/og.jpg">
  <link rel="shortcut icon" href="logo.ico" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer">
  <link rel="stylesheet" href="css/site.css">
</head>
<body class="page-gallery">
  <header class="nav">
    <a class="nav__brand" href="index.html" aria-label="FCBG home">
      <img src="img/logo-mark.webp" alt="FCBG logo" width="44" height="44">
      <span><b>FCBG</b><small>First Class Building Group</small></span>
    </a>
    <a class="btn btn--ghost" href="index.html#services"><i class="fa-solid fa-arrow-left"></i><span>Back</span></a>
    <a class="btn btn--primary nav__cta" href="index.html#contact"><span>Get a quote</span><i class="fa-solid fa-arrow-right"></i></a>
  </header>

  <main>
    <section class="gal-hero section">
      <div class="bp-grid"></div>
      <div class="sheet-label mono"><span>{num:02d}</span> Service gallery <span class="sheet-label__line"></span> Sheet G-{num:03d}</div>
      <h1 class="display gal-title">{trade}<em>.</em></h1>
      <p class="gal-intro">{intro}</p>
      <figure class="gal-main bp-corners" data-lightbox>
        <img src="img/{photo}" alt="{alt}" fetchpriority="high">
        <figcaption class="mono"><span>{trade}</span><span>FCBG · Florida</span></figcaption>
      </figure>
{extra}
    </section>

    <section class="gal-work section">
      <div class="sheet-label mono"><span>+</span> More FCBG work <span class="sheet-label__line"></span></div>
      <div class="gal-grid">
{work}
      </div>
    </section>

    <section class="gal-next section">
      <p class="mono">Next service</p>
      <a class="gal-next__link" href="Gallery{next_num}.html">{next_trade} <i class="fa-solid fa-arrow-right"></i></a>
    </section>
  </main>

  <footer class="footer">
    <img src="img/logo-letras.webp" alt="FCBG — First Class Building Group" class="footer__logo" loading="lazy">
    <small class="mono">© <span class="year">2026</span> First Class Building Group · All rights reserved</small>
  </footer>

  <dialog class="lightbox" aria-label="Photo"><button class="lightbox__close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button><img alt=""></dialog>

  <script src="vendor/gsap.min.js"></script>
  <script src="vendor/ScrollTrigger.min.js"></script>
  <script src="vendor/SplitText.min.js"></script>
  <script src="js/gallery.js"></script>
</body>
</html>
"""


def fig(src, alt, cls="gal-item"):
    return (f'        <figure class="{cls}" data-lightbox><img src="img/{src}" alt="{html.escape(alt)}" loading="lazy"></figure>')


def main():
    order = [t for t in sorted(TRADES, key=lambda t: t[0])]
    seq = [1, 3, 2, 4, 5]  # build order: framing, drywall, exterior, paint, cleaning
    for num, trade, photo, alt, intro, extras in TRADES:
        nxt = seq[(seq.index(num) + 1) % len(seq)]
        next_trade = next(t[1] for t in order if t[0] == nxt)
        extra = ""
        if extras:
            extra = '      <div class="gal-grid gal-grid--trade">\n' + "\n".join(fig(s, a) for s, a in extras) + "\n      </div>"
        page = TEMPLATE.format(
            num=num, trade=trade, photo=photo, alt=html.escape(alt), intro=html.escape(intro), extra=extra,
            work="\n".join(fig(s, a) for s, a in WORK if s != photo),
            next_num=nxt, next_trade=next_trade,
        )
        with open(os.path.join(PUB, f"Gallery{num}.html"), "w", encoding="utf-8") as f:
            f.write(page)
        print("wrote", f"Gallery{num}.html")


if __name__ == "__main__":
    main()
