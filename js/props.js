// Ostacoli e oggetti raccoglibili dell'ospedale, in pixel art.
// kind: 'jump' (si salta), 'slide' (ci si scivola sotto), 'block' (si cambia corsia)
// clear: altezza (px a scala 1) da superare saltando; len: profondita' di collisione.
const Props = (() => {
  const cache = {};
  const I = PAL.ink;

  function circle(ctx, cx, cy, r0, r1, color) {
    for (let y = -Math.ceil(r1); y <= Math.ceil(r1); y++) {
      for (let x = -Math.ceil(r1); x <= Math.ceil(r1); x++) {
        const d = Math.sqrt(x * x + y * y);
        if (d >= r0 && d <= r1) Px.rect(ctx, cx + x, cy + y, 1, 1, color);
      }
    }
  }

  const DEFS = {
    // ---- da saltare ----
    barella: { kind: 'jump', clear: 16, len: 0.16, w: 44, h: 20, draw(c) {
      Px.rect(c, 4, 16, 5, 4, '#2c333d'); Px.rect(c, 35, 16, 5, 4, '#2c333d');
      Px.rect(c, 8, 12, 2, 5, PAL.metalDark); Px.rect(c, 34, 12, 2, 5, PAL.metalDark);
      Px.rect(c, 2, 10, 40, 3, PAL.metal); Px.rect(c, 2, 12, 40, 1, PAL.metalDark);
      Px.rect(c, 3, 5, 38, 5, '#f4f8fa');
      Px.rect(c, 14, 3, 27, 7, PAL.blue); Px.rect(c, 14, 9, 27, 1, PAL.blueDark);
      Px.rect(c, 17, 4, 2, 5, '#6ea0ec');
      Px.rect(c, 4, 2, 9, 4, '#ffffff'); Px.rect(c, 4, 5, 9, 1, '#d8e3e8');
    } },
    cartello: { kind: 'jump', clear: 20, len: 0.12, w: 20, h: 24, draw(c) {
      for (let y = 0; y < 22; y++) {
        const w = 6 + Math.round(y * 0.55);
        Px.rect(c, 10 - Math.floor(w / 2), y, w, 1, PAL.yellow);
      }
      Px.rect(c, 4, 18, 12, 2, '#e0a91a');
      Px.rect(c, 3, 22, 14, 2, '#c58a10');
      Px.rect(c, 9, 5, 2, 8, I); Px.rect(c, 9, 15, 2, 2, I);
    } },
    scatole: { kind: 'jump', clear: 18, len: 0.14, w: 32, h: 20, draw(c) {
      Px.rect(c, 0, 8, 20, 12, '#c8955a'); Px.rect(c, 0, 8, 20, 2, '#e0b077'); Px.rect(c, 9, 8, 2, 12, '#a87a44');
      Px.rect(c, 14, 0, 18, 12, '#d9a56a'); Px.rect(c, 14, 0, 18, 2, '#ecc08a'); Px.rect(c, 22, 0, 2, 12, '#b88650');
      Px.rect(c, 3, 13, 5, 5, '#ffffff'); Px.rect(c, 5, 13, 1, 5, PAL.red); Px.rect(c, 3, 15, 5, 1, PAL.red);
      Px.rect(c, 20, 12, 12, 8, '#c8955a'); Px.rect(c, 20, 12, 12, 1, '#a87a44');
    } },

    // ---- blocchi: cambia corsia ----
    carrello: { kind: 'block', clear: 99, len: 0.16, w: 38, h: 46, draw(c) {
      Px.rect(c, 4, 42, 6, 4, '#2c333d'); Px.rect(c, 28, 42, 6, 4, '#2c333d');
      Px.rect(c, 2, 14, 34, 28, '#e6eef2'); Px.rect(c, 2, 14, 34, 2, '#ffffff'); Px.rect(c, 2, 40, 34, 2, '#b9c6cd');
      for (let i = 0; i < 3; i++) {
        Px.rect(c, 5, 19 + i * 7, 28, 5, PAL.blue); Px.rect(c, 5, 23 + i * 7, 28, 1, PAL.blueDark);
        Px.rect(c, 16, 21 + i * 7, 6, 1, PAL.metal);
      }
      Px.rect(c, 0, 10, 38, 4, PAL.metal); Px.rect(c, 0, 13, 38, 1, PAL.metalDark);
      Px.rect(c, 5, 3, 5, 7, '#7bd88f'); Px.rect(c, 6, 1, 3, 2, PAL.white);
      Px.rect(c, 13, 5, 8, 5, '#ffffff'); Px.rect(c, 16, 5, 2, 5, PAL.red); Px.rect(c, 13, 7, 8, 2, PAL.red);
      Px.rect(c, 25, 4, 6, 6, '#f6c344');
      Px.rect(c, 36, 12, 2, 14, PAL.metalDark);
    } },
    asta: { kind: 'block', clear: 99, len: 0.12, w: 26, h: 54, draw(c) {
      Px.rect(c, 12, 4, 2, 48, PAL.metal); Px.rect(c, 13, 4, 1, 48, PAL.metalDark);
      Px.rect(c, 4, 50, 18, 2, PAL.metalDark); Px.rect(c, 2, 52, 4, 2, '#2c333d'); Px.rect(c, 20, 52, 4, 2, '#2c333d');
      Px.rect(c, 11, 49, 4, 2, PAL.metal);
      Px.rect(c, 4, 4, 18, 2, PAL.metal);
      Px.rect(c, 3, 6, 8, 14, '#d8f1ff'); Px.rect(c, 3, 11, 8, 9, '#6ec6ff'); Px.rect(c, 6, 3, 2, 3, PAL.metalDark);
      Px.rect(c, 15, 6, 8, 14, '#fff3c4'); Px.rect(c, 15, 12, 8, 8, '#ffd23f'); Px.rect(c, 18, 3, 2, 3, PAL.metalDark);
      Px.rect(c, 6, 20, 1, 12, '#a9d3dc'); Px.rect(c, 18, 20, 1, 8, '#e0c26a');
      Px.rect(c, 5, 5, 1, 12, '#ffffff');
    } },
    sedia: { kind: 'block', clear: 99, len: 0.14, w: 34, h: 38, draw(c) {
      Px.rect(c, 4, 4, 3, 22, '#2c333d'); Px.rect(c, 1, 4, 5, 3, '#2c333d');
      Px.rect(c, 7, 6, 4, 18, PAL.blue); Px.rect(c, 7, 6, 1, 18, '#6ea0ec');
      Px.rect(c, 7, 22, 22, 5, PAL.blue); Px.rect(c, 7, 26, 22, 1, PAL.blueDark);
      Px.rect(c, 26, 26, 3, 8, PAL.metalDark); Px.rect(c, 26, 33, 7, 2, '#2c333d');
      circle(c, 14, 28, 7, 9, '#2c333d'); circle(c, 14, 28, 3, 4, PAL.metal);
      Px.rect(c, 13, 27, 3, 3, PAL.metalDark);
      circle(c, 29, 35, 2, 3, '#2c333d');
    } },
    distributore: { kind: 'block', clear: 99, len: 0.16, w: 34, h: 58, draw(c) {
      Px.rect(c, 0, 0, 34, 58, PAL.red); Px.rect(c, 0, 0, 34, 3, '#f06277'); Px.rect(c, 0, 55, 34, 3, PAL.redDark);
      Px.rect(c, 3, 5, 22, 36, '#1d2b3a'); Px.rect(c, 4, 6, 20, 34, '#bfe8f7');
      const cols = ['#ffd23f', '#3bb273', '#8e5bd1', '#f28c28', '#3e7bd6'];
      for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
        Px.rect(c, 6 + q * 5, 8 + r * 8, 4, 5, cols[(r * 3 + q) % cols.length]);
        Px.rect(c, 5, 14 + r * 8, 18, 1, '#8aa9b8');
      }
      Px.rect(c, 27, 8, 5, 3, '#1d2b3a'); Px.rect(c, 28, 9, 3, 1, '#7ee08f');
      for (let i = 0; i < 6; i++) Px.rect(c, 27 + (i % 2) * 3, 14 + Math.floor(i / 2) * 4, 2, 2, PAL.metal);
      Px.rect(c, 4, 44, 26, 8, '#1d2b3a'); Px.rect(c, 6, 46, 22, 4, '#0b1118');
      Px.text(c, 'SNACK', 17, 1, '#fff', 1, 'center');
    } }
  };

  // ---- cartelli sospesi: ci si scivola sotto ----
  const SIGNS = {
    rx:     { text: 'RADIOLOGIA',  col: PAL.blue,   dark: PAL.blueDark },
    lab:    { text: 'LABORATORIO', col: PAL.green,  dark: PAL.greenDark },
    cardio: { text: 'CARDIOLOGIA', col: PAL.red,    dark: PAL.redDark },
    pedia:  { text: 'PEDIATRIA',   col: PAL.purple, dark: '#5f3a96' }
  };
  Object.keys(SIGNS).forEach((k) => {
    const s = SIGNS[k];
    // il bordo inferiore del cartello sta a 22px dal pavimento: in piedi (28px) si urta, scivolando (19px) si passa
    DEFS[k] = { kind: 'slide', clear: 0, len: 0.14, w: 50, h: 78, draw(c) {
      // catene al soffitto
      Px.rect(c, 8, 0, 2, 38, PAL.metalDark); Px.rect(c, 40, 0, 2, 38, PAL.metalDark);
      Px.rect(c, 7, 34, 4, 3, PAL.metal); Px.rect(c, 39, 34, 4, 3, PAL.metal);
      // pannello
      Px.rect(c, 0, 34, 50, 22, s.col);
      Px.rect(c, 0, 34, 50, 2, '#ffffff');
      Px.rect(c, 0, 54, 50, 2, s.dark);
      Px.rect(c, 1, 36, 48, 1, '#ffffff');
      Px.text(c, s.text, 25, 41, '#ffffff', 1, 'center', s.dark);
      Px.rect(c, 24, 49, 2, 3, '#ffffff'); // piccola freccia verso il basso
      Px.rect(c, 23, 50, 4, 1, '#ffffff');
    } };
  });

  // ---- raccoglibili ----
  DEFS.cuore = { kind: 'pickup', clear: 0, len: 0.1, w: 11, h: 10, draw(c) {
    const rows = ['.xx...xx.', 'xxxx.xxxx', 'xxxxxxxxx', 'xxxxxxxxx', '.xxxxxxx.', '..xxxxx..', '...xxx...', '....x....'];
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'x') Px.rect(c, 1 + x, 1 + y, 1, 1, (y < 2 && x < 4) ? '#ff8a9c' : (y > 4 ? PAL.redDark : PAL.red));
      }
    });
    Px.rect(c, 2, 2, 1, 1, '#ffffff');
  } };

  function get(type) {
    if (cache[type]) return cache[type];
    const d = DEFS[type];
    if (!d) throw new Error('Prop sconosciuto: ' + type);
    const raw = Px.make(d.w, d.h, (ctx) => d.draw(ctx));
    const img = type === 'cuore' ? Px.outlined(raw) : Px.outlined(raw);
    cache[type] = { type, kind: d.kind, clear: d.clear, len: d.len, img };
    return cache[type];
  }

  const TYPES = {
    jump: ['barella', 'cartello', 'scatole'],
    block: ['carrello', 'asta', 'sedia', 'distributore'],
    slide: ['rx', 'lab', 'cardio', 'pedia']
  };

  return { get, TYPES };
})();
