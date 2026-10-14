// Strumenti di base per la pixel art.
// Il canvas principale e' 360x640 ma si disegna in "unita' di progetto" 180x320 (ctx.scale(2,2)):
// 1 unita' = 2 pixel reali, la risoluzione minima e' quindi di mezza unita' (ctx.__q = 0.5).
// Gli sprite sono invece disegnati in pixel reali (canvas offscreen, ctx.__q = 1) e poi riportati
// alla scala di progetto con Px.blit (1 pixel sprite = mezza unita').
const Px = (() => {
  function make(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.__q = 1;
    if (drawFn) drawFn(x, w, h);
    return c;
  }

  const qOf = (ctx) => ctx.__q || 1;
  const snap = (v, q) => Math.round(v / q) * q;

  function rect(ctx, x, y, w, h, color) {
    const q = qOf(ctx);
    const x0 = snap(x, q), y0 = snap(y, q);
    const x1 = snap(x + w, q), y1 = snap(y + h, q);
    ctx.fillStyle = color;
    ctx.fillRect(x0, y0, Math.max(q, x1 - x0), Math.max(q, y1 - y0));
  }

  // Ellisse piena (a scanline, bordi netti)
  function ell(ctx, cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    for (let y = -Math.floor(ry); y <= Math.floor(ry); y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + y), Math.max(1, half * 2), 1);
    }
  }

  // Segmento spesso th pixel (per braccia e gambe)
  function line(ctx, x0, y0, x1, y1, th, color) {
    ctx.fillStyle = color;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      ctx.fillRect(Math.round(x - th / 2), Math.round(y - th / 2), th, th);
    }
  }

  // Rettangolo con luce in alto/sinistra e ombra in basso/destra (volume)
  function bev(ctx, x, y, w, h, base, hi, lo) {
    ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
    if (hi) { ctx.fillStyle = hi; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h); }
    if (lo) { ctx.fillStyle = lo; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h); }
  }

  // ---- font 5x7 (35 caratteri per glifo, riga per riga) ----
  const G = (s) => s.replace(/,/g, '');
  const FONT = {
    A: G('01110,10001,10001,11111,10001,10001,10001'), B: G('11110,10001,10001,11110,10001,10001,11110'),
    C: G('01110,10001,10000,10000,10000,10001,01110'), D: G('11110,10001,10001,10001,10001,10001,11110'),
    E: G('11111,10000,10000,11110,10000,10000,11111'), F: G('11111,10000,10000,11110,10000,10000,10000'),
    G: G('01110,10001,10000,10111,10001,10001,01111'), H: G('10001,10001,10001,11111,10001,10001,10001'),
    I: G('01110,00100,00100,00100,00100,00100,01110'), J: G('00111,00010,00010,00010,00010,10010,01100'),
    K: G('10001,10010,10100,11000,10100,10010,10001'), L: G('10000,10000,10000,10000,10000,10000,11111'),
    M: G('10001,11011,10101,10101,10001,10001,10001'), N: G('10001,11001,10101,10011,10001,10001,10001'),
    O: G('01110,10001,10001,10001,10001,10001,01110'), P: G('11110,10001,10001,11110,10000,10000,10000'),
    Q: G('01110,10001,10001,10001,10101,10010,01101'), R: G('11110,10001,10001,11110,10100,10010,10001'),
    S: G('01111,10000,10000,01110,00001,00001,11110'), T: G('11111,00100,00100,00100,00100,00100,00100'),
    U: G('10001,10001,10001,10001,10001,10001,01110'), V: G('10001,10001,10001,10001,10001,01010,00100'),
    W: G('10001,10001,10001,10101,10101,11011,10001'), X: G('10001,10001,01010,00100,01010,10001,10001'),
    Y: G('10001,10001,01010,00100,00100,00100,00100'), Z: G('11111,00001,00010,00100,01000,10000,11111'),
    0: G('01110,10001,10011,10101,11001,10001,01110'), 1: G('00100,01100,00100,00100,00100,00100,01110'),
    2: G('01110,10001,00001,00010,00100,01000,11111'), 3: G('11110,00001,00001,01110,00001,00001,11110'),
    4: G('00010,00110,01010,10010,11111,00010,00010'), 5: G('11111,10000,11110,00001,00001,10001,01110'),
    6: G('00110,01000,10000,11110,10001,10001,01110'), 7: G('11111,00001,00010,00100,01000,01000,01000'),
    8: G('01110,10001,10001,01110,10001,10001,01110'), 9: G('01110,10001,10001,01111,00001,00010,01100'),
    '!': G('00100,00100,00100,00100,00100,00000,00100'), '.': G('00000,00000,00000,00000,00000,01100,01100'),
    ':': G('00000,01100,01100,00000,01100,01100,00000'), '-': G('00000,00000,00000,11111,00000,00000,00000'),
    '/': G('00001,00001,00010,00100,01000,10000,10000'), "'": G('00100,00100,01000,00000,00000,00000,00000'),
    '?': G('01110,10001,00001,00010,00100,00000,00100'), '+': G('00000,00100,00100,11111,00100,00100,00000'),
    ',': G('00000,00000,00000,00000,01100,00100,01000'), ' ': '0'.repeat(35)
  };

  function norm(str) {
    return String(str).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }

  // f = pixel reali per "pixel" del font (intero). Larghezza in unita' del contesto.
  function textWidth(str, f = 2, ctx = null) {
    const s = norm(str);
    const u = f * (ctx ? qOf(ctx) : 0.5);
    return s.length ? (s.length * 6 - 1) * u : 0;
  }

  function glyphs(ctx, s, x, y, color, u) {
    ctx.fillStyle = color;
    let cx = x;
    for (const ch of s) {
      const g = FONT[ch] || FONT['?'];
      for (let i = 0; i < 35; i++) {
        if (g[i] === '1') ctx.fillRect(cx + (i % 5) * u, y + Math.floor(i / 5) * u, u, u);
      }
      cx += 6 * u;
    }
  }

  // x,y in unita' del contesto; f intero (pixel reali per pixel del font); align: left|center|right
  function text(ctx, str, x, y, color = '#fff', f = 2, align = 'left', outline = null) {
    const s = norm(str);
    const q = qOf(ctx);
    const u = f * q;
    const w = s.length ? (s.length * 6 - 1) * u : 0;
    let px = snap(x, q);
    if (align === 'center') px = snap(x - w / 2, q);
    else if (align === 'right') px = snap(x - w, q);
    const py = snap(y, q);
    if (outline) {
      const o = Math.max(q, Math.round(f / 2) * q);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        glyphs(ctx, s, px + dx * o, py + dy * o, outline, u);
      }
    }
    glyphs(ctx, s, px, py, color, u);
    return w;
  }

  // Pulsante con bevel. f = dimensione testo. Restituisce il rettangolo per l'hit test.
  function button(ctx, x, y, w, h, label, o = {}) {
    const base = o.color || '#3bb273';
    const dark = o.dark || '#26875a';
    const light = o.light || '#6fd9a2';
    const dy = o.pressed ? 1 : 0;
    rect(ctx, x, y + 2, w, h, PAL.ink);
    rect(ctx, x, y + dy, w, h, PAL.ink);
    rect(ctx, x + 1, y + 1 + dy, w - 2, h - 2, base);
    rect(ctx, x + 1, y + 1 + dy, w - 2, 1, light);
    rect(ctx, x + 1, y + h - 2.5 + dy, w - 2, 1.5, dark);
    if (label) {
      const f = o.f || 2;
      text(ctx, label, x + w / 2, y + (h - 7 * f * 0.5) / 2 + dy - 0.5, o.text || '#fff', f, 'center', dark);
    }
    return { x, y, w, h };
  }

  function hit(r, p, pad = 0) {
    return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
  }

  // Pseudo-casuale deterministico (per decorazioni stabili)
  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = n + (n << 3);
    n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d);
    n = n ^ (n >>> 15);
    return (n >>> 0) / 4294967295;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // Sagoma monocolore dello sprite (serve per i contorni)
  function tint(src, color) {
    return make(src.width, src.height, (c) => {
      c.drawImage(src, 0, 0);
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = color;
      c.fillRect(0, 0, src.width, src.height);
    });
  }

  // Contorno scuro di 1 pixel attorno allo sprite (+1px di margine per lato)
  function outlined(src, color = '#10151f') {
    const sil = tint(src, color);
    return make(src.width + 2, src.height + 2, (c) => {
      for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2]]) c.drawImage(sil, dx, dy);
      c.drawImage(src, 1, 1);
    });
  }

  // Disegna uno sprite sul canvas principale. (x, yBottom) = centro-base in unita' di progetto,
  // k = scala (1 = 1 pixel sprite -> mezza unita'). Dimensioni in unita': w = img.width * k / 2.
  function blit(ctx, img, x, yBottom, k = 1) {
    const w = img.width * k * 0.5, h = img.height * k * 0.5;
    // scale non intere: interpolazione morbida (meno sgranato); intere: pixel netti
    ctx.imageSmoothingEnabled = Math.abs(k - Math.round(k)) > 0.01;
    ctx.drawImage(img, snap(x - w / 2, 0.5), snap(yBottom - h, 0.5), Math.max(0.5, w), Math.max(0.5, h));
    ctx.imageSmoothingEnabled = false;
  }

  return { make, rect, ell, line, bev, text, textWidth, button, hit, hash, lerp, clamp, ease, tint, outlined, blit };
})();
