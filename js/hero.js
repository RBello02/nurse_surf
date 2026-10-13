// Protagonista e inseguitrice in pixel art, disegnate via codice.
// L'aspetto della protagonista (frangia, occhi castani, capelli castano chiaro tendenti al biondo)
// e' definito una sola volta qui e in CFG.HERO, cosi' resta identico in menu, gameplay e finale.
const Hero = (() => {
  const H = CFG.HERO;
  const cache = {};

  const OUT = {
    casual:   { top: '#f08fb0', topDark: '#c96a8e', pants: '#3e7bd6', pantsDark: '#27559c', shoe: '#ffffff', shoeDark: '#8c97a1', legSkin: false },
    elegante: { top: '#8a1f3d', topDark: '#5f1329', pants: '#8a1f3d', pantsDark: '#5f1329', shoe: '#1d1d24', shoeDark: '#000000', legSkin: true },
    uniforme: { top: '#2fb5a3', topDark: '#238f80', pants: '#2fb5a3', pantsDark: '#238f80', shoe: '#ffffff', shoeDark: '#8c97a1', legSkin: false }
  };

  // Tabelle per posa: gambe [x, lunghezza], braccia [x, y, h, alzato]
  const POSES = {
    run0:  { L: [5, 6], R: [8, 3], aL: [2, 12, 6, false], aR: [12, 11, 4, false] },
    run1:  { L: [5, 3], R: [8, 6], aL: [2, 11, 4, false], aR: [12, 12, 6, false] },
    jump:  { L: [4, 3], R: [9, 3], aL: [1, 7, 6, true],   aR: [13, 7, 6, true] },
    stand: { L: [5, 6], R: [8, 6], aL: [2, 12, 6, false], aR: [12, 12, 6, false] },
    cheer: { L: [5, 6], R: [8, 6], aL: [1, 6, 7, true],   aR: [13, 6, 7, true] }
  };

  function head(ctx, ox, oy) {
    const r = (x, y, w, h, c) => Px.rect(ctx, ox + x, oy + y, w, h, c);
    // capelli (dietro e ai lati)
    r(4, 2, 8, 1, H.hair);
    r(3, 3, 10, 2, H.hair);
    r(2, 4, 2, 9, H.hair);
    r(12, 4, 2, 9, H.hair);
    r(2, 11, 2, 2, H.hairShade);
    r(12, 11, 2, 2, H.hairShade);
    r(5, 3, 3, 1, '#e3cb97');
    // viso
    r(4, 5, 8, 6, H.skin);
    r(4, 10, 8, 1, H.skinShade);
    // frangia
    r(4, 5, 8, 2, H.hair);
    r(4, 7, 2, 1, H.hair);
    r(10, 7, 2, 1, H.hair);
    r(7, 7, 1, 1, H.hair);
    r(8, 5, 2, 1, '#e3cb97');
    // occhi castani
    r(5, 8, 2, 2, H.eyes);
    r(9, 8, 2, 2, H.eyes);
    r(5, 8, 1, 1, '#ffffff');
    r(9, 8, 1, 1, '#ffffff');
    // guance e bocca
    r(4, 9, 1, 1, '#f1a58e');
    r(11, 9, 1, 1, '#f1a58e');
    r(7, 10, 2, 1, '#c4605a');
    // collo
    r(7, 11, 2, 1, H.skinShade);
  }

  function wreath(ctx, ox, oy) {
    const r = (x, y, w, h, c) => Px.rect(ctx, ox + x, oy + y, w, h, c);
    // foglie d'alloro a cerchio sulla sommita' della testa (i capelli restano visibili)
    for (let x = 4; x <= 11; x++) {
      r(x, 1, 1, 1, x % 2 ? '#2f9e44' : '#3fb858');
      if (x % 2 === 0) r(x, 0, 1, 1, '#1f7a33');
    }
    r(3, 2, 1, 1, '#1f7a33'); r(12, 2, 1, 1, '#1f7a33');
    r(2, 3, 1, 2, '#2f9e44'); r(13, 3, 1, 2, '#3fb858');
    r(2, 5, 1, 1, '#1f7a33'); r(13, 5, 1, 1, '#1f7a33');
    r(7, 0, 2, 1, '#7ee08f');
    // bacche e nastro rosso sul lato
    r(6, 1, 1, 1, '#e0344b'); r(9, 1, 1, 1, '#e0344b');
    r(13, 6, 2, 2, '#e0344b');
    r(14, 8, 1, 4, '#e0344b');
    r(14, 11, 1, 1, '#a82036');
  }

  function leg(ctx, o, x, y, len) {
    const col = o.legSkin ? H.skin : o.pants;
    Px.rect(ctx, x, y, 3, len, col);
    Px.rect(ctx, x, y + len, 4, 2, o.shoe);
    Px.rect(ctx, x, y + len + 1, 4, 1, o.shoeDark);
  }

  function arm(ctx, o, outfit, a) {
    const [x, y, h, up] = a;
    Px.rect(ctx, x, y, 2, h, H.skin);
    if (outfit === 'elegante') return;
    const sh = outfit === 'uniforme' ? 3 : 2;
    const sy = up ? y + h - sh : y;
    Px.rect(ctx, x, sy, 2, sh, o.top);
  }

  function torso(ctx, o, outfit) {
    if (outfit === 'casual') {
      Px.rect(ctx, 4, 12, 8, 6, o.top);
      Px.rect(ctx, 4, 17, 8, 1, o.topDark);
      Px.rect(ctx, 4, 18, 8, 1, o.pants);
      Px.rect(ctx, 7, 14, 2, 2, '#ffe3ee');
    } else if (outfit === 'elegante') {
      Px.rect(ctx, 4, 12, 8, 3, o.top);
      Px.rect(ctx, 4, 15, 8, 1, PAL.gold);
      Px.rect(ctx, 3, 16, 10, 6, o.top);
      Px.rect(ctx, 3, 21, 10, 1, o.topDark);
      Px.rect(ctx, 6, 11, 1, 1, PAL.gold);
      Px.rect(ctx, 9, 11, 1, 1, PAL.gold);
      Px.rect(ctx, 7, 12, 2, 1, PAL.gold);
    } else {
      Px.rect(ctx, 4, 12, 8, 6, o.top);
      Px.rect(ctx, 7, 12, 2, 2, H.skin);
      Px.rect(ctx, 4, 17, 8, 1, o.topDark);
      Px.rect(ctx, 4, 18, 8, 1, o.pantsDark);
      Px.rect(ctx, 8, 18, 1, 1, '#ffffff');
      // fonendoscopio
      Px.rect(ctx, 6, 12, 1, 4, PAL.greyDark);
      Px.rect(ctx, 9, 12, 1, 4, PAL.greyDark);
      Px.rect(ctx, 7, 16, 2, 1, PAL.metal);
      // taschino con croce rossa
      Px.rect(ctx, 10, 14, 3, 3, '#ffffff');
      Px.rect(ctx, 11, 14, 1, 3, PAL.red);
      Px.rect(ctx, 10, 15, 3, 1, PAL.red);
    }
  }

  function drawStanding(ctx, outfit, pose, withWreath) {
    const o = OUT[outfit];
    const p = POSES[pose];
    leg(ctx, o, p.L[0], 19, p.L[1]);
    leg(ctx, o, p.R[0], 19, p.R[1]);
    arm(ctx, o, outfit, p.aL);
    arm(ctx, o, outfit, p.aR);
    torso(ctx, o, outfit);
    head(ctx, 0, 0);
    if (withWreath) wreath(ctx, 0, 0);
  }

  function drawSlide(ctx, outfit, withWreath) {
    const o = OUT[outfit];
    // testa piu' in basso: la protagonista si accovaccia
    const legCol = o.legSkin ? H.skin : o.pants;
    Px.rect(ctx, 3, 14, 10, 2, legCol);
    Px.rect(ctx, 2, 16, 4, 2, o.shoe);
    Px.rect(ctx, 10, 16, 4, 2, o.shoe);
    Px.rect(ctx, 2, 17, 4, 1, o.shoeDark);
    Px.rect(ctx, 10, 17, 4, 1, o.shoeDark);
    Px.rect(ctx, 2, 10, 2, 4, H.skin);
    Px.rect(ctx, 12, 10, 2, 4, H.skin);
    Px.rect(ctx, 4, 9, 8, 5, outfit === 'elegante' ? o.top : o.top);
    if (outfit === 'elegante') Px.rect(ctx, 3, 12, 10, 3, o.top);
    if (outfit === 'uniforme') {
      Px.rect(ctx, 5, 10, 1, 3, PAL.greyDark);
      Px.rect(ctx, 10, 10, 1, 3, PAL.greyDark);
    }
    head(ctx, 0, -2);
    if (withWreath) wreath(ctx, 0, -2);
  }

  // pose: run0, run1, jump, slide, stand, cheer
  function get(outfit, pose, withWreath = false) {
    const key = `${outfit}|${pose}|${withWreath ? 1 : 0}`;
    if (cache[key]) return cache[key];
    const isSlide = pose === 'slide';
    const c = Px.make(16, isSlide ? 19 : 28, (ctx) => {
      if (isSlide) drawSlide(ctx, outfit, withWreath);
      else drawStanding(ctx, outfit, pose, withWreath);
    });
    cache[key] = Px.outlined(c);
    return cache[key];
  }

  // Ritratto grande per il menu: sprite frontale ingrandito
  function draw(ctx, outfit, pose, x, y, scale = 1, opts = {}) {
    const spr = get(outfit, pose, !!opts.wreath);
    const w = spr.width * scale;
    const h = spr.height * scale;
    ctx.drawImage(spr, Math.round(x - w / 2), Math.round(y - h), w, h);
  }

  return { get, draw };
})();

