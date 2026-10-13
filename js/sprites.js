// Strumenti di base per la pixel art: canvas offscreen, font bitmap 3x5, pulsanti e testo.
const Px = (() => {
  function make(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    if (drawFn) drawFn(x, w, h);
    return c;
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Font 3x5: ogni glifo e' una stringa di 15 caratteri (riga per riga)
  const FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
    E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
    I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
    Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
    8: '111101111101111', 9: '111101111001110',
    '!': '010010010000010', '.': '000000000000010', ':': '000010000010000',
    '-': '000000111000000', '/': '001001010100100', "'": '010010000000000',
    '?': '110001010000010', '+': '000010111010000', ' ': '000000000000000'
  };

  function norm(str) {
    return String(str).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }

  function textWidth(str, scale = 1) {
    const s = norm(str);
    return s.length ? (s.length * 4 - 1) * scale : 0;
  }

  function glyphs(ctx, s, x, y, color, scale) {
    ctx.fillStyle = color;
    let cx = x;
    for (const ch of s) {
      const g = FONT[ch] || FONT['?'];
      for (let i = 0; i < 15; i++) {
        if (g[i] === '1') ctx.fillRect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale);
      }
      cx += 4 * scale;
    }
  }

  // align: 'left' | 'center' | 'right'. outline: colore del contorno (opzionale)
  function text(ctx, str, x, y, color = '#fff', scale = 1, align = 'left', outline = null) {
    const s = norm(str);
    const w = textWidth(s, scale);
    let px = Math.round(x);
    if (align === 'center') px = Math.round(x - w / 2);
    else if (align === 'right') px = Math.round(x - w);
    const py = Math.round(y);
    if (outline) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        glyphs(ctx, s, px + dx * scale, py + dy * scale, outline, scale);
      }
    }
    glyphs(ctx, s, px, py, color, scale);
    return w;
  }

  // Pulsante pixel art con bevel. Restituisce il rettangolo per l'hit test.
  function button(ctx, x, y, w, h, label, o = {}) {
    const base = o.color || '#3bb273';
    const dark = o.dark || '#26875a';
    const light = o.light || '#6fd9a2';
    const pressed = !!o.pressed;
    const dy = pressed ? 1 : 0;
    rect(ctx, x, y + 2, w, h, PAL.ink);
    rect(ctx, x, y + dy, w, h, PAL.ink);
    rect(ctx, x + 1, y + 1 + dy, w - 2, h - 2, base);
    rect(ctx, x + 1, y + 1 + dy, w - 2, 1, light);
    rect(ctx, x + 1, y + h - 2 + dy, w - 2, 1, dark);
    text(ctx, label, x + w / 2, y + Math.round((h - 5 * (o.scale || 1)) / 2) + dy, o.text || '#fff', o.scale || 1, 'center', dark);
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

  // Aggiunge un contorno scuro di 1 pixel attorno allo sprite (+1px di margine per lato)
  function outlined(src, color = '#10151f') {
    const sil = tint(src, color);
    return make(src.width + 2, src.height + 2, (c) => {
      for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) c.drawImage(sil, dx, dy);
      c.drawImage(src, 1, 1);
    });
  }

  return { make, rect, text, textWidth, button, hit, hash, lerp, clamp, ease, tint, outlined };
})();
