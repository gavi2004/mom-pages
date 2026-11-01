# mom-pages — FCBG (First Class Building Group)

Landing page de FCBG servida con Express (`node app.js`, puerto 7895).

## Rediseño 2026

- **GSAP 3.13** (ScrollTrigger, SplitText, DrawSVG) + **Lenis** para scroll suave — vendorizados en `public/vendor/`.
- **Tipografía cinética** con la fuente variable *Archivo* (eje de anchura `wdth` 62–125): titulares que se estiran/comprimen al entrar, con el scroll y con la proximidad del ratón.
- **Estética blueprint**: retícula de plano, cotas dibujadas con DrawSVG, preloader que dibuja la casa del logo, cursor en cruz.
- **Scroll-world**: la sección "Build sequence" usa el motor de la skill [`scroll-world`](https://github.com/oso95/scroll-world) (instalada en `.claude/skills/scroll-world`). Al hacer scroll la cámara vuela por cada fase de obra; cada escena empieza como plano y se convierte en la foto real.
- Paleta original respetada: `#003a1d`, `#1a4f30`, `#2c974b`, `#E0E8D7`, blanco.
- Responsive: navegación con menú a pantalla completa en móvil, clips verticales 9:16 nativos para teléfonos, `prefers-reduced-motion` respetado.

## Clips del scroll-world

La skill normalmente genera los vídeos con IA (Higgsfield / Monid, de pago). Aquí se generan en local, gratis, a partir de las fotos de `public/img/`:

```bash
python3 tools/build-world.py          # desktop 1280x720 + móvil 720x1280
python3 tools/build-world.py desktop  # sólo desktop
```

Requiere `numpy`, `Pillow` y `ffmpeg`. Las uniones entre clips son idénticas frame a frame (regla del paso 5 de la skill). Para cambiar escenas edita `SCENES` en el script y `PHASES` en `public/js/site.js`.

`public/vendor/scrub-engine.js` es una copia del motor de la skill con un parche para poder montarlo a mitad de página (ver la cabecera del archivo).

## Galerías

`public/Gallery1-5.html` se generan con `python3 tools/build-galleries.py` (una por oficio, solo fotos reales de FCBG). Para añadir fotos a un oficio, ponlas en `public/img` y añádelas a su lista `extras` en el script.

## Despliegue en Vercel

`vercel.json` publica `public/` como sitio estático (no hace falta Express en Vercel). Cada push a la rama conectada despliega automáticamente.

## QA con agent-browser

La skill [`agent-browser`](https://github.com/vercel-labs/agent-browser) está en `.claude/skills/agent-browser`. Ejemplo de revisión móvil:

```bash
npm i -g agent-browser
agent-browser set device "iPhone 14"
agent-browser open https://fcbg-mom-pages.vercel.app/
agent-browser screenshot hero.png
agent-browser errors
```
