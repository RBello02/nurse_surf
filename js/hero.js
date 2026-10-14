// Martina (protagonista) e l'infermiera inseguitrice, in pixel art ad alta definizione.
// Gli sprite sono disegnati in pixel reali (1 pixel = mezza unita' di progetto) con ellissi e segmenti,
// poi circondati da un contorno scuro. L'aspetto di Martina (frangia laterale, occhi castani, capelli castano scuro
// raccolti) e' definito qui e in CFG.HERO, quindi resta identico in menu, intro, gioco e finale.
const Hero = (() => {
  const H = CFG.HERO;
  const cache = {};
  const HAIR_HI = '#8a6240';
  const OUT = {
    casual:   { top: '#1c1c23', topHi: '#3a3a46', topLo: '#0c0c11', pants: '#1c1c23', pantsHi: '#3a3a46', pantsLo: '#0c0c11', shoe: '#7a1f35', sole: '#2a1a1e', accent: '#ffffff' },
    elegante: { top: '#8f978c', topHi: '#aab1a5', topLo: '#6e766b', pants: '#8f978c', pantsHi: '#aab1a5', pantsLo: '#6e766b', shoe: '#6b2230', sole: '#2a1a1e', accent: '#b33a3a', bag: '#4a4650' },
    uniforme: { top: '#2fb5a3', topHi: '#58d3c1', topLo: '#238f80', pants: '#2a9f8f', pantsHi: '#4fc4b3', pantsLo: '#1f7a6d', shoe: '#ffffff', sole: '#8c97a1', accent: '#e0344b' }
  };

  // Giunti (spalla, gomito, mano / anca, ginocchio, piede) per ogni posa. Canvas 44x80.
  const POSES = {
    stand: { aL: [[14, 36], [12, 46], [12, 55]], aR: [[30, 36], [32, 46], [32, 55]], lL: [[18, 52], [18, 65], [18, 76]], lR: [[26, 52], [26, 65], [26, 76]] },
    run0:  { aL: [[14, 36], [8, 43], [11, 51]],  aR: [[30, 36], [35, 43], [31, 46]], lL: [[18, 52], [15, 63], [13, 75]], lR: [[26, 52], [29, 60], [32, 66]] },
    run1:  { aL: [[14, 36], [9, 43], [13, 46]],  aR: [[30, 36], [36, 43], [33, 51]], lL: [[18, 52], [15, 60], [12, 66]], lR: [[26, 52], [29, 63], [31, 75]] },
    jump:  { aL: [[14, 36], [8, 29], [5, 21]],   aR: [[30, 36], [36, 29], [39, 21]], lL: [[18, 52], [13, 60], [16, 69]], lR: [[26, 52], [31, 58], [28, 67]] },
    cheer: { aL: [[14, 36], [8, 29], [5, 21]],   aR: [[30, 36], [36, 29], [39, 21]], lL: [[18, 52], [18, 65], [18, 76]], lR: [[26, 52], [26, 65], [26, 76]] }
  };

  function limb(ctx, pts, th, col, hiCol) {
    Px.line(ctx, pts[0][0], pts[0][1], pts[1][0], pts[1][1], th, col);
    Px.line(ctx, pts[1][0], pts[1][1], pts[2][0], pts[2][1], th - 1, col);
    if (hiCol) Px.line(ctx, pts[0][0] - 1, pts[0][1], pts[1][0] - 1, pts[1][1], 1, hiCol);
  }

  function shoe(ctx, o, x, y) {
    Px.ell(ctx, x, y - 1, 5, 3, o.shoe);
    ctx.fillStyle = o.sole; ctx.fillRect(x - 5, y + 1, 11, 1);
    if (o.shoe === '#ffffff') { ctx.fillStyle = o.accent; ctx.fillRect(x - 2, y - 2, 4, 1); }
    if (o.shoe === '#6b2230') { ctx.fillStyle = o.shoe; ctx.fillRect(x - 3, y - 3, 8, 3); ctx.fillRect(x + 4, y - 1, 2, 2); } // ballerina a punta
  }

  function legs(ctx, outfit, pose) {
    const o = OUT[outfit], p = POSES[pose];
    for (const key of ['lL', 'lR']) {
      const l = p[key];
      if (outfit === 'elegante') {
        shoe(ctx, o, l[2][0], l[2][1] + 3);   // scarpa sotto: il bordo largo del pantalone la copre
        Px.line(ctx, l[0][0], l[0][1], l[1][0], l[1][1], 9, o.pants);
        Px.line(ctx, l[1][0], l[1][1], l[2][0], l[2][1] - 3, 11, o.pants);
        Px.line(ctx, l[0][0] - 2, l[0][1], l[1][0] - 2, l[1][1], 1, o.pantsHi);
        Px.line(ctx, l[1][0] + 2, l[1][1], l[2][0] + 2, l[2][1] - 3, 1, o.pantsLo);
      } else if (outfit === 'casual') {
        // pantalone baloon nero: largo in alto, stretto alla caviglia, scarpe bordeaux che spuntano
        shoe(ctx, o, l[2][0], l[2][1] + 3);
        Px.line(ctx, l[0][0], l[0][1], l[1][0], l[1][1], 11, o.pants);
        Px.line(ctx, l[1][0], l[1][1], l[2][0], l[2][1] - 5, 9, o.pants);
        Px.line(ctx, l[0][0] - 3, l[0][1] + 1, l[1][0] - 3, l[1][1], 1, o.pantsHi);
        Px.ell(ctx, l[2][0], l[2][1] - 4, 4, 2, o.pantsLo);     // fondo gamba arricciato
      } else {
        limb(ctx, l, 7, o.pants, o.pantsHi);
        shoe(ctx, o, l[2][0], l[2][1] + 3);
      }
    }
  }

  function arms(ctx, outfit, pose) {
    const o = OUT[outfit], p = POSES[pose];
    for (const key of ['aL', 'aR']) {
      const a = p[key];
      limb(ctx, a, 5, H.skin, '#f7d9bd');
      // manica
      if (outfit === 'uniforme') Px.line(ctx, a[0][0], a[0][1], a[0][0] + (a[1][0] - a[0][0]) * 0.55, a[0][1] + (a[1][1] - a[0][1]) * 0.55, 7, o.top);
      else if (outfit === 'casual') {   // manica lunga del blazer fino al polso, con polsino bianco
        Px.line(ctx, a[0][0], a[0][1], a[1][0], a[1][1], 7, o.top);
        const wx = a[1][0] + (a[2][0] - a[1][0]) * 0.8, wy = a[1][1] + (a[2][1] - a[1][1]) * 0.8;
        Px.line(ctx, a[1][0], a[1][1], wx, wy, 6, o.top);
        Px.ell(ctx, wx, wy, 3, 2, '#ffffff');
      }
      else if (outfit === 'elegante') Px.line(ctx, a[0][0], a[0][1], a[1][0], a[1][1], 7, o.top);  // manica lunga fino al gomito
      // mano
      Px.ell(ctx, a[2][0], a[2][1], 3, 3, H.skin);
      if (outfit === 'elegante' && key === 'aR') { const bx = a[1][0] + (a[2][0] - a[1][0]) * 0.8, by = a[1][1] + (a[2][1] - a[1][1]) * 0.8; Px.line(ctx, bx - 2, by, bx + 2, by, 1, '#e4e8ec'); }  // bracciale
    }
  }

  function torso(ctx, outfit) {
    const o = OUT[outfit];
    if (outfit === 'casual') {
      // blazer nero aperto su camicia bianca
      Px.bev(ctx, 13, 33, 18, 20, o.top, o.topHi, o.topLo);
      for (let i = 0; i < 11; i++) { ctx.fillStyle = '#ffffff'; const hw = Math.max(1, 3 - (i > 6 ? i - 6 : 0)); ctx.fillRect(22 - hw, 33 + i, hw * 2 + 1, 1); }  // camicia
      ctx.fillStyle = '#d3dce2'; ctx.fillRect(22, 35, 1, 8);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(17, 33, 4, 2); ctx.fillRect(24, 33, 4, 2);               // colletto
      ctx.fillStyle = H.skin; ctx.fillRect(20, 33, 5, 1);
      Px.line(ctx, 18, 34, 21, 45, 1, o.topHi); Px.line(ctx, 27, 34, 23, 45, 1, o.topHi);               // risvolti
      ctx.fillStyle = o.topLo; ctx.fillRect(14, 47, 6, 1); ctx.fillRect(25, 47, 6, 1);                 // tasche
      ctx.fillStyle = '#c8cfd6'; ctx.fillRect(22, 46, 1, 1);                                           // bottone
      ctx.fillStyle = o.topLo; ctx.fillRect(13, 51, 18, 2);
    } else if (outfit === 'elegante') {
      // tuta salvia con colletto, bottoni, tracolla rossa e borsetta
      Px.bev(ctx, 13, 33, 18, 20, o.top, o.topHi, o.topLo);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = H.skin; ctx.fillRect(19 + i, 33 + i, 6 - i * 2, 1); }   // scollo a V
      ctx.fillStyle = o.topHi; ctx.fillRect(17, 33, 4, 3); ctx.fillRect(24, 33, 4, 3);                       // colletto
      ctx.fillStyle = o.topLo; ctx.fillRect(18, 36, 2, 1); ctx.fillRect(25, 36, 2, 1);
      ctx.fillStyle = o.topLo; for (let y = 39; y < 52; y += 4) ctx.fillRect(22, y, 1, 2);                  // bottoni
      ctx.fillStyle = o.topLo; ctx.fillRect(13, 46, 18, 2);                                                  // arricciatura in vita
      ctx.fillRect(15, 39, 5, 1); ctx.fillRect(25, 39, 5, 1);                                                // tasche
      Px.line(ctx, 16, 34, 29, 52, 2, o.accent);                                                             // tracolla rossa
      Px.rect(ctx, 26, 49, 8, 7, '#10151f'); Px.rect(ctx, 27, 50, 6, 5, o.bag);                              // borsetta
      ctx.fillStyle = '#d8dde2'; ctx.fillRect(29, 50, 2, 1);
    } else {
      Px.bev(ctx, 13, 33, 18, 20, o.top, o.topHi, o.topLo);
      // scollo a V
      for (let i = 0; i < 4; i++) { ctx.fillStyle = H.skin; ctx.fillRect(19 + i, 33 + i, 6 - i * 2, 1); }
      ctx.fillStyle = o.topLo; ctx.fillRect(13, 52, 18, 3);            // vita pantaloni
      ctx.fillStyle = '#ffffff'; ctx.fillRect(21, 53, 2, 2);            // laccio
      // taschino con croce rossa
      ctx.fillStyle = '#ffffff'; ctx.fillRect(25, 41, 6, 6);
      ctx.fillStyle = o.accent; ctx.fillRect(27, 42, 2, 4); ctx.fillRect(26, 43, 4, 2);
      // fonendoscopio
      Px.line(ctx, 17, 33, 16, 41, 1, '#46515c');
      Px.line(ctx, 27, 33, 25, 40, 1, '#46515c');
      Px.line(ctx, 16, 41, 21, 48, 1, '#46515c');
      Px.line(ctx, 25, 40, 22, 48, 1, '#46515c');
      Px.ell(ctx, 21, 49, 2, 2, '#c4ccd3');
    }
  }

  function wreath(ctx) {
    // corona d'alloro attorno alla testa, i capelli restano visibili
    const greens = ['#2f9e44', '#3fb858', '#1f7a33'];
    for (let i = 0; i < 22; i++) {
      const a = Math.PI * (1.02 + (i / 21) * 0.96);
      const x = 22 + Math.cos(a) * 12, y = 14 + Math.sin(a) * 10;
      ctx.fillStyle = greens[i % 3];
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 2);
      if (i % 5 === 2) { ctx.fillStyle = '#e0344b'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    }
    ctx.fillStyle = '#7ee08f'; ctx.fillRect(21, 3, 3, 1);
    // nastro
    ctx.fillStyle = '#e0344b'; ctx.fillRect(33, 14, 3, 3); ctx.fillRect(34, 17, 2, 9);
    ctx.fillStyle = '#a82036'; ctx.fillRect(34, 24, 2, 2); ctx.fillRect(34, 17, 1, 8);
  }

  function head(ctx, withWreath) {
    // chignon / capelli raccolti dietro la testa, ciocche ondulate che incorniciano il viso
    Px.ell(ctx, 22, 16, 13, 13, H.hair);
    Px.ell(ctx, 22, 4, 7, 5, H.hair);                       // chignon alto
    ctx.fillStyle = HAIR_HI; ctx.fillRect(19, 2, 4, 1);
    ctx.fillStyle = H.hair; ctx.fillRect(10, 18, 5, 14); ctx.fillRect(30, 18, 5, 14);   // ciocche ai lati del viso
    ctx.fillStyle = H.hairShade; ctx.fillRect(10, 28, 5, 4); ctx.fillRect(30, 28, 5, 4);
    ctx.fillStyle = H.hair; ctx.fillRect(11, 32, 3, 2); ctx.fillRect(31, 32, 3, 2);
    ctx.fillStyle = HAIR_HI; ctx.fillRect(12, 20, 1, 8); ctx.fillRect(32, 20, 1, 8);
    // viso
    Px.ell(ctx, 22, 20, 9, 10, H.skin);
    ctx.fillStyle = H.skinShade; ctx.fillRect(16, 28, 12, 1);
    Px.ell(ctx, 22, 31, 3, 3, H.skinShade);               // collo
    // cappello di capelli e frangia
    Px.ell(ctx, 22, 13, 11, 8, H.hair);
    for (let x = 12; x <= 32; x++) {
      const len = 5 + ((x * 7) % 4);
      ctx.fillStyle = (x % 3 === 0) ? HAIR_HI : H.hair;
      ctx.fillRect(x, 10, 1, len + 1);
      if (x % 4 === 1) { ctx.fillStyle = H.hairShade; ctx.fillRect(x, 10 + len, 1, 1); }
    }
    ctx.fillStyle = HAIR_HI; ctx.fillRect(15, 7, 7, 1); ctx.fillRect(19, 6, 5, 1);
    // frangia laterale: piu' lunga a sinistra, spostata di lato
    for (let i = 0; i < 6; i++) { ctx.fillStyle = H.hair; ctx.fillRect(12 + i, 15 + i, 1, 2); }
    ctx.fillStyle = H.hair; ctx.fillRect(12, 14, 6, 3);
    // orecchini d'argento
    ctx.fillStyle = '#e4e8ec'; ctx.fillRect(13, 27, 2, 2); ctx.fillRect(30, 27, 2, 2);
    // sopracciglia
    ctx.fillStyle = '#4a2f20'; ctx.fillRect(15, 18, 5, 1); ctx.fillRect(25, 18, 5, 1);
    // occhi castani
    for (const ex of [16, 26]) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex, 20, 5, 5);
      ctx.fillStyle = H.eyes;   ctx.fillRect(ex + 1, 20, 3, 5);
      ctx.fillStyle = '#3a2210'; ctx.fillRect(ex + 1, 22, 3, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex + 1, 20, 1, 1);
      ctx.fillStyle = '#3a2210'; ctx.fillRect(ex, 19, 5, 1);   // ciglia
    }
    // naso, guance, bocca
    ctx.fillStyle = H.skinShade; ctx.fillRect(22, 25, 1, 2);
    Px.ell(ctx, 16, 27, 2, 1, '#f1a58e'); Px.ell(ctx, 29, 27, 2, 1, '#f1a58e');
    ctx.fillStyle = '#c4605a'; ctx.fillRect(19, 29, 1, 1); ctx.fillRect(20, 30, 5, 1); ctx.fillRect(25, 29, 1, 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(21, 30, 3, 1);
    if (withWreath) wreath(ctx);
  }

  function drawStanding(ctx, outfit, pose, withWreath) {
    legs(ctx, outfit, pose);
    torso(ctx, outfit);
    arms(ctx, outfit, pose);
    head(ctx, withWreath);
  }

  // Scivolata: Martina si accovaccia e scivola sotto il cartello (canvas 60x52)
  function drawSlide(ctx, outfit, withWreath) {
    const o = OUT[outfit];
    ctx.save();
    ctx.translate(8, -4);          // la testa scende
    ctx.save();
    ctx.translate(0, 0);
    // gambe piegate
    const legCol = o.pants;
    Px.line(ctx, 15, 42, 8, 47, 7, legCol); Px.line(ctx, 29, 42, 38, 47, 7, legCol);
    shoe(ctx, o, 6, 51); shoe(ctx, o, 40, 51);
    // busto inclinato in avanti
    Px.bev(ctx, 12, 32, 20, 13, o.top, o.topHi, o.topLo);
    if (outfit === 'casual') { ctx.fillStyle = '#ffffff'; ctx.fillRect(19, 32, 6, 7); }
    if (outfit === 'uniforme') { ctx.fillStyle = '#ffffff'; ctx.fillRect(26, 36, 4, 4); ctx.fillStyle = o.accent; ctx.fillRect(27, 37, 2, 2); }
    // braccia in avanti
    Px.line(ctx, 14, 36, 8, 42, 5, H.skin); Px.ell(ctx, 7, 43, 3, 3, H.skin);
    Px.line(ctx, 30, 36, 36, 42, 5, H.skin); Px.ell(ctx, 37, 43, 3, 3, H.skin);
    ctx.restore();
    head(ctx, withWreath);
    ctx.restore();
  }

  // pose: stand, run0, run1, jump, cheer, slide
  function get(outfit, pose, withWreath = false) {
    const key = `${outfit}|${pose}|${withWreath ? 1 : 0}`;
    if (cache[key]) return cache[key];
    const slide = pose === 'slide';
    const c = Px.make(slide ? 60 : 44, slide ? 52 : 80, (ctx) => {
      if (slide) drawSlide(ctx, outfit, withWreath);
      else drawStanding(ctx, outfit, pose, withWreath);
    });
    cache[key] = Px.outlined(c);
    return cache[key];
  }

  // (x, yBottom) = centro-base in unita' di progetto; scale 1 = dimensione di gioco
  function draw(ctx, outfit, pose, x, yBottom, scale = 1, opts = {}) {
    Px.blit(ctx, get(outfit, pose, !!opts.wreath), x, yBottom, scale);
  }

  return { get, draw };
})();

