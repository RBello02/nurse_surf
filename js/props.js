// Ostacoli e oggetti dell'ospedale, in pixel art ad alta definizione (1 pixel sprite = mezza unita').
// Tre famiglie, riconoscibili a colpo d'occhio:
//   'jump'  = oggetti BASSI a terra (cartello "pavimento bagnato", secchio col mocio, scatole, barriera) -> si SALTA
//   'slide' = cartelli di reparto APPESI al soffitto con frecce verso il basso -> ci si SCIVOLA sotto
//   'block' = oggetti ALTI come lettini con pazienti, sedia a rotelle, carrello, distributore -> si CAMBIA CORSIA
// Sopra ogni ostacolo, quando e' vicino, compare un'icona che dice cosa fare (freccia su / giu / laterale).
const Props = (() => {
  const cache = {};
  const INK = PAL.ink;
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const E = Px.ell, L = Px.line, B = Px.bev;
  const SKIN = '#f2c9a5', SKIN_SH = '#d9a982';

  function stripes(c, x, y, w, h, a, b, per) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      c.fillStyle = ((((xx + yy) / per) | 0) % 2) ? b : a;
      c.fillRect(x + xx, y + yy, 1, 1);
    }
  }
  function wheel(c, x, y, r) { E(c, x, y, r, r, '#2c333d'); E(c, x, y, r - 3, r - 3, '#9aa5af'); E(c, x, y, 2, 2, '#2c333d'); }
  function ivPole(c, x, top, bottom, bag) {
    L(c, x, top, x, bottom, 3, '#c4ccd3'); L(c, x + 1, top, x + 1, bottom, 1, '#ffffff');
    R(c, x - 8, bottom - 2, 17, 3, '#8c97a1');
    R(c, x - 7, top - 1, 15, 3, '#9aa5af');
    if (bag) {
      E(c, x + 7, top + 17, 8, 12, '#e6f6ff'); E(c, x + 7, top + 21, 7, 8, '#6ec6ff');
      R(c, x + 6, top + 2, 2, 5, '#9aa5af');
      L(c, x + 7, top + 30, x + 7, top + 42, 1, '#9bd8ee');
    }
  }
  function face(c, x, y, r, opts = {}) {
    E(c, x, y, r, r, SKIN); E(c, x - 2, y - 2, r - 4, r - 5, '#f7d9bd');
    E(c, x - r + 3, y + 3, 3, 2, '#f1a58e'); E(c, x + r - 3, y + 3, 3, 2, '#f1a58e');
    if (opts.sleep) {
      R(c, x - 6, y - 1, 4, 1, '#3a2210'); R(c, x + 3, y - 1, 4, 1, '#3a2210');
      R(c, x - 2, y + 5, 5, 1, '#b9524f');
    } else {
      R(c, x - 6, y - 2, 3, 4, '#3a2210'); R(c, x + 4, y - 2, 3, 4, '#3a2210');
      R(c, x - 6, y - 2, 1, 1, '#fff'); R(c, x + 4, y - 2, 1, 1, '#fff');
      R(c, x - 4, y + 5, 9, 1, '#b9524f'); R(c, x - 5, y + 4, 1, 1, '#b9524f'); R(c, x + 5, y + 4, 1, 1, '#b9524f');
      R(c, x - 3, y + 6, 7, 2, '#ffffff');
    }
  }
  function gurney(c, x0, x1, yFrame) {
    wheel(c, x0 + 12, yFrame + 26, 8); wheel(c, x1 - 12, yFrame + 26, 8);
    R(c, x0 + 10, yFrame + 5, 4, 14, '#8c97a1'); R(c, x1 - 14, yFrame + 5, 4, 14, '#8c97a1');
    R(c, x0, yFrame, x1 - x0, 6, '#9aa5af'); R(c, x0, yFrame, x1 - x0, 2, '#d3dce2'); R(c, x0, yFrame + 5, x1 - x0, 1, '#5b6670');
    B(c, x0 + 2, yFrame - 12, x1 - x0 - 4, 12, '#f4f8fa', '#ffffff', '#c3d0d8');
    R(c, x1 - 10, yFrame - 6, 8, 6, '#c3d0d8');
  }

  const DEFS = {
    // ================= DA SALTARE: bassi, con righe gialle e nere =================
    wetsign: { kind: 'jump', clear: 30, len: 0.16, w: 84, h: 64, draw(c) {
      E(c, 42, 59, 38, 4, '#8fd3f0'); E(c, 34, 58, 14, 1, '#dff4fc');
      L(c, 22, 58, 30, 10, 4, '#7a838c'); L(c, 62, 58, 54, 10, 4, '#7a838c');
      for (let y = 4; y < 56; y++) {
        const half = Math.round(12 + (y - 4) * 0.33);
        R(c, 42 - half, y, half * 2, 1, '#ffd23f');
        R(c, 42 - half, y, 3, 1, '#ffe98a'); R(c, 42 + half - 3, y, 3, 1, '#d79b10');
      }
      // pittogramma di una persona che scivola
      E(c, 34, 22, 4, 4, INK); L(c, 37, 27, 47, 35, 5, INK); L(c, 36, 30, 29, 38, 3, INK); L(c, 46, 35, 57, 36, 3, INK);
      L(c, 22, 46, 60, 44, 2, INK);
      stripes(c, 16, 49, 52, 6, INK, '#ffd23f', 5);
    } },
    bucket: { kind: 'jump', clear: 28, len: 0.15, w: 76, h: 60, draw(c) {
      E(c, 38, 56, 34, 4, '#8fd3f0'); E(c, 30, 55, 12, 1, '#dff4fc');
      // mocio appoggiato
      L(c, 20, 4, 13, 46, 3, '#b5834a'); L(c, 21, 4, 14, 46, 1, '#d9a76a');
      E(c, 12, 51, 11, 5, '#cfd6dc'); for (let i = 0; i < 11; i++) R(c, 2 + i * 2, 52, 1, 7, i % 2 ? '#aeb7bf' : '#e3e8ec');
      // secchio giallo
      for (let y = 26; y < 54; y++) { const half = 17 - Math.round((y - 26) * 0.12); R(c, 52 - half, y, half * 2, 1, '#ffd23f'); R(c, 52 + half - 5, y, 5, 1, '#d79b10'); R(c, 52 - half, y, 3, 1, '#ffe98a'); }
      R(c, 33, 24, 38, 4, '#e0a91a'); E(c, 52, 25, 18, 3, '#6ec6ff'); E(c, 46, 24, 6, 1, '#dff4fc');
      L(c, 34, 26, 38, 12, 2, '#6b747d'); L(c, 38, 12, 66, 12, 2, '#6b747d'); L(c, 66, 12, 70, 26, 2, '#6b747d');
      E(c, 52, 42, 4, 4, '#3e7bd6'); R(c, 51, 36, 2, 4, '#3e7bd6');
      stripes(c, 36, 50, 32, 4, INK, '#ffd23f', 4);
    } },
    boxes: { kind: 'jump', clear: 30, len: 0.16, w: 100, h: 62, draw(c) {
      B(c, 4, 26, 54, 34, '#c8955a', '#e0b077', '#a87a44'); R(c, 28, 26, 6, 34, '#e8d9a8');
      R(c, 12, 38, 16, 14, '#ffffff'); R(c, 18, 40, 4, 10, PAL.red); R(c, 14, 43, 12, 4, PAL.red);
      B(c, 52, 36, 44, 24, '#d9a56a', '#ecc08a', '#b88650'); R(c, 58, 42, 32, 14, '#ffffff'); Px.text(c, 'MED', 59, 43, PAL.red, 2, 'left');
      B(c, 14, 6, 32, 20, '#c8955a', '#e0b077', '#a87a44'); R(c, 28, 6, 4, 20, '#e8d9a8');
      R(c, 18, 14, 8, 8, '#ffffff'); R(c, 21, 15, 2, 6, PAL.red); R(c, 19, 17, 6, 2, PAL.red);
      stripes(c, 4, 56, 54, 4, INK, '#ffd23f', 4);
    } },
    barrier: { kind: 'jump', clear: 28, len: 0.15, w: 104, h: 58, draw(c) {
      L(c, 16, 20, 8, 56, 5, '#6b747d'); L(c, 88, 20, 96, 56, 5, '#6b747d');
      stripes(c, 10, 16, 84, 14, '#e0344b', '#ffffff', 9); R(c, 10, 16, 84, 2, INK); R(c, 10, 29, 84, 1, INK);
      stripes(c, 10, 34, 84, 14, '#ffffff', '#e0344b', 9); R(c, 10, 34, 84, 1, INK); R(c, 10, 47, 84, 2, INK);
      R(c, 12, 8, 8, 8, '#6b747d'); E(c, 16, 6, 6, 6, '#ffb020'); E(c, 15, 5, 2, 2, '#fff3b0');
      R(c, 84, 8, 8, 8, '#6b747d'); E(c, 88, 6, 6, 6, '#ffb020');
    } },

    // ================= BLOCCHI: alti, si cambia corsia =================
    gurney1: { kind: 'block', clear: 99, len: 0.18, w: 112, h: 152, draw(c) {
      ivPole(c, 14, 6, 148, true);
      gurney(c, 24, 108, 112);
      E(c, 90, 94, 15, 7, '#ffffff');                      // cuscino
      // paziente che dorme
      E(c, 60, 98, 36, 12, '#5ab8ec'); E(c, 60, 94, 36, 8, '#7fd3ff');
      for (let i = 0; i < 6; i++) R(c, 34 + i * 10, 88, 4, 20, i % 2 ? '#7fd3ff' : '#9bdcff');
      R(c, 26, 90, 62, 3, '#ffffff');
      E(c, 36, 99, 8, 6, '#7fd3ff');
      E(c, 90, 86, 11, 11, '#8a6a3a'); face(c, 90, 88, 10, { sleep: true });
      E(c, 90, 79, 11, 5, '#8a6a3a');
      Px.text(c, 'Z', 96, 62, '#ffffff', 2, 'left', '#1d2b3a'); Px.text(c, 'Z', 103, 46, '#ffffff', 2, 'left', '#1d2b3a');
    } },
    gurney2: { kind: 'block', clear: 99, len: 0.18, w: 112, h: 152, draw(c) {
      ivPole(c, 14, 6, 148, true);
      gurney(c, 24, 108, 112);
      // schienale alzato e paziente seduto con il braccio che saluta
      L(c, 72, 100, 92, 62, 7, '#c4ccd3');
      E(c, 90, 80, 14, 20, '#9bc9f3'); E(c, 86, 76, 7, 14, '#b9dbf8');
      L(c, 100, 70, 108, 46, 5, SKIN); E(c, 108, 42, 6, 6, SKIN);
      L(c, 112 - 4, 34, 112 - 1, 40, 1, '#1d2b3a');
      E(c, 90, 52, 13, 13, '#8a6a3a'); face(c, 90, 55, 12);
      R(c, 77, 44, 26, 7, '#ffffff'); R(c, 77, 47, 26, 1, '#d8e3e8'); R(c, 88, 44, 1, 7, '#d8e3e8');
      // gamba ingessata sollevata
      L(c, 62, 98, 36, 70, 11, '#f7f7f7'); L(c, 62, 96, 36, 68, 3, '#ffffff'); L(c, 54, 104, 28, 76, 2, '#d3dce2');
      E(c, 31, 66, 6, 4, SKIN);
      // coperta rossa
      E(c, 82, 104, 24, 6, '#e0344b'); R(c, 60, 104, 48, 4, '#c32b44');
    } },
    wheelchair: { kind: 'block', clear: 99, len: 0.16, w: 100, h: 148, draw(c) {
      ivPole(c, 90, 8, 144, true);
      wheel(c, 34, 118, 26); for (let a = 0; a < 6; a++) L(c, 34, 118, 34 + Math.round(Math.cos(a * 1.047) * 22), 118 + Math.round(Math.sin(a * 1.047) * 22), 1, '#cfd6dc');
      wheel(c, 70, 140, 8);
      L(c, 24, 100, 70, 100, 5, '#46515c'); L(c, 8, 74, 24, 100, 4, '#46515c'); R(c, 4, 70, 14, 4, '#2c333d');
      L(c, 66, 100, 72, 134, 3, '#6b747d');
      // paziente: nonnino con occhiali e pollice in su
      E(c, 44, 82, 15, 22, '#9bc9f3'); E(c, 38, 78, 6, 14, '#b9dbf8');
      E(c, 56, 100, 24, 8, '#d9a76a'); for (let i = 0; i < 6; i++) { R(c, 36 + i * 8, 94, 4, 14, '#c0804a'); }
      L(c, 58, 80, 72, 70, 5, SKIN); E(c, 74, 65, 5, 5, SKIN); R(c, 73, 57, 3, 7, SKIN);
      E(c, 44, 52, 14, 14, '#e8e8e8'); face(c, 44, 55, 12);
      E(c, 44, 43, 15, 7, '#e8e8e8'); E(c, 32, 56, 4, 8, '#e8e8e8'); E(c, 56, 56, 4, 8, '#e8e8e8');
      R(c, 35, 52, 8, 1, '#3a2210'); R(c, 46, 52, 8, 1, '#3a2210'); R(c, 43, 52, 4, 1, '#3a2210');
      R(c, 35, 52, 1, 6, '#3a2210'); R(c, 42, 52, 1, 6, '#3a2210'); R(c, 46, 52, 1, 6, '#3a2210'); R(c, 53, 52, 1, 6, '#3a2210');
      R(c, 35, 57, 8, 1, '#3a2210'); R(c, 46, 57, 8, 1, '#3a2210');
    } },
    cart: { kind: 'block', clear: 99, len: 0.17, w: 106, h: 146, draw(c) {
      wheel(c, 22, 138, 8); wheel(c, 84, 138, 8);
      B(c, 8, 54, 90, 78, '#e8eef2', '#ffffff', '#b9c6cd');
      for (let i = 0; i < 4; i++) { B(c, 14, 60 + i * 17, 78, 14, '#3e7bd6', '#6ea0ec', '#27559c'); R(c, 44, 65 + i * 17, 18, 3, '#cfd6dc'); }
      R(c, 70, 62, 14, 10, '#ffffff'); R(c, 75, 63, 4, 8, PAL.red); R(c, 72, 66, 10, 3, PAL.red);
      R(c, 4, 46, 98, 8, '#9aa5af'); R(c, 4, 46, 98, 2, '#d3dce2'); R(c, 98, 54, 4, 40, '#6b747d');
      // monitor con elettrocardiogramma
      B(c, 56, 10, 40, 32, '#2c333d', '#46515c', '#101820'); R(c, 60, 14, 32, 22, '#0d1f17');
      L(c, 60, 28, 66, 28, 1, '#58ff9a'); L(c, 66, 28, 69, 18, 1, '#58ff9a'); L(c, 69, 18, 73, 34, 1, '#58ff9a'); L(c, 73, 34, 76, 28, 1, '#58ff9a'); L(c, 76, 28, 92, 28, 1, '#58ff9a');
      R(c, 72, 42, 8, 4, '#6b747d');
      // flaconi
      for (let i = 0; i < 4; i++) { R(c, 12 + i * 10, 30, 7, 16, i % 2 ? '#f28c28' : '#ffd23f'); R(c, 13 + i * 10, 26, 5, 5, '#ffffff'); }
    } },
    vending: { kind: 'block', clear: 99, len: 0.17, w: 84, h: 170, draw(c) {
      B(c, 2, 4, 80, 162, PAL.red, '#f06277', PAL.redDark);
      R(c, 8, 10, 68, 16, '#1d2b3a'); Px.text(c, 'SNACK', 14, 13, '#ffd23f', 2, 'left');
      R(c, 8, 32, 50, 82, '#1d2b3a'); R(c, 10, 34, 46, 78, '#bfe8f7');
      const cols = ['#ffd23f', '#3bb273', '#8e5bd1', '#f28c28', '#3e7bd6', '#e0344b'];
      for (let r = 0; r < 4; r++) { for (let q = 0; q < 4; q++) { E(c, 18 + q * 11, 46 + r * 19, 4, 6, cols[(r * 3 + q) % cols.length]); } R(c, 10, 55 + r * 19, 46, 2, '#8aa9b8'); }
      R(c, 62, 34, 14, 10, '#1d2b3a'); R(c, 64, 36, 10, 4, '#58ff9a');
      for (let i = 0; i < 9; i++) R(c, 63 + (i % 3) * 5, 50 + ((i / 3) | 0) * 7, 4, 4, '#cfd6dc');
      R(c, 8, 122, 68, 30, '#1d2b3a'); R(c, 12, 126, 60, 22, '#0b1118'); R(c, 8, 154, 68, 4, PAL.redDark);
    } }
  };

  // ---- cartelli di reparto appesi al soffitto (alti quanto il corridoio: le catene arrivano in cima) ----
  const SIGNS = {
    rx:     { text: 'RADIO',  col: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' },
    lab:    { text: 'LAB',    col: '#3bb273', dark: '#26875a', light: '#6fd9a2' },
    cardio: { text: 'CARDIO', col: '#e0344b', dark: '#a82036', light: '#f06277' },
    pedia:  { text: 'PEDIA',  col: '#8e5bd1', dark: '#5f3a96', light: '#b48ae6' }
  };
  const SIGN_H = 436;            // = altezza del corridoio (218 unita') in pixel sprite
  const SIGN_BOTTOM = SIGN_H - 92;   // il bordo inferiore sta 46 unita' sopra il pavimento
  Object.keys(SIGNS).forEach((k) => {
    const s = SIGNS[k];
    DEFS[k] = { kind: 'slide', clear: 0, len: 0.16, w: 120, h: SIGN_H, draw(c) {
      const top = SIGN_BOTTOM - 44;
      for (const x of [22, 98]) {                            // catene dal soffitto
        for (let y = 0; y < top; y += 8) { R(c, x - 2, y, 5, 6, '#9aa5af'); R(c, x - 1, y + 1, 3, 4, '#d3dce2'); }
        R(c, x - 5, top - 6, 11, 6, '#6b747d');
      }
      B(c, 2, top, 116, 30, s.col, s.light, s.dark);
      R(c, 5, top + 3, 110, 24, s.col); R(c, 5, top + 3, 110, 1, '#ffffff');
      Px.text(c, s.text, 60, top + 8, '#ffffff', 2, 'center', s.dark);
      // fascia con tre frecce verso il basso: "passa sotto"
      R(c, 2, top + 30, 116, 14, '#1d2b3a');
      for (const x of [30, 60, 90]) for (let i = 0; i < 8; i++) R(c, x - 8 + i, top + 33 + i, 17 - i * 2, 1, '#ffd23f');
    } };
  });

  function build(type) {
    const d = DEFS[type];
    if (!d) throw new Error('Prop sconosciuto: ' + type);
    return Px.outlined(Px.make(d.w, d.h, (c) => d.draw(c)));
  }

  function get(type) {
    if (cache[type]) return cache[type];
    if (type === 'cfu') return (cache[type] = { type, kind: 'pickup', clear: 0, len: 0.12, img: medal() });
    const d = DEFS[type];
    cache[type] = { type, kind: d.kind, clear: d.clear, len: d.len, img: build(type), topUnits: d.kind === 'slide' ? (SIGN_H - SIGN_BOTTOM + 44) / 2 : d.h / 2 };
    return cache[type];
  }

  // ---- medaglietta CFU (al posto dei cuori) ----
  let medalImg = null;
  function medal() {
    if (medalImg) return medalImg;
    medalImg = Px.outlined(Px.make(60, 84, (c) => {
      // nastro rosso e blu
      L(c, 22, 2, 18, 38, 9, PAL.red); L(c, 38, 2, 42, 38, 9, PAL.blue);
      L(c, 18, 2, 16, 30, 2, '#f06277'); L(c, 42, 2, 44, 30, 2, '#6ea0ec');
      // medaglia d'oro
      E(c, 30, 56, 27, 27, '#b57d12'); E(c, 30, 56, 25, 25, '#f6c344'); E(c, 30, 56, 21, 21, '#c9962a'); E(c, 30, 56, 19, 19, '#ffe27a');
      E(c, 24, 48, 9, 5, '#fff3b0');
      Px.text(c, 'CFU', 30, 49, '#7a4a0a', 2, 'center');
      R(c, 14, 64, 32, 2, '#c9962a');
      for (let i = 0; i < 5; i++) R(c, 18 + i * 6, 68, 3, 3, '#b57d12');
    }));
    return medalImg;
  }

  // ---- icone di suggerimento sopra gli ostacoli ----
  const hints = {};
  function hint(kind) {
    if (hints[kind]) return hints[kind];
    const col = { jump: '#ffd23f', slide: '#5ad1ff', block: '#ff5470' }[kind];
    hints[kind] = Px.outlined(Px.make(40, 40, (c) => {
      B(c, 0, 0, 40, 40, '#1d2b3a', '#46515c', '#0b1118');
      R(c, 3, 3, 34, 34, '#101820');
      if (kind === 'jump') for (let i = 0; i < 14; i++) { R(c, 20 - i, 6 + i, 1 + i * 2, 1, col); R(c, 17, 20 + (i > 7 ? 0 : i), 7, 1, col); }
      else if (kind === 'slide') for (let i = 0; i < 14; i++) { R(c, 20 - i, 34 - i, 1 + i * 2, 1, col); R(c, 17, 6 + (i > 7 ? 0 : i), 7, 1, col); }
      else {
        for (let i = 0; i < 8; i++) { R(c, 5 + i, 20 - i, 1, 1 + i * 2, col); R(c, 34 - i, 20 - i, 1, 1 + i * 2, col); }
        R(c, 12, 18, 16, 5, col);
      }
    }));
    return hints[kind];
  }

  const TYPES = {
    jump: ['wetsign', 'bucket', 'boxes', 'barrier'],
    block: ['gurney1', 'gurney2', 'wheelchair', 'cart', 'vending'],
    slide: ['rx', 'lab', 'cardio', 'pedia']
  };

  return { get, hint, medal, TYPES };
})();
