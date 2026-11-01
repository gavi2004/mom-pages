/* FCBG · service gallery pages */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  $$('.year').forEach(y => y.textContent = new Date().getFullYear());

  // lightbox
  const box = $('.lightbox'), boxImg = $('img', box);
  $$('[data-lightbox]').forEach(f => f.addEventListener('click', () => {
    const img = $('img', f); boxImg.src = img.src; boxImg.alt = img.alt;
    box.showModal();
    if (!reduce) gsap.fromTo(boxImg, { scale: .9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .6, ease: 'expo.out' });
  }));
  $('.lightbox__close').addEventListener('click', () => box.close());
  box.addEventListener('click', e => { if (e.target === box) box.close(); });

  if (reduce || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    const t = $('.gal-title');
    const s = SplitText.create(t, { type: 'chars,words', charsClass: 'char', mask: 'words' });
    gsap.set(s.chars, { '--w': 72 });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from(s.chars, { yPercent: 110, '--w': 125, duration: 1.3, stagger: .04 })
      .from('.gal-intro, .page-gallery .sheet-label', { y: 24, autoAlpha: 0, duration: 1 }, .2)
      .from('.gal-main', { clipPath: 'inset(100% 0% 0% 0% round 22px)', duration: 1.5, ease: 'expo.inOut' }, .2)
      .from('.gal-main img', { scale: 1.3, duration: 2 }, .2);

    $$('.sheet-label__line').forEach(l => gsap.from(l, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: l, start: 'top 90%' } }));
    $$('.gal-item').forEach((f, i) => gsap.from(f, {
      clipPath: 'inset(100% 0% 0% 0% round 18px)', duration: 1.3, ease: 'expo.inOut', delay: (i % 2) * .1,
      scrollTrigger: { trigger: f, start: 'top 88%' },
    }));
    gsap.from('.gal-next__link', { yPercent: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.gal-next', start: 'top 85%' } });
  });
})();
