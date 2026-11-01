/* =====================================================================
   FCBG · service gallery motion + viewer
   Shares the home page stack: GSAP 3.13 (ScrollTrigger, SplitText,
   DrawSVG) + Lenis. The viewer works without GSAP (no animation).
   ===================================================================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGsap = !!window.gsap;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = hasGsap && !reduce;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const W_MAX = 125;

  $$('.year').forEach(y => { y.textContent = new Date().getFullYear(); });

  if (hasGsap) {
    const plugins = [window.ScrollTrigger, window.SplitText, window.DrawSVGPlugin].filter(Boolean);
    gsap.registerPlugin(...plugins);
  }

  // ---------------------------------------------------------------- smooth scroll
  let lenis = null;
  if (animate && window.Lenis && window.ScrollTrigger) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ================================================================ VIEWER
  const viewer = $('.g-viewer');
  const stage = $('.g-stage');
  const slides = $$('.g-slide');
  const thumbs = $$('.g-thumb');
  const countEl = $('.g-count b');
  const capEl = $('.g-caption__text');
  const bar = $('.g-progress i');
  const dialog = $('.g-lightbox');
  const total = slides.length;
  let current = 0;
  let busy = false;

  const pad = n => String(n + 1).padStart(2, '0');

  function setState(i) {
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === i);
      s.setAttribute('aria-hidden', k === i ? 'false' : 'true');
    });
    thumbs.forEach((t, k) => {
      t.classList.toggle('is-active', k === i);
      if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    if (countEl) countEl.textContent = pad(i);
    if (capEl) capEl.textContent = slides[i].dataset.caption || '';
    if (bar) {
      const p = total > 1 ? (i + 1) / total : 1;
      if (animate) gsap.to(bar, { scaleX: p, duration: .8, ease: 'expo.out' }); else bar.style.transform = `scaleX(${p})`;
    }
    const activeThumb = thumbs[i];
    if (activeThumb && activeThumb.parentElement.parentElement.scrollWidth > activeThumb.parentElement.parentElement.clientWidth) {
      activeThumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
    if (dialog && dialog.open) fillLightbox();
  }

  function go(next, dir) {
    if (total < 2 || busy) return;
    next = (next + total) % total;
    if (next === current) return;
    if (dir === undefined) dir = next > current ? 1 : -1;
    const from = slides[current], to = slides[next];
    current = next;

    if (!animate) { setState(next); return; }

    busy = true;
    to.classList.add('is-entering');
    const img = $('.g-slide__img', to);
    const bg = $('.g-slide__bg', to);
    const clipFrom = dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
    gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        to.classList.remove('is-entering');
        gsap.set([to, img, bg, from, $('.g-slide__img', from)], { clearProps: 'all' });
        setState(next);
        busy = false;
      },
    })
      .fromTo(to, { clipPath: clipFrom }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 0)
      .fromTo(img, { scale: 1.12, xPercent: 6 * dir }, { scale: 1, xPercent: 0, duration: 1.2, ease: 'expo.out' }, 0)
      .fromTo(bg, { autoAlpha: 0 }, { autoAlpha: 1, duration: .6 }, .1)
      .to($('.g-slide__img', from), { xPercent: -10 * dir, scale: .96, duration: 1 }, 0);

    // update caption/count immediately so text keeps pace with the wipe
    if (countEl) countEl.textContent = pad(next);
    if (capEl) {
      capEl.textContent = to.dataset.caption || '';
      gsap.fromTo(capEl, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .8, ease: 'expo.out', delay: .2 });
    }
  }

  const next = () => go(current + 1, 1);
  const prev = () => go(current - 1, -1);

  if (viewer && total) {
    setState(0);
    $$('.g-next').forEach(b => b.addEventListener('click', next));
    $$('.g-prev').forEach(b => b.addEventListener('click', prev));
    thumbs.forEach(t => t.addEventListener('click', () => go(Number(t.dataset.index))));

    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(); }
    });

    // swipe / drag (a tap opens the lightbox)
    let sx = null, sy = 0, moved = false;
    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('.g-expand') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      sx = e.clientX; sy = e.clientY; moved = false;
    });
    stage.addEventListener('pointermove', e => {
      if (sx !== null && Math.abs(e.clientX - sx) > 8) moved = true;
    });
    stage.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); return; }
      if (!moved) openLightbox();
    });
    stage.addEventListener('pointercancel', () => { sx = null; });
    $('.g-expand').addEventListener('click', openLightbox);
  }

  // ================================================================ LIGHTBOX
  function fillLightbox() {
    const s = slides[current], src = $('.g-slide__img', s);
    const img = $('img', dialog);
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    $('.g-lightbox__cap', dialog).textContent = `${pad(current)} / ${String(total).padStart(2, '0')} · ${s.dataset.caption || ''}`;
  }
  function openLightbox() {
    if (!dialog || typeof dialog.showModal !== 'function' || dialog.open) return;
    dialog.classList.toggle('is-single', total < 2);
    fillLightbox();
    dialog.showModal();
    if (lenis) lenis.stop();
    if (animate) gsap.fromTo($('img', dialog), { scale: .94, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .6, ease: 'expo.out' });
  }
  if (dialog) {
    $('.g-lightbox__close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { if (lenis) lenis.start(); stage && stage.focus({ preventScroll: true }); });
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    });
    let lx = null;
    dialog.addEventListener('pointerdown', e => { lx = e.clientX; });
    dialog.addEventListener('pointerup', e => {
      if (lx === null) return;
      const dx = e.clientX - lx; lx = null;
      if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    });
  }

  // ================================================================ MOBILE MENU
  const burger = $('.nav__burger'), menu = $('#menu');
  let menuTl = null;
  function openMenu() {
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    if (!hasGsap) { menu.style.visibility = 'visible'; menu.style.clipPath = 'none'; return; }
    menuTl = gsap.timeline()
      .set(menu, { visibility: 'visible' })
      .to(menu, { clipPath: 'inset(0% 0% 0% 0%)', duration: reduce ? 0 : .9, ease: 'expo.inOut' })
      .from('.menu nav a', { yPercent: 100, autoAlpha: 0, duration: reduce ? 0 : .8, stagger: reduce ? 0 : .06, ease: 'expo.out' }, '-=.4')
      .from('.menu__foot a', { y: 20, autoAlpha: 0, stagger: reduce ? 0 : .06, duration: reduce ? 0 : .6 }, '-=.6');
  }
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    if (!hasGsap) { menu.style.visibility = ''; menu.style.clipPath = ''; return; }
    if (menuTl) menuTl.kill();
    gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: reduce ? 0 : .7, ease: 'expo.inOut', onComplete: () => {
      gsap.set(menu, { visibility: 'hidden' }); gsap.set('.menu nav a, .menu__foot a', { clearProps: 'all' });
    } });
  }
  if (burger && menu) {
    burger.addEventListener('click', () => document.body.classList.contains('menu-open') ? closeMenu() : openMenu());
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  if (!hasGsap) return;

  // ================================================================ INTRO
  const lines = $$('.g-title__line');
  let chars = [];
  if (window.SplitText) {
    const splits = lines.map(l => SplitText.create(l, { type: 'chars,words', charsClass: 'char', wordsClass: 'word' }));
    chars = splits.flatMap(s => s.chars);
    gsap.set(chars, { '--w': 72 });
  }

  if (animate) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    lines.forEach(l => { l.style.overflow = 'hidden'; });
    if (chars.length) tl.from(chars, { yPercent: 115, rotate: 8, '--w': W_MAX, duration: 1.4, stagger: .03 }, 0);
    tl.from('.nav', { autoAlpha: 0, marginTop: -40, duration: 1.2, clearProps: 'marginTop,opacity,visibility' }, .1)
      .from('.g-back, .g-hero .sheet-label', { y: 16, autoAlpha: 0, duration: .9, stagger: .08 }, .15)
      .from('.g-hero__foot > *', { y: 24, autoAlpha: 0, duration: 1, stagger: .08 }, .5)
      .from('.g-stage', { clipPath: 'inset(100% 0% 0% 0% round 22px)', duration: 1.5, ease: 'expo.inOut' }, .35)
      .from('.g-slide.is-active .g-slide__img', { scale: 1.25, duration: 2 }, .35)
      .from('.g-stage-wrap .tag, .g-bar > *, .g-thumbs li', { y: 18, autoAlpha: 0, duration: .8, stagger: .05 }, 1.1)
      .add(() => lines.forEach(l => { l.style.overflow = ''; }), 1.6);
    if (window.DrawSVGPlugin) tl.from('.g-dims .bp-line', { drawSVG: '0%', duration: 1.2, stagger: .2, ease: 'power2.inOut' }, 1);
  }

  if (!window.ScrollTrigger) return;

  // sheet label rules draw in
  $$('.sheet-label__line').forEach(l => gsap.from(l, { scaleX: 0, duration: reduce ? 0 : 1.4, ease: 'expo.out', scrollTrigger: { trigger: l, start: 'top 90%' } }));

  if (!animate) return;

  // title lines drift apart as the header scrolls away
  const hero = $('.g-hero');
  lines.forEach(line => {
    gsap.to(line, { xPercent: 8 * Number(line.dataset.dir || 1), ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  });

  // reveals
  gsap.from('.g-scope__list li', { y: 50, autoAlpha: 0, duration: 1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.g-scope__list', start: 'top 85%' } });
  gsap.from('.g-more .svc-list li', { y: 40, autoAlpha: 0, duration: 1, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: '.g-more .svc-list', start: 'top 85%' } });
  gsap.from('.g-more__foot .btn', { y: 30, autoAlpha: 0, duration: .9, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.g-more__foot', start: 'top 92%' } });
  gsap.from('.g-contact .card', { y: 60, autoAlpha: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.g-contact .contact__grid', start: 'top 90%' } });
  const ct = $('.g-contact__title');
  if (ct && window.SplitText) {
    const s = SplitText.create(ct, { type: 'chars,words', charsClass: 'char', wordsClass: 'word' });
    gsap.set(s.chars, { '--w': 66 });
    gsap.from(s.chars, { yPercent: 60, autoAlpha: 0, '--w': W_MAX, duration: 1.2, stagger: .015, ease: 'expo.out', scrollTrigger: { trigger: ct, start: 'top 85%' } });
  }

  // nav hides on scroll down, returns on scroll up
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 'top -120', end: 'max',
    onUpdate: self => nav.classList.toggle('is-hidden', self.direction === 1 && !document.body.classList.contains('menu-open')),
    onLeaveBack: () => nav.classList.remove('is-hidden'),
  });

  // magnetic buttons + drafting cursor (desktop)
  if (finePointer) {
    $$('.magnetic').forEach(b => {
      const x = gsap.quickTo(b, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const y = gsap.quickTo(b, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .3); y((e.clientY - r.top - r.height / 2) * .3); });
      b.addEventListener('pointerleave', () => { x(0); y(0); });
    });
    const cur = $('.cursor');
    if (cur) {
      const cx = gsap.quickTo('.cursor__y', 'x', { duration: .25, ease: 'power3' });
      const cy = gsap.quickTo('.cursor__x', 'y', { duration: .25, ease: 'power3' });
      const dx = gsap.quickTo('.cursor__dot', 'x', { duration: .15, ease: 'power3' });
      const dy = gsap.quickTo('.cursor__dot', 'y', { duration: .15, ease: 'power3' });
      window.addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY); }, { passive: true });
      document.addEventListener('pointerover', e => cur.classList.toggle('is-hover', !!e.target.closest('a, button, .g-stage')));
    }
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
