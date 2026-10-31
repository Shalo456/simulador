/* Portada: video de pantalla completa con sonido, capa, barrido al desplazarse */
(() => {
  const $ = id => document.getElementById(id);
  const hero = $('hero'), v = $('bv'), snd = $('snd'), pp = $('pp'), clr = $('clr');
  const stage = $('stage'), wipe = $('wipe'), top = document.querySelector('.top');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let userMuted = false, userPaused = reduce, covered = false;

  /* RECORTE AUTOMATICO: el codigo mira el video, detecta la zona con imagen (sin las franjas negras)
     y la agranda hasta llenar toda la pantalla. Funciona con Live Server o GitHub Pages (no con file://).
     Si quieres forzar la zona a mano:  const FOCO = { x0: .05, x1: .45, y0: 0, y1: 1 };  (valores de 0 a 1) */
  const FOCO = null;
  let BOX = FOCO;

  /*DETECT*/
  function detectBox(d, w, h) {
    const T = 12, col = new Array(w).fill(0), row = new Array(h).fill(0);
    const lum = (x, y) => { const i = (y * w + x) * 4; return d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) col[x] += lum(x, y) / h;
    const run = a => {
      let best = [0, 0], s = -1, gap = 0, last = -1;
      for (let i = 0; i <= a.length; i++) {
        const on = i < a.length && a[i] > T;
        if (on) { if (s < 0) s = i; last = i; gap = 0; }
        else if (s >= 0 && (++gap > 3 || i === a.length)) { if (last - s > best[1] - best[0]) best = [s, last]; s = -1; }
      }
      return best;
    };
    const [x0, x1] = run(col);
    if (x1 - x0 < w * .05) return null;
    for (let y = 0; y < h; y++) for (let x = x0; x <= x1; x++) row[y] += lum(x, y) / (x1 - x0 + 1);
    const [y0, y1] = run(row);
    if (y1 - y0 < h * .05) return null;
    return { x0: x0 / w, x1: (x1 + 1) / w, y0: y0 / h, y1: (y1 + 1) / h };
  }
  /*END*/

  const reset = () => ['inset', 'width', 'height', 'left', 'top', 'objectFit'].forEach(k => v.style[k] = '');
  const cnv = document.createElement('canvas'); cnv.width = 192; cnv.height = 108;
  function sample() {
    if (FOCO || !v.videoWidth || v.readyState < 2) return;
    try {
      const x = cnv.getContext('2d', { willReadFrequently: true });
      x.drawImage(v, 0, 0, 192, 108);
      const b = detectBox(x.getImageData(0, 0, 192, 108).data, 192, 108);
      if (b) {                                   // une lo detectado en varios cuadros
        BOX = BOX ? { x0: Math.min(BOX.x0, b.x0), x1: Math.max(BOX.x1, b.x1), y0: Math.min(BOX.y0, b.y0), y1: Math.max(BOX.y1, b.y1) } : b;
        fit();
      }
    } catch (e) { console.warn('No se pudo analizar el video (abre con Live Server, no con file://).', e); }
  }
  function fit() {
    const b = BOX;
    if (!b || !v.videoWidth) { reset(); return; }
    const rw = b.x1 - b.x0, rh = b.y1 - b.y0;
    if (rw > .92 && rh > .92) { reset(); return; }          // el video ya llena el cuadro
    const W = hero.clientWidth, H = hero.clientHeight, ar = v.videoWidth / v.videoHeight;
    const vw = Math.max(W / rw, H * ar / rh), vh = vw / ar;
    const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
    const left = clamp(W / 2 - (b.x0 + b.x1) / 2 * vw, W - b.x1 * vw, -b.x0 * vw);
    const topPx = clamp(H / 2 - (b.y0 + rh * .42) * vh, H - b.y1 * vh, -b.y0 * vh);
    Object.assign(v.style, { inset: 'auto', width: vw + 'px', height: vh + 'px', left: left + 'px', top: topPx + 'px', objectFit: 'fill' });
  }
  let marks = [.3, 1.5, 4];
  v.addEventListener('loadeddata', () => { fit(); sample(); });
  v.addEventListener('timeupdate', () => { if (marks.length && v.currentTime >= marks[0]) { marks.shift(); sample(); } });
  v.addEventListener('seeked', () => { marks = marks.filter(m => m > v.currentTime); });
  addEventListener('resize', fit);

  const ui = () => {
    snd.textContent = v.muted ? 'Activar sonido' : 'Silenciar';
    snd.setAttribute('aria-pressed', String(!v.muted));
    pp.textContent = v.paused ? 'Reproducir' : 'Pausar';
  };

  // 4K solo en pantallas grandes y sin ahorro de datos; si falta, usa 1080p
  const big = innerWidth >= 1500 && !(navigator.connection && navigator.connection.saveData);
  v.onerror = () => {
    if (v.src.includes('4k')) { v.src = 'video/boole-1080.mp4'; v.load(); start(); }
    else hero.classList.add('novideo');
  };
  v.src = big ? 'video/boole-4k.mp4' : 'video/boole-1080.mp4';
  v.onplay = v.onpause = ui;

  // Intenta reproducir CON sonido; si el navegador lo bloquea, arranca en silencio
  async function start() {
    if (reduce) { v.muted = true; v.pause(); ui(); return; }
    v.muted = false;
    try { await v.play(); }
    catch (e) { v.muted = true; try { await v.play(); } catch (_) {} }
    ui();
  }

  // El primer toque/clic/tecla activa el sonido (regla de los navegadores)
  const unlock = e => {
    if (userMuted || !v.muted || (e.target.closest && e.target.closest('.bar'))) return;
    v.muted = false;
    v.play().catch(() => { v.muted = true; }).finally(ui);
  };
  ['pointerdown', 'keydown', 'touchend'].forEach(t => addEventListener(t, unlock, { passive: true }));

  snd.onclick = () => { v.muted = !v.muted; userMuted = v.muted; if (!v.muted) v.play().catch(() => { v.muted = true; }); ui(); };
  pp.onclick = () => { if (v.paused) { userPaused = false; v.play().catch(() => {}); } else { userPaused = true; v.pause(); } ui(); };
  clr.onclick = () => {
    const c = hero.classList.toggle('clear');
    clr.setAttribute('aria-pressed', String(c));
    clr.textContent = c ? 'Mostrar capa' : 'Ver sin capa';
  };

  // Pausa el video (y el audio) cuando el barrido ya lo cubrio o se cambia de pestana
  const sync = () => {
    if (hero.classList.contains('novideo')) return;
    (!covered && !document.hidden && !userPaused) ? v.play().catch(() => {}) : v.pause();
  };
  document.addEventListener('visibilitychange', sync);

  // BARRIDO: el avance del scroll mueve el borde diagonal de izquierda a derecha
  let tick = false;
  const onScroll = () => {
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      const max = Math.max(1, stage.offsetHeight - innerHeight);
      const p = Math.min(1, Math.max(0, (scrollY - stage.offsetTop) / max));
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      wipe.style.setProperty('--w', (e * 118).toFixed(2) + '%');
      top.classList.toggle('solid', scrollY > 40);
      const c = p > .98;
      if (c !== covered) { covered = c; sync(); }
      tick = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // "Como funciona" y la flecha llevan al final del barrido
  document.querySelectorAll('a[href="#info"]').forEach(a => a.onclick = e => {
    e.preventDefault();
    scrollTo({ top: stage.offsetTop + stage.offsetHeight - innerHeight, behavior: reduce ? 'auto' : 'smooth' });
  });

  start().then(() => { onScroll(); sync(); });
})();
