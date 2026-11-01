/* =====================================================================
   FCBG · site motion
   GSAP 3.13 (ScrollTrigger, SplitText, DrawSVG) + Lenis + scroll-world
   ===================================================================== */
(() => {
  'use strict';
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const W_MIN = 62, W_MAX = 125;  // Archivo width axis

  // ---------------------------------------------------------------- smooth scroll
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6, onComplete: () => {
      // lazy media / pin spacers can shift layout mid-flight: settle on the real position
      if (typeof target !== 'number' && Math.abs(target.getBoundingClientRect().top) > 2) lenis.scrollTo(target, { immediate: true });
    } });
    else (typeof target === 'number' ? window.scrollTo(0, target) : target.scrollIntoView());
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(id === '#top' ? 0 : el);
  }));

  // ---------------------------------------------------------------- scroll-world
  // Scenes rendered by tools/build-world.py (blueprint -> real job-site photo).
  const V = 'world/';
  const PHASES = [
    { id: 'framing', label: 'Framing', gallery: 'Gallery1.html', eyebrow: 'Phase 01 · Structure', title: 'Framing',
      body: 'The structure goes up straight from the drawings, on residential and multifamily projects.', tags: ['Residential', 'Multifamily'] },
    { id: 'drywall', label: 'Drywall', gallery: 'Gallery3.html', eyebrow: 'Phase 02 · Enclosure', title: 'Drywall',
      body: 'Walls closed in unit after unit, with clean lines ready for paint.', tags: ['Interior'] },
    { id: 'exterior', label: 'Exterior', gallery: 'Gallery2.html', eyebrow: 'Phase 03 · Envelope', title: 'Exterior',
      body: 'Siding and roofing that keep Florida weather out and give every building its character.', tags: ['Siding', 'Roofing'] },
    { id: 'paint', label: 'Paint', gallery: 'Gallery4.html', eyebrow: 'Phase 04 · Finish', title: 'Paint',
      body: 'Interior and exterior paint — the finish clients actually see and touch.', tags: ['Interior', 'Exterior'] },
    { id: 'cleaning', label: 'Cleaning', gallery: 'Gallery5.html', eyebrow: 'Phase 05 · Turnover prep', title: 'Cleaning',
      body: 'A properly managed, clean environment for the client when the work is done.', tags: [] },
    { id: 'delivered', label: 'Delivered', eyebrow: 'Phase 06 · Handover', title: 'Delivered.',
      body: 'Communities handed over clean, safe and first class — ready for the people who will call them home.', tags: [],
      cta: { primary: { label: 'Start your project', href: '#contact' }, secondary: { label: 'See projects', href: '#projects' } } },
  ];
  const worldEl = $('#world');
  if (worldEl && window.mountScrollWorld) {
    const N = PHASES.length;
    mountScrollWorld(worldEl, {
      nav: false,
      hint: 'scroll to build',
      atmosphere: true,
      diveScroll: 1.5,
      connScroll: 0.85,
      crossfade: 0.1,
      sections: PHASES.map((p, i) => ({
        ...p,
        accent: '#2c974b',
        linger: 0.35,
        // posters are each clip's exact first frame (the blueprint); under reduced
        // motion no clips load, so show the finished photo instead.
        still: V + (reduce ? 'photo-' : 'still-') + i + '.webp',
        stillMobile: V + (reduce ? 'photo-' : 'still-') + i + '-m.webp',
        clip: V + 'dive-' + i + '.mp4',
        clipMobile: V + 'dive-' + i + '-m.mp4',
        cta: p.cta || { secondary: { label: 'Open gallery', href: p.gallery } },
      })),
      connectors: Array.from({ length: N - 1 }, (_, i) => V + 'conn-' + i + '.mp4'),
      connectorsMobile: Array.from({ length: N - 1 }, (_, i) => V + 'conn-' + i + '-m.mp4'),
    });
  }

  // ---------------------------------------------------------------- helpers
  const splitChars = (el, extra = {}) => SplitText.create(el, { type: 'chars,words', charsClass: 'char', wordsClass: 'word', ...extra });
  const setW = (els, w) => gsap.set(els, { '--w': w });

  // ---------------------------------------------------------------- loader → intro
  const counter = $('.loader__count b');
  const loaderTl = gsap.timeline({ paused: true });
  const loadState = { p: 0 };
  if (!reduce) {
    gsap.set('.loader__draw path, .loader__draw rect', { drawSVG: '0%' });
    loaderTl
      .to('.loader__draw .bp-stroke > *', { drawSVG: '100%', duration: 1.1, stagger: 0.12, ease: 'power2.inOut' }, 0)
      .to('.loader__draw .bp-dim path', { drawSVG: '100%', duration: .6, stagger: .1, ease: 'power1.out' }, .7)
      .to(loadState, { p: 100, duration: 1.7, ease: 'power3.inOut', onUpdate: () => { counter.textContent = String(Math.round(loadState.p)).padStart(3, '0'); } }, 0);
  }

  function heroIntro() {
    const lines = $$('.hero__line');
    const splits = lines.map(l => splitChars(l));
    const chars = splits.flatMap(s => s.chars);
    setW(chars, 72);
    if (reduce) return chars;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(chars, { yPercent: 115, rotate: 8, '--w': W_MAX, duration: 1.4, stagger: { each: .028, from: 'start' } }, 0)
      .from('.hero__eyebrow', { y: 20, autoAlpha: 0, duration: 1 }, .2)
      .from('.hero__frame', { clipPath: 'inset(100% 0% 0% 0% round 22px)', duration: 1.6, ease: 'expo.inOut' }, .1)
      .from('.hero__frame img', { scale: 1.4, duration: 2.2 }, .1)
      .from('.dim--h', { scaleX: 0, duration: 1.2, ease: 'power2.inOut' }, .8)
      .from('.dim--v', { scaleY: 0, duration: 1.2, ease: 'power2.inOut' }, 1)
      .from('.hero__media .tag, .hero__media figcaption', { autoAlpha: 0, y: 12, stagger: .1, duration: .8 }, 1.1)
      .from('.hero__lead, .hero__ctas .btn, .hero__scroll', { y: 30, autoAlpha: 0, stagger: .08, duration: 1 }, .6)
      .from('.nav', { autoAlpha: 0, marginTop: -40, duration: 1.2, clearProps: 'marginTop,opacity,visibility' }, .4);
    // lines wrap in an overflow mask so chars rise out of the baseline
    lines.forEach(l => l.style.overflow = 'hidden');
    tl.add(() => lines.forEach(l => l.style.overflow = ''), '>-0.2');
    return chars;
  }

  function startSite() {
    document.body.classList.remove('is-loading');
    if (lenis) lenis.start();
    const heroChars = heroIntro();
    buildScrollAnimations(heroChars);
    ScrollTrigger.refresh();
  }

  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  const minTime = new Promise(r => setTimeout(r, reduce ? 0 : 1700));
  if (!reduce) loaderTl.play();
  Promise.all([fontsReady, minTime]).then(() => {
    if (reduce) { gsap.set('.loader', { autoAlpha: 0 }); startSite(); return; }
    gsap.timeline()
      .to('.loader__draw, .loader__meta', { autoAlpha: 0, y: -30, duration: .5, ease: 'power2.in' })
      .to('.loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '-=.1')
      .add(startSite, '-=.65')
      .set('.loader', { display: 'none' });
  });

  // ---------------------------------------------------------------- scroll animations
  function buildScrollAnimations(heroChars) {
    const mm = gsap.matchMedia();

    // sheet label rules draw in
    $$('.sheet-label__line').forEach(l => gsap.from(l, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: l, start: 'top 90%' } }));

    // year
    $$('.year').forEach(y => y.textContent = new Date().getFullYear());

    if (reduce) { counters(true); return; }

    // ---- HERO: lines drift apart, image dives, proximity width on hover
    const hero = $('.hero');
    gsap.utils.toArray('.hero__line').forEach(line => {
      gsap.to(line, { xPercent: 12 * Number(line.dataset.dir || 1), ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    });
    mm.add('(min-width: 761px)', () => {
      gsap.to('.hero__media', { yPercent: 18, scale: .92, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__frame img', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    });
    mm.add('(max-width: 760px)', () => {
      // phone: the photo is a full-bleed backdrop — slow Ken Burns + scroll push
      gsap.fromTo('.hero__frame img', { scale: 1.12 }, { scale: 1, duration: 6, ease: 'power2.out' });
      gsap.to('.hero__frame img', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__inner', { yPercent: -12, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    });

    if (finePointer && heroChars.length) {
      const setters = heroChars.map(c => gsap.quickTo(c, '--w', { duration: .8, ease: 'power3.out' }));
      let rects = [];
      const measure = () => { rects = heroChars.map(c => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); };
      let pending = null;
      hero.addEventListener('pointerenter', measure);
      hero.addEventListener('pointermove', e => {
        if (pending) return;
        pending = requestAnimationFrame(() => {
          pending = null;
          heroChars.forEach((c, i) => {
            const r = rects[i]; if (!r) return;
            const d = Math.hypot(e.clientX - r.x, (e.clientY - r.y) * 1.6);
            setters[i](72 + 40 * Math.max(0, 1 - d / 320));
          });
        });
      });
      hero.addEventListener('pointerleave', () => setters.forEach(s => s(72)));
      window.addEventListener('scroll', () => { rects = []; }, { passive: true });
      hero.addEventListener('pointermove', () => { if (!rects.length) measure(); }, { passive: true });
    }

    // ---- MARQUEE: infinite loop, velocity-reactive speed + skew
    const track = $('.marquee__track');
    if (track) {
      track.innerHTML += track.innerHTML;
      const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
      const skew = gsap.quickTo(track, 'skewX', { duration: .5, ease: 'power3' });
      ScrollTrigger.create({
        trigger: '.marquee', start: 'top bottom', end: 'bottom top',
        onUpdate: self => {
          const v = self.getVelocity();
          const dir = self.direction;
          gsap.to(loop, { timeScale: dir * Math.min(6, 1 + Math.abs(v) / 300), duration: .2, overwrite: true });
          gsap.to(loop, { timeScale: dir, duration: 1.2, delay: .25, ease: 'power2.out' });
          skew(gsap.utils.clamp(-12, 12, v / -120));
        },
      });
      ScrollTrigger.addEventListener('scrollEnd', () => skew(0));
    }

    // ---- DISPLAY TITLES: kinetic chars, scrubbed by scroll (rise + width collapse)
    $$('.kinetic-scrub').forEach(t => {
      const s = splitChars(t, { type: 'lines,chars,words', linesClass: 'split-line', mask: 'lines' });
      setW(s.chars, 75);
      gsap.from(s.chars, {
        yPercent: 110, '--w': W_MAX, rotate: 6, duration: 1.3, ease: 'expo.out', stagger: .035,
        scrollTrigger: { trigger: t, start: 'top 85%', toggleActions: 'play none none reverse' },
      });
    });

    // ---- ABOUT: words light up as you read (scrub)
    $$('.scrub-words').forEach(p => {
      const s = SplitText.create(p, { type: 'words', wordsClass: 'word' });
      gsap.to(s.words, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });
    gsap.from('.about__img', { clipPath: 'inset(0% 0% 100% 0% round 22px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.about__img', start: 'top 85%' } });
    gsap.fromTo('.about__img img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.about__img', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.about__copy', { y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.about__copy', start: 'top 90%' } });
    counters(false);

    // ---- WORLD: kinetic headline per scene as the camera arrives
    if (worldEl) {
      const copies = $$('.sw-copy', worldEl);
      const titleSplits = copies.map(c => {
        const t = $('.sw-copy__title', c); if (!t) return null;
        const s = splitChars(t, { type: 'lines,chars,words', linesClass: 'split-line', mask: 'lines' });
        setW(s.chars, 72);
        return s;
      });
      let last = -1;
      worldEl.addEventListener('sw:section', e => {
        const i = e.detail.index; if (i === last) return; last = i;
        const s = titleSplits[i]; if (!s) return;
        gsap.fromTo(s.chars, { yPercent: 110, '--w': W_MAX }, { yPercent: 0, '--w': 72, duration: 1.1, ease: 'expo.out', stagger: .035, overwrite: true });
        const meta = $$('.sw-copy__num, .sw-copy__eyebrow, .sw-copy__tags li', copies[i]);
        gsap.fromTo(meta, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8, stagger: .05, ease: 'power3.out', overwrite: true });
      });
    }

    // ---- SERVICES list
    mm.add('(min-width: 761px)', () => gsap.from('.svc-list li', { y: 60, autoAlpha: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.svc-list', start: 'top 85%' } }));
    if (finePointer) {
      const prev = $('.svc-preview'), img = $('img', prev);
      const px = gsap.quickTo(prev, 'x', { duration: .6, ease: 'power3' });
      const py = gsap.quickTo(prev, 'y', { duration: .6, ease: 'power3' });
      const rot = gsap.quickTo(prev, 'rotate', { duration: .8, ease: 'power3' });
      let lastX = 0;
      $('.svc-list').addEventListener('pointermove', e => { px(e.clientX + 24); py(e.clientY - 110); rot(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * .6)); lastX = e.clientX; });
      $$('.svc-list a').forEach(a => {
        a.addEventListener('pointerenter', () => { img.src = a.dataset.img; gsap.to(prev, { autoAlpha: 1, scale: 1, duration: .5, ease: 'expo.out' }); });
        a.addEventListener('pointerleave', () => gsap.to(prev, { autoAlpha: 0, scale: .6, duration: .4, ease: 'power3.in' }));
      });
    }

    // ---- PROJECTS: horizontal pinned scroll on desktop, stacked reveals on mobile
    mm.add('(min-width: 761px)', () => {
      const trackEl = $('.projects__track');
      const pin = $('.projects__pin');
      const pad = () => parseFloat(getComputedStyle(pin).paddingRight) || 0;
      const dist = () => Math.max(0, trackEl.offsetLeft + trackEl.scrollWidth + pad() - window.innerWidth);
      const h = gsap.to(['.projects__intro', trackEl], {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.projects', start: 'top top', end: () => '+=' + dist(), pin: pin, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      gsap.utils.toArray('.proj').forEach(p => {
        gsap.to($('img', p), { scale: 1, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: h, start: 'left right', end: 'right left', scrub: true } });
        gsap.from($('h3', p), { yPercent: 100, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, containerAnimation: h, start: 'left 80%' } });
      });
    });
    mm.add('(max-width: 760px)', () => {
      gsap.utils.toArray('.proj').forEach(p => {
        gsap.from($('figure', p), { clipPath: 'inset(100% 0% 0% 0% round 22px)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: p, start: 'top 85%' } });
        gsap.to($('img', p), { scale: 1, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });

    // ---- TESTIMONIALS: masked line reveal
    $$('.quote').forEach(q => {
      const s = SplitText.create($('p', q), { type: 'lines', linesClass: 'split-line', mask: 'lines', autoSplit: true,
        onSplit: self => gsap.from(self.lines, { yPercent: 105, duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: q, start: 'top 80%' } }) });
      gsap.from($('cite', q), { x: -30, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: q, start: 'top 70%' } });
      return s;
    });

    // ---- CONTACT: stretchy kinetic headline — a width wave that rides the scroll
    const ct = $('.kinetic-stretch');
    if (ct) {
      const s = splitChars(ct);
      setW(s.chars, W_MIN);
      gsap.from(s.chars, { yPercent: 120, duration: 1.2, stagger: .04, ease: 'expo.out', scrollTrigger: { trigger: ct, start: 'top 85%' } });
      const n = s.chars.length;
      const amp = window.innerWidth < 761 ? 22 : 34;
      ScrollTrigger.create({
        trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true,
        onUpdate: self => {
          const p = self.progress;
          s.chars.forEach((c, i) => {
            const wave = Math.sin(p * Math.PI * 3 - (i / n) * Math.PI * 2);
            c.style.setProperty('--w', (W_MIN + (wave + 1) * 0.5 * amp).toFixed(1));
          });
        },
      });
      gsap.from('.contact .card', { y: 60, autoAlpha: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.contact__grid', start: 'top 88%' } });
    }

    // ---- page progress bar
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

    // ---- blueprint labels: scramble-decode when they enter
    $$('.sheet-label > span:not(.sheet-label__line), .proj__meta span, .stats .mono').forEach(el => {
      el.setAttribute('data-scramble', '');
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => scramble(el) });
    });

    // ---- testimonials sheet unrolls into place
    gsap.fromTo('.testimonials', { clipPath: 'inset(0% 5% 0% 5% round 48px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: '.testimonials', start: 'top bottom', end: 'top 30%', scrub: true },
    });

    // ---- footer wordmark drifts with scroll
    gsap.fromTo('.bigmark__track', { xPercent: 0 }, { xPercent: -45, ease: 'none', scrollTrigger: { trigger: '.bigmark', start: 'top bottom', end: 'bottom top', scrub: true } });

    // ---- service rows slide in from alternating sides on phones
    mm.add('(max-width: 760px)', () => {
      $$('.svc-list li').forEach((li, i) => gsap.from(li, { x: i % 2 ? 40 : -40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 92%' } }));
    });

    // ---- contact cards: spotlight follows the pointer
    $$('.card').forEach(c => c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));

    // ---- NAV: hide on scroll down, show on up; active link
    const nav = $('.nav');
    ScrollTrigger.create({
      start: 'top -120', end: 'max',
      onUpdate: self => nav.classList.toggle('is-hidden', self.direction === 1 && !document.body.classList.contains('menu-open')),
      onLeaveBack: () => nav.classList.remove('is-hidden'),
    });
    $$('.nav__links a').forEach(a => {
      const sec = $(a.getAttribute('href')); if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: self => a.classList.toggle('is-active', self.isActive) });
    });

    // ---- magnetic buttons + cursor
    if (finePointer) {
      $$('.magnetic').forEach(b => {
        const x = gsap.quickTo(b, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
        const y = gsap.quickTo(b, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
        b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .3); y((e.clientY - r.top - r.height / 2) * .3); });
        b.addEventListener('pointerleave', () => { x(0); y(0); });
      });
      const cur = $('.cursor');
      const cx = gsap.quickTo('.cursor__y', 'x', { duration: .25, ease: 'power3' });
      const cy = gsap.quickTo('.cursor__x', 'y', { duration: .25, ease: 'power3' });
      const dx = gsap.quickTo('.cursor__dot', 'x', { duration: .15, ease: 'power3' });
      const dy = gsap.quickTo('.cursor__dot', 'y', { duration: .15, ease: 'power3' });
      window.addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY); }, { passive: true });
      document.addEventListener('pointerover', e => cur.classList.toggle('is-hover', !!e.target.closest('a, button')));
    }
  }

  const GLYPHS = '#/+=*<>[]_-0123456789';
  function scramble(el) {
    const final = el.textContent, n = final.length;
    let f = 0; const total = 22;
    const tick = () => {
      f++;
      const shown = Math.floor((f / total) * n);
      el.textContent = final.split('').map((ch, i) => (i < shown || ch === ' ') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
      if (f < total) requestAnimationFrame(tick); else el.textContent = final;
    };
    requestAnimationFrame(tick);
  }

  function counters(instant) {
    $$('.counter').forEach(el => {
      const to = Number(el.dataset.to), suf = el.dataset.suffix || '';
      if (instant) { el.textContent = to + suf; return; }
      const o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter: () =>
        gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v) + suf; } }) });
      gsap.fromTo(el, { '--w': W_MAX }, { '--w': 70, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  }

  // ---------------------------------------------------------------- mobile menu
  const burger = $('.nav__burger'), menu = $('#menu');
  let menuTl = null;
  function openMenu() {
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    menuTl = gsap.timeline()
      .set(menu, { visibility: 'visible' })
      .to(menu, { clipPath: 'inset(0% 0% 0% 0%)', duration: reduce ? 0 : .9, ease: 'expo.inOut' })
      .from('.menu nav a', { yPercent: 100, autoAlpha: 0, duration: .8, stagger: .06, ease: 'expo.out' }, '-=.4')
      .from('.menu__foot a', { y: 20, autoAlpha: 0, stagger: .06, duration: .6 }, '-=.6');
  }
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    if (menuTl) menuTl.kill();
    gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: reduce ? 0 : .7, ease: 'expo.inOut', onComplete: () => {
      gsap.set(menu, { visibility: 'hidden' }); gsap.set('.menu nav a, .menu__foot a', { clearProps: 'all' });
    } });
  }
  burger.addEventListener('click', () => document.body.classList.contains('menu-open') ? closeMenu() : openMenu());
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();