// Infermiera inseguitrice con la gigantesca siringa "PFIZER": caricatura buffa, niente horror.
const Chaser = (() => {
  const cache = {};

  function syringe(ctx, x, y) {
    const r = (a, b, w, h, c) => Px.rect(ctx, x + a, y + b, w, h, c);
    // pollice e stantuffo
    r(0, 2, 2, 5, PAL.metalDark);
    r(2, 3, 6, 3, PAL.metal);
    // alette
    r(8, 0, 2, 9, PAL.metalDark);
    // corpo
    r(10, 1, 28, 7, PAL.ink);
    r(11, 2, 26, 5, '#eaf7ff');
    r(11, 2, 22, 5, '#7fd3ff');
    r(11, 2, 22, 1, '#bfe9ff');
    // scritta PFIZER
    Px.text(ctx, 'PFIZER', x + 12, y + 2, PAL.ink, 1);
    // tacche graduate
    for (let i = 0; i < 6; i++) r(12 + i * 4, 7, 1, 1, PAL.blueDark);
    // punta e ago
    r(38, 3, 3, 3, PAL.metalDark);
    r(41, 4, 10, 1, PAL.metal);
    r(41, 4, 10, 1, '#e9eef2');
    r(50, 4, 1, 1, PAL.white);
  }

  function build(frame) {
    return Px.make(54, 50, (ctx) => {
      const cx = 26;
      const bob = frame === 0 ? 0 : 1;
      const r = (a, b, w, h, c) => Px.rect(ctx, a, b, w, h, c);
      const WH = '#ffffff';
      const SH = '#cfd8de';
      // gambe
      r(cx - 5, 43, 4, frame === 0 ? 4 : 2, '#f4f6f8');
      r(cx + 1, 43, 4, frame === 0 ? 2 : 4, '#f4f6f8');
      r(cx - 6, frame === 0 ? 47 : 45, 5, 2, PAL.blueDark);
      r(cx + 1, frame === 0 ? 45 : 47, 5, 2, PAL.blueDark);
      // gonna / fianchi abbondanti (caricatura)
      r(cx - 10, 37, 20, 6, WH);
      r(cx - 9, 34, 18, 3, WH);
      r(cx - 10, 42, 20, 1, SH);
      r(cx - 3, 38, 1, 4, SH);
      // vita e fiocco
      r(cx - 5, 30, 10, 4, WH);
      r(cx - 5, 32, 10, 1, PAL.red);
      r(cx + 3, 31, 4, 3, PAL.red);
      r(cx + 4, 34, 1, 2, PAL.redDark);
      // spalle e schiena
      r(cx - 8, 25, 16, 5, WH);
      r(cx - 8, 29, 16, 1, SH);
      r(cx - 1, 25, 2, 4, SH);
      // collo
      r(cx - 2, 24, 4, 1, '#f2c9a5');
      // capelli e cuffia
      r(cx - 6, 15, 12, 9, '#4a3224');
      r(cx - 6, 22, 12, 2, '#33211a');
      r(cx + 5, 16 + bob, 3, 8, '#4a3224');
      r(cx + 6, 24 + bob, 2, 2, '#4a3224');
      r(cx - 6, 12, 12, 3, WH);
      r(cx - 6, 14, 12, 1, SH);
      r(cx - 1, 12, 2, 3, PAL.red);
      // braccia alzate che reggono la siringa
      r(cx - 10, 11 - bob, 3, 14, '#f2c9a5');
      r(cx + 7, 11 - bob, 3, 14, '#f2c9a5');
      r(cx - 10, 20, 3, 6, WH);
      r(cx + 7, 20, 3, 6, WH);
      // siringa gigante sopra la testa
      syringe(ctx, 1, 2 - bob);
    });
  }

  function get(frame) {
    if (!cache[frame]) cache[frame] = Px.outlined(build(frame));
    return cache[frame];
  }

  return { get };
})();