// Infermiera inseguitrice (formosa, buffa): con la gigantesca siringa "PFIZER" sopra la testa.
// view 'back' = vista da dietro durante la corsa; 'front' = vista frontale (scena iniziale e finale).
const Chaser = (() => {
  const cache = {};
  const WHITE = '#ffffff', SH = '#d3dce2', SH2 = '#aab6bf';
  const HAIR = '#5a3a28', HAIR_HI = '#7a5238';

  function syringe(c, x, y) {
    // stantuffo e pollice
    Px.bev(c, x, y + 4, 5, 16, PAL.metal, '#ffffff', PAL.metalDark);
    Px.bev(c, x + 5, y + 9, 18, 6, PAL.metal, '#ffffff', PAL.metalDark);
    // alette
    Px.bev(c, x + 23, y, 5, 24, PAL.metal, '#ffffff', PAL.metalDark);
    // corpo trasparente
    c.fillStyle = PAL.ink; c.fillRect(x + 28, y + 2, 112, 20);
    c.fillStyle = '#eaf7ff'; c.fillRect(x + 29, y + 3, 110, 18);
    c.fillStyle = '#7fd3ff'; c.fillRect(x + 29, y + 7, 92, 14);
    c.fillStyle = '#bfe9ff'; c.fillRect(x + 29, y + 3, 110, 3);
    c.fillStyle = '#5ab8ec'; c.fillRect(x + 29, y + 19, 92, 2);
    // tacche graduate
    for (let i = 0; i < 12; i++) { c.fillStyle = PAL.blueDark; c.fillRect(x + 34 + i * 9, y + 3, 1, i % 2 ? 3 : 5); }
    // scritta PFIZER
    Px.text(c, 'PFIZER', x + 38, y + 6, PAL.ink, 2);
    // punta e ago
    Px.bev(c, x + 140, y + 7, 8, 8, PAL.metal, '#ffffff', PAL.metalDark);
    c.fillStyle = '#e9eef2'; c.fillRect(x + 148, y + 10, 34, 2);
    c.fillStyle = PAL.metalDark; c.fillRect(x + 148, y + 12, 34, 1);
    c.fillStyle = '#ffffff'; c.fillRect(x + 181, y + 10, 2, 2);
    // goccia sull'ago
    c.fillStyle = '#7fd3ff'; c.fillRect(x + 181, y + 14, 2, 3);
  }

  function build(view, frame) {
    const W = 216, Ht = 190;
    const bob = frame ? 2 : 0;
    return Px.make(W, Ht, (c) => {
      const cx = 108;
      // ---------- gambe e scarpe ----------
      const legY = 142;
      const lp = frame ? [0, 4] : [4, 0];
      for (const [dx, off] of [[-22, lp[0]], [22, lp[1]]]) {
        Px.bev(c, cx + dx - 8, legY, 16, 32 - off, '#f4f6f8', WHITE, SH);
        Px.ell(c, cx + dx, legY + 34 - off, 11, 5, PAL.blueDark);
        c.fillStyle = PAL.blue; c.fillRect(cx + dx - 9, legY + 31 - off, 18, 2);
      }
      // ---------- gonna / fianchi abbondanti ----------
      Px.ell(c, cx, 132, 52, 22, WHITE);
      Px.ell(c, cx, 128, 46, 20, WHITE);
      c.fillStyle = SH; c.fillRect(cx - 52, 140, 104, 6);
      c.fillStyle = SH2; for (let i = -40; i <= 40; i += 20) c.fillRect(cx + i, 134, 1, 12);
      // ---------- vita ----------
      Px.ell(c, cx, 108, 30, 14, WHITE);
      c.fillStyle = PAL.red; c.fillRect(cx - 30, 112, 60, 5);
      c.fillStyle = PAL.redDark; c.fillRect(cx - 30, 116, 60, 1);
      // ---------- busto ----------
      Px.ell(c, cx, 92, 38, 22, WHITE);
      c.fillStyle = SH; c.fillRect(cx - 38, 106, 76, 3);
      // ---------- braccia alzate che reggono la siringa ----------
      for (const sx of [-1, 1]) {
        const ax = cx + sx * 44;
        Px.line(c, ax, 96 - bob, ax + sx * 8, 54 - bob, 12, H_SKIN);
        Px.line(c, ax, 96 - bob, ax, 80 - bob, 15, WHITE);       // manica
        Px.ell(c, ax + sx * 8, 50 - bob, 8, 8, H_SKIN);          // mano
      }
      // ---------- testa ----------
      const hy = 64 + bob;
      if (view === 'back') Px.ell(c, cx, hy + 4, 26, 28, HAIR);   // capelli
      else {                                                      // vista frontale: capelli solo attorno al viso (niente 'barba')
        Px.ell(c, cx, hy - 2, 25, 21, HAIR);
        c.fillStyle = HAIR; c.fillRect(cx - 26, hy - 2, 7, 22); c.fillRect(cx + 19, hy - 2, 7, 22);
        c.fillStyle = HAIR_HI; c.fillRect(cx - 24, hy + 2, 1, 12); c.fillRect(cx + 23, hy + 2, 1, 12);
      }
      if (view === 'back') {
        c.fillStyle = HAIR_HI; c.fillRect(cx - 14, hy - 12, 20, 2); c.fillRect(cx + 4, hy + 6, 14, 2);
        Px.ell(c, cx, hy + 26, 20, 8, HAIR);                     // codino pesante dietro
      } else {
        Px.ell(c, cx, hy + 6, 20, 22, '#f2c9a5');                // viso
        Px.ell(c, cx - 11, hy + 14, 4, 2, '#f1a58e'); Px.ell(c, cx + 11, hy + 14, 4, 2, '#f1a58e');
        for (const ex of [-9, 5]) {                              // occhi con ciglia e sguardo furbo
          c.fillStyle = '#ffffff'; c.fillRect(cx + ex, hy + 2, 8, 8);
          c.fillStyle = '#3a2210'; c.fillRect(cx + ex + 2, hy + 3, 5, 7);
          c.fillStyle = '#ffffff'; c.fillRect(cx + ex + 2, hy + 3, 2, 2);
          c.fillStyle = PAL.ink; c.fillRect(cx + ex - 1, hy + 1, 10, 1);
        }
        Px.line(c, cx - 11, hy - 1, cx - 3, hy - 4, 2, '#3a2418');   // sopracciglia alzate: furbetta, non cattiva
        Px.line(c, cx + 11, hy - 1, cx + 3, hy - 4, 2, '#3a2418');
        c.fillStyle = '#c4605a'; c.fillRect(cx - 7, hy + 16, 14, 2); c.fillRect(cx - 9, hy + 14, 2, 2); c.fillRect(cx + 7, hy + 14, 2, 2);
        c.fillStyle = '#ffffff'; c.fillRect(cx - 5, hy + 18, 10, 3);  // sorriso a denti
        c.fillStyle = '#c4605a'; c.fillRect(cx - 5, hy + 21, 10, 1);
        c.fillStyle = '#e0a98a'; c.fillRect(cx - 1, hy + 10, 2, 3);
      }
      // cuffia da infermiera
      Px.ell(c, cx, hy - 14, 24, 11, WHITE);
      c.fillStyle = SH; c.fillRect(cx - 24, hy - 6, 48, 3);
      c.fillStyle = PAL.red; c.fillRect(cx - 3, hy - 22, 6, 12); c.fillRect(cx - 6, hy - 19, 12, 6);
      // ---------- dettagli ----------
      if (view === 'back') {
        c.fillStyle = SH; c.fillRect(cx, 74, 1, 40);
        Px.ell(c, cx, 118, 12, 6, PAL.red);                      // fiocco sul retro
        c.fillStyle = PAL.redDark; c.fillRect(cx - 12, 118, 24, 1);
      } else {
        c.fillStyle = SH2; for (let y = 82; y < 112; y += 8) c.fillRect(cx - 1, y, 2, 2);
        c.fillStyle = '#ffffff'; c.fillRect(cx + 14, 88, 12, 9);  // targhetta
        c.fillStyle = PAL.red; c.fillRect(cx + 19, 89, 2, 7); c.fillRect(cx + 16, 91, 8, 2);
      }
      // ---------- siringa gigante ----------
      syringe(c, 6, 4 - bob);
    });
  }

  const H_SKIN = '#f2c9a5';

  function get(frame, view = 'back') {
    const key = view + frame;
    if (!cache[key]) cache[key] = Px.outlined(build(view, frame ? 1 : 0));
    return cache[key];
  }

  // Disegna l'infermiera: x = centro del corpo, yBottom = base dei piedi, k = scala
  function draw(ctx, x, yBottom, k = 1, frame = 0, view = 'back') {
    Px.blit(ctx, get(frame, view), x - 0, yBottom, k);
  }

  return { get, draw };
})();
