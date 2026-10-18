// Martina (protagonista) e l'infermiera inseguitrice, in pixel art ad alta definizione.
// Gli sprite sono disegnati in pixel reali (1 pixel = mezza unita' di progetto) con ellissi e segmenti,
// poi circondati da un contorno scuro. L'aspetto di Martina (frangia laterale, occhi castani, capelli castano scuro
// raccolti) e' definito qui e in CFG.HERO, quindi resta identico in menu, intro, gioco e finale.
const Hero = (() => {
  const H = CFG.HERO;
  const cache = {};
  const HAIR_HI = '#8a6240';
  const GREEN = { skin: '#62c24c', hi: '#9be873', shade: '#3b8f35', deep: '#276a2b', line: '#1d4f22' };
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
    run2:  { aL: [[14, 36], [10, 44], [12, 51]], aR: [[30, 36], [34, 44], [32, 50]], lL: [[18, 52], [19, 64], [19, 76]], lR: [[26, 52], [27, 60], [24, 67]] },
    run3:  { aL: [[14, 36], [10, 44], [12, 50]], aR: [[30, 36], [34, 44], [32, 51]], lL: [[18, 52], [17, 60], [20, 67]], lR: [[26, 52], [25, 64], [25, 76]] },
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
      // blazer nero con scollo a V profondo (niente camicia), risvolti e taschini
      Px.bev(ctx, 13, 33, 18, 20, o.top, o.topHi, o.topLo);
      for (let i = 0; i < 11; i++) { const hw = 5 - Math.floor(i * 0.5); if (hw < 0) break; ctx.fillStyle = H.skin; ctx.fillRect(22 - hw, 33 + i, hw * 2 + 1, 1); }
      ctx.fillStyle = H.skinShade; ctx.fillRect(22, 43, 1, 1);
      Px.line(ctx, 16, 33, 22, 45, 1, o.topHi); Px.line(ctx, 28, 33, 22, 45, 1, o.topHi);                // risvolti
      ctx.fillStyle = o.topLo; ctx.fillRect(14, 47, 6, 1); ctx.fillRect(25, 47, 6, 1);                 // tasche
      ctx.fillStyle = '#c8cfd6'; ctx.fillRect(22, 46, 1, 1);                                           // bottone
      ctx.fillStyle = o.topLo; ctx.fillRect(13, 51, 18, 2);
      // cintura bordeaux in vita con fibbia dorata
      ctx.fillStyle = '#7a1f35'; ctx.fillRect(13, 45, 18, 3);
      ctx.fillStyle = '#a63350'; ctx.fillRect(13, 45, 18, 1);
      ctx.fillStyle = '#4e1222'; ctx.fillRect(13, 47, 18, 1);
      ctx.fillStyle = '#f6c344'; ctx.fillRect(20, 44, 5, 5);
      ctx.fillStyle = '#7a1f35'; ctx.fillRect(21, 45, 3, 3);
      ctx.fillStyle = '#fff3b0'; ctx.fillRect(20, 44, 5, 1);
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

  function head(ctx, withWreath, angry) {
    const g = ctx;
    const hen = angry === 'hen'; if (hen) angry = false;
    const SK = angry ? GREEN.skin : H.skin, SKS = angry ? GREEN.shade : H.skinShade, SKH = angry ? GREEN.hi : '#f7d9bd';
    const path = (fn, fill, stroke, lw) => { g.beginPath(); fn(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } };
    // capelli raccolti dietro la testa, chignon alto, ciocche che incorniciano il viso
    Px.ell(g, 22, 16, 13, 13.5, H.hair);
    Px.ell(g, 22, 4.5, 7, 5.5, H.hair);
    Px.ell(g, 20, 3.5, 3.5, 1.6, HAIR_HI);
    path(() => { g.moveTo(10.5, 17); g.quadraticCurveTo(8.5, 28, 11.5, 35); g.quadraticCurveTo(14, 33, 15, 24); g.lineTo(15, 17); g.closePath(); }, H.hair);
    path(() => { g.moveTo(33.5, 17); g.quadraticCurveTo(35.5, 28, 32.5, 35); g.quadraticCurveTo(30, 33, 29, 24); g.lineTo(29, 17); g.closePath(); }, H.hair);
    path(() => { g.moveTo(11.6, 24); g.quadraticCurveTo(10.8, 30, 12.2, 34); }, null, H.hairShade, 1.2);
    path(() => { g.moveTo(32.4, 24); g.quadraticCurveTo(33.2, 30, 31.8, 34); }, null, H.hairShade, 1.2);
    path(() => { g.moveTo(13, 21); g.quadraticCurveTo(12.3, 26, 13, 30); }, null, HAIR_HI, 0.7);
    // collo e viso
    Px.ell(g, 22, 31, 3.2, 3.2, SKS);
    Px.ell(g, 22, 20.5, 9, 10.2, SK);
    Px.ell(g, 26.5, 23, 3.6, 7, SKS); Px.ell(g, 22, 20.2, 8.4, 10, SK); Px.ell(g, 22, 18.5, 7, 7.5, SKH);   // luce e ombra sul volto
    Px.ell(g, 22, 18.6, 6.6, 7.0, SK);
    // frangia laterale morbida, piu' lunga a sinistra
    Px.ell(g, 22, 12.5, 11.5, 7.5, H.hair);
    path(() => { g.moveTo(10.6, 12); g.lineTo(33.4, 12); g.lineTo(33.4, 16.5); g.quadraticCurveTo(27, 15.2, 21.5, 18.6); g.quadraticCurveTo(15.5, 22.2, 11.2, 22.6); g.closePath(); }, H.hair);
    path(() => { g.moveTo(13, 14); g.quadraticCurveTo(18, 14.5, 22, 17.5); }, null, HAIR_HI, 0.8);
    path(() => { g.moveTo(24, 9); g.quadraticCurveTo(29, 10, 31.5, 13.5); }, null, HAIR_HI, 0.8);
    path(() => { g.moveTo(14.5, 18.5); g.quadraticCurveTo(17, 20.3, 19.5, 19.8); }, null, H.hairShade, 0.8);
    // orecchini d'argento
    Px.ell(g, 13.4, 28.3, 1, 1.4, '#eef2f5'); Px.ell(g, 30.6, 28.3, 1, 1.4, '#eef2f5');
    // occhi castani, ciglia, sopracciglia
    for (const [cx, side] of [[17.4, -1], [26.6, 1]]) {
      Px.ell(g, cx, 22.4, 2.7, 2.5, '#ffffff');
      Px.ell(g, cx, 22.6, 2.0, 2.3, H.eyes);
      Px.ell(g, cx, 22.8, 1.1, 1.4, '#1a0f08');
      Px.ell(g, cx - 0.7, 21.7, 0.7, 0.7, '#ffffff');
      path(() => { g.moveTo(cx - 2.9, 21.6); g.quadraticCurveTo(cx, 19.6, cx + 2.9, 21.6); }, null, '#2a1810', 0.9);
      path(() => { g.moveTo(cx + side * 2.8, 21.4); g.lineTo(cx + side * 3.8, 20.4); }, null, '#2a1810', 0.8);
    }
    if (angry) {
      path(() => { g.moveTo(13.6, 16.6); g.lineTo(20.8, 20.2); }, null, '#2a1810', 1.8);
      path(() => { g.moveTo(30.4, 16.6); g.lineTo(23.2, 20.2); }, null, '#2a1810', 1.8);
    } else {
    path(() => { g.moveTo(14.2, 18.4); g.quadraticCurveTo(17, 16.3, 20.4, 17.6); }, null, '#3b2417', 1.0);
    path(() => { g.moveTo(23.6, 17.6); g.quadraticCurveTo(27, 16.3, 29.8, 18.4); }, null, '#3b2417', 1.0);
    }
    // naso, guance, bocca sorridente
    path(() => { g.moveTo(22.3, 22.5); g.quadraticCurveTo(21.6, 25, 22.8, 25.6); }, null, SKS, 0.7);
    if (angry) {                                                         // urlo: bocca spalancata con i denti
      path(() => { g.moveTo(17.2, 27.4); g.quadraticCurveTo(22, 26.4, 26.8, 27.4); g.quadraticCurveTo(26, 33.6, 22, 33.8); g.quadraticCurveTo(18, 33.6, 17.2, 27.4); g.closePath(); }, '#4a0d12', '#1f1a17', 0.8);
      g.fillStyle = '#ffffff'; g.fillRect(18.6, 27.4, 6.8, 1.8); g.fillRect(19.4, 31.8, 5.2, 1.3);
      Px.ell(g, 22, 32.2, 2.2, 1.1, '#b3263e');
      path(() => { g.moveTo(15, 24.6); g.quadraticCurveTo(14.2, 26.4, 15.6, 27.6); }, null, SKS, 0.7);
      path(() => { g.moveTo(29, 24.6); g.quadraticCurveTo(29.8, 26.4, 28.4, 27.6); }, null, SKS, 0.7);
    } else {
    Px.ell(g, 16.2, 26.6, 2.3, 1.3, 'rgba(241,140,130,0.55)'); Px.ell(g, 28.2, 26.6, 2.3, 1.3, 'rgba(241,140,130,0.55)');
    path(() => { g.moveTo(18.8, 28.8); g.quadraticCurveTo(22.2, 31.6, 25.8, 28.8); g.quadraticCurveTo(22.2, 29.8, 18.8, 28.8); }, '#ffffff', '#b4504f', 0.8);
    }
    if (hen) {                                                           // cresta, becco e bargigli da gallina
      for (const [x, y, r] of [[15.5, 3.2, 3.2], [19.4, 0.8, 3.6], [24, 0.2, 3.8], [28.4, 1.8, 3.4], [31.4, 4.6, 2.6]]) { Px.ell(g, x, y + 1, r, r, '#a82036'); Px.ell(g, x, y, r, r, '#e0344b'); Px.ell(g, x - 0.8, y - 0.9, r * 0.4, r * 0.35, '#ff8a9a'); }
      path(() => { g.moveTo(17.2, 24.4); g.lineTo(26.8, 24.4); g.quadraticCurveTo(25.4, 29.4, 22, 32.4); g.quadraticCurveTo(18.6, 29.4, 17.2, 24.4); g.closePath(); }, '#f7a531', '#a8661a', 0.8);
      path(() => { g.moveTo(17.8, 25.4); g.lineTo(26.2, 25.4); }, null, '#ffd27a', 0.8);
      path(() => { g.moveTo(18.6, 27.8); g.quadraticCurveTo(22, 29.2, 25.4, 27.8); }, null, '#a8661a', 0.6);
      Px.ell(g, 22, 34.6, 2.2, 3, '#e0344b'); Px.ell(g, 21.4, 33.6, 0.7, 1.1, '#ff8a9a');
      path(() => { g.moveTo(14.2, 18.4); g.lineTo(20.4, 17.2); }, null, '#3b2417', 1.4); path(() => { g.moveTo(29.8, 18.4); g.lineTo(23.6, 17.2); }, null, '#3b2417', 1.4);   // sopracciglia offese
    }
    if (withWreath) wreath(ctx);
  }

  function drawStanding(ctx, outfit, pose, withWreath) {
    legs(ctx, outfit, pose);
    torso(ctx, outfit);
    arms(ctx, outfit, pose);
    head(ctx, withWreath);
  }

  // Martina trasformata: gigante, muscolosa, pelle verde, vestiti strappati (canvas 90x100)
  function drawBig(ctx, outfit, withWreath) {
    const o = OUT[outfit], G = GREEN, cx = 45;
    ctx.save(); ctx.translate(10, 0);
    const E = (x, y, rx, ry, c) => Px.ell(ctx, x, y, rx, ry, c);
    const arcLine = (x0, y0, x1, y1, qx, qy, w, c) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(qx, qy, x1, y1); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); };
    // piedi nudi (le scarpe sono saltate) e polpacci
    for (const sd of [-1, 1]) {
      const x = cx + sd * 12;
      Px.line(ctx, x, 86, x + sd * 1, 95, 13, G.skin);
      Px.line(ctx, x - 4, 86, x - 4, 95, 2, G.hi);
      E(x + sd * 1, 97, 10, 3.6, G.skin); E(x + sd * 1, 98.2, 10, 1.8, G.shade);
      for (let i = -1; i <= 1; i++) E(x + sd * 1 + i * 3.6 + sd * 3, 98, 1.4, 1.4, G.hi);   // dita
    }
    // pantaloni neri strappati al ginocchio: cosce enormi
    for (const sd of [-1, 1]) {
      const x = cx + sd * 11.5;
      Px.line(ctx, x, 70, x + sd * 1.5, 86, 22, o.pants);
      Px.line(ctx, x - 6, 71, x - 6 + sd * 1, 85, 2, o.pantsHi);
      Px.line(ctx, x + 7, 72, x + 7, 86, 2, o.pantsLo);
      ctx.fillStyle = o.pants;                                                              // bordo sfilacciato
      for (let i = -9; i <= 9; i += 4.5) { ctx.beginPath(); ctx.moveTo(x + i - 2.2, 85); ctx.lineTo(x + i + 2.2, 85); ctx.lineTo(x + i + (i % 9 ? 1 : -1), 90 + ((i * 7) & 3)); ctx.closePath(); ctx.fill(); }
    }
    // torso a V: spalle larghissime, vita stretta
    ctx.beginPath(); ctx.moveTo(8, 47); ctx.quadraticCurveTo(14, 38, 31, 39); ctx.lineTo(59, 39); ctx.quadraticCurveTo(76, 38, 82, 47);
    ctx.quadraticCurveTo(76, 64, 62, 72); ctx.lineTo(28, 72); ctx.quadraticCurveTo(14, 64, 8, 47); ctx.closePath(); ctx.fillStyle = G.skin; ctx.fill();
    ctx.beginPath(); ctx.moveTo(60, 40); ctx.quadraticCurveTo(76, 40, 82, 47); ctx.quadraticCurveTo(77, 63, 63, 72); ctx.lineTo(70, 72); ctx.quadraticCurveTo(80, 62, 83, 48); ctx.closePath(); ctx.fillStyle = G.shade; ctx.fill();
    E(cx, 43, 21, 7, G.skin); E(cx - 13, 41.5, 9, 4.5, G.hi);  E(cx + 13, 41.5, 9, 4.5, G.skin);                              // trapezi
    // pettorali
    for (const sd of [-1, 1]) {
      E(cx + sd * 12, 55, 13, 9.5, G.skin); E(cx + sd * 11, 52.8, 10, 6, sd < 0 ? G.hi : G.skin);
      arcLine(cx + sd * 1, 60, cx + sd * 23, 61.5, cx + sd * 12, 66, 1.3, G.deep);
    }
    arcLine(cx, 48, cx, 70, cx + 1, 60, 1.2, G.deep);                                                                          // linea centrale
    for (let r = 0; r < 3; r++) for (const sd of [-1, 1]) { Px.rect(ctx, cx + sd * 5 - 3, 62 + r * 3.4, 6, 2.6, r === 0 ? G.hi : G.skin); arcLine(cx + sd * 5 - 3, 64.8 + r * 3.4, cx + sd * 5 + 3, 64.8 + r * 3.4, cx + sd * 5, 66 + r * 3.4, 0.8, G.deep); }  // addominali
    arcLine(cx - 16, 58, cx - 22, 68, cx - 21, 62, 1, G.deep); arcLine(cx + 16, 58, cx + 22, 68, cx + 21, 62, 1, G.deep);     // dorsali
    // brandelli del blazer nero sulle spalle e in vita
    ctx.fillStyle = o.top;
    ctx.beginPath(); ctx.moveTo(10, 44); ctx.lineTo(28, 40); ctx.lineTo(25, 47); ctx.lineTo(27, 52); ctx.lineTo(21, 49); ctx.lineTo(18, 56); ctx.lineTo(14, 49); ctx.lineTo(8, 51); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(80, 44); ctx.lineTo(62, 40); ctx.lineTo(65, 47); ctx.lineTo(63, 53); ctx.lineTo(69, 50); ctx.lineTo(72, 57); ctx.lineTo(76, 50); ctx.lineTo(82, 52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.topHi; ctx.fillRect(12, 43, 11, 1.4); ctx.fillRect(67, 43, 11, 1.4);
    ctx.fillStyle = o.top;
    ctx.beginPath(); ctx.moveTo(cx - 10, 41); ctx.lineTo(cx - 3, 40); ctx.lineTo(cx - 7, 49); ctx.closePath(); ctx.fill();                  // risvolti rimasti al collo
    ctx.beginPath(); ctx.moveTo(cx + 10, 41); ctx.lineTo(cx + 3, 40); ctx.lineTo(cx + 7, 49); ctx.closePath(); ctx.fill();
    // cintura (bordeaux nel vestito di laurea) con fibbia
    const belt = outfit === 'casual' ? '#7a1f35' : o.pantsLo;
    ctx.fillStyle = belt; ctx.fillRect(cx - 19, 68, 38, 5); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(cx - 19, 68, 38, 1.3);
    if (outfit === 'casual') { ctx.fillStyle = '#f6c344'; ctx.fillRect(cx - 4, 67, 8, 7); ctx.fillStyle = '#7a1f35'; ctx.fillRect(cx - 2.5, 68.5, 5, 4); ctx.fillStyle = '#fff3b0'; ctx.fillRect(cx - 4, 67, 8, 1.2); }
    ctx.fillStyle = o.pants;                                                                                                  // vita pantaloni
    ctx.beginPath(); ctx.moveTo(cx - 20, 72); ctx.lineTo(cx + 20, 72); ctx.lineTo(cx + 18, 76); ctx.lineTo(cx, 74); ctx.lineTo(cx - 18, 76); ctx.closePath(); ctx.fill();
    // braccia enormi: deltoide, bicipite, avambraccio, pugno chiuso
    for (const sd of [-1, 1]) {
      const sx = cx + sd * 35, hi = sd < 0;
      E(sx, 50, 12, 13, hi ? G.hi : G.skin); E(sx + sd * 1.5, 54, 10, 10, G.skin);                                           // deltoide
      Px.line(ctx, sx, 56, sx + sd * 4, 72, 17, G.skin);                                                                       // braccio
      E(sx - sd * 1, 64, 9.5, 10.5, hi ? G.hi : G.skin);                                                                       // bicipite
      arcLine(sx + sd * 5, 56, sx + sd * 8, 70, sx + sd * 9, 63, 1.3, G.deep);
      Px.line(ctx, sx + sd * 4, 72, sx + sd * 7, 88, 13, G.skin);                                                              // avambraccio
      Px.line(ctx, sx + sd * 2, 73, sx + sd * 5, 86, 2, G.hi);
      E(sx + sd * 8, 91, 9, 8.5, G.skin); E(sx + sd * 8, 93, 9, 6, G.shade);                                                   // pugno
      for (let i = 0; i < 3; i++) arcLine(sx + sd * (4 + i * 3.4), 88, sx + sd * (4 + i * 3.4), 94, sx + sd * (3.4 + i * 3.4), 91, 0.8, G.deep);
      ctx.fillStyle = o.top; ctx.fillRect(sx + sd * 4 - 7, 77, 14, 2); ctx.fillRect(sx + sd * 4 - 5, 79, 3, 4);                // fascia di stoffa rimasta al polso
    }
    // testa: stessa Martina, arrabbiata
    ctx.save(); ctx.translate(cx - 22 * 1.12, -2); ctx.scale(1.12, 1.12); head(ctx, withWreath, true); ctx.restore();
    ctx.restore();
  }

  // Martina trasformata in gallina gigante: corpo bianco e paffuto, ali, zampe arancioni, la sua faccia con il becco (canvas 110x100)
  function drawHen(ctx, outfit, withWreath) {
    const o = OUT[outfit], cx = 45, W = '#fdfdf7', W2 = '#e4e6dc', W3 = '#c4c9bf';
    const E = (x, y, rx, ry, c) => Px.ell(ctx, x, y, rx, ry, c);
    ctx.save(); ctx.translate(10, 0);
    const arc = (x0, y0, x1, y1, qx, qy, w, c) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(qx, qy, x1, y1); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); };
    // coda a ventaglio dietro il corpo
    for (let i = -2; i <= 2; i++) { ctx.save(); ctx.translate(cx + i * 9, 52); ctx.rotate(i * 0.32); E(0, -12, 6, 16, i % 2 ? W2 : W); ctx.restore(); }
    // zampe e piedi palmati arancioni
    for (const sd of [-1, 1]) {
      const x = cx + sd * 12;
      Px.line(ctx, x, 82, x, 95, 4.2, '#f2a33a'); Px.line(ctx, x - 1, 82, x - 1, 95, 1, '#ffd27a');
      for (const a of [-0.8, 0, 0.8]) Px.line(ctx, x, 95, x + a * 8, 98.5, 3, '#f2a33a');
      E(x, 96, 3.6, 2, '#f2a33a');
    }
    // corpo tondo e paffuto
    E(cx, 62, 35, 29, W3); E(cx, 61, 35, 28, W); E(cx - 6, 52, 22, 15, '#ffffff'); E(cx + 14, 72, 22, 14, W2);
    // piume a scaglie sul petto e sulla pancia
    for (let r = 0; r < 4; r++) for (let c = -2 + (r % 2 ? 0.5 : 0); c <= 2; c++) arc(cx + c * 10 - 4, 60 + r * 6, cx + c * 10 + 4, 60 + r * 6, cx + c * 10, 64 + r * 6, 1, W3);
    // ali: arrotondate, con punte di piuma
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(cx + sd * 35, 58); ctx.rotate(sd * 0.28);
      E(0, 8, 11, 26, W3); E(-sd * 0.8, 7, 10, 25, W); E(-sd * 3, 2, 5, 14, '#ffffff');
      for (let i = 0; i < 4; i++) { E(sd * (-5 + i * 3.4), 30 - (i % 2) * 2, 4, 5, W2); arc(sd * (-5 + i * 3.4) - 3, 28, sd * (-5 + i * 3.4) + 3, 28, sd * (-5 + i * 3.4), 33, 0.9, W3); }
      ctx.restore();
    }
    // brandelli del vestito rimasti addosso: colletto e cintura
    ctx.fillStyle = o.top;
    ctx.beginPath(); ctx.moveTo(cx - 14, 43); ctx.lineTo(cx - 3, 46); ctx.lineTo(cx - 9, 56); ctx.lineTo(cx - 12, 52); ctx.lineTo(cx - 17, 54); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 14, 43); ctx.lineTo(cx + 3, 46); ctx.lineTo(cx + 9, 56); ctx.lineTo(cx + 12, 52); ctx.lineTo(cx + 17, 54); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.topHi; ctx.fillRect(cx - 12, 45, 5, 1.2); ctx.fillRect(cx + 7, 45, 5, 1.2);
    const belt = outfit === 'casual' ? '#7a1f35' : o.pantsLo;
    ctx.beginPath(); ctx.ellipse(cx, 70, 30, 6, 0, 0.05 * Math.PI, 0.95 * Math.PI); ctx.strokeStyle = belt; ctx.lineWidth = 4.5; ctx.stroke();
    if (outfit === 'casual') { ctx.fillStyle = '#f6c344'; ctx.fillRect(cx - 4, 72, 8, 7); ctx.fillStyle = '#7a1f35'; ctx.fillRect(cx - 2.5, 73.5, 5, 4); ctx.fillStyle = '#fff3b0'; ctx.fillRect(cx - 4, 72, 8, 1.2); }
    // collo di piume e testa di Martina con cresta e becco
    E(cx, 45, 16, 8, W3); E(cx, 44, 16, 7, W);
    for (let i = -3; i <= 3; i++) E(cx + i * 4.6, 47 + Math.abs(i) * 0.6, 3.2, 3.6, i % 2 ? W2 : W);
    ctx.save(); ctx.translate(cx - 22 * 1.1, 4); ctx.scale(1.1, 1.1); head(ctx, withWreath, 'hen'); ctx.restore();
    ctx.restore();
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
    if (outfit === 'casual') { ctx.fillStyle = H.skin; ctx.fillRect(19, 32, 6, 2); ctx.fillRect(20, 34, 4, 2); ctx.fillRect(21, 36, 2, 2); }
    if (outfit === 'casual') { ctx.fillStyle = '#7a1f35'; ctx.fillRect(12, 39, 20, 3); ctx.fillStyle = '#a63350'; ctx.fillRect(12, 39, 20, 1); ctx.fillStyle = '#f6c344'; ctx.fillRect(20, 38, 4, 5); ctx.fillStyle = '#7a1f35'; ctx.fillRect(21, 39, 2, 3); }
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
    const slide = pose === 'slide', big = pose === 'big';
    const c = Px.make((big || pose === 'hen') ? 110 : (slide ? 60 : 44), (big || pose === 'hen') ? 100 : (slide ? 52 : 80), (ctx) => {
      if (pose === 'hen') drawHen(ctx, outfit, withWreath);
      else if (big) drawBig(ctx, outfit, withWreath);
      else if (slide) drawSlide(ctx, outfit, withWreath);
      else drawStanding(ctx, outfit, pose, withWreath);
    }, false, 3);
    cache[key] = Px.outlined(Px.shade(c));
    return cache[key];
  }

  // (x, yBottom) = centro-base in unita' di progetto; scale 1 = dimensione di gioco
  function draw(ctx, outfit, pose, x, yBottom, scale = 1, opts = {}) {
    Px.blit(ctx, get(outfit, pose, !!opts.wreath), x, yBottom, scale);
  }

  // Ciclo di corsa a 4 fotogrammi: pose + rimbalzo del corpo (in unita'). rate = passi al secondo.
  const CYCLE = ['run0', 'run2', 'run1', 'run3'], BOBS = [0, 1.2, 0, 1.2];
  function run(t, rate = 12) { const i = Math.floor(t * rate) % 4; return { pose: CYCLE[i], bob: BOBS[i] }; }

  return { get, draw, run };
})();

// Infermiera inseguitrice (formosa, buffa): con la gigantesca siringa "PFIZER" sopra la testa.
// view 'back' = vista da dietro durante la corsa; 'front' = vista frontale (scena iniziale e finale).
const Chaser = (() => {
  const cache = {};
  const WHITE = '#ffffff', SH = '#d3dce2', SH2 = '#aab6bf';
  const HAIR = '#5a3a28', HAIR_HI = '#7a5238';

  function syringe(c, x, y, flip) {
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
    if (flip) c.restore();   // il testo non deve risultare specchiato
    if (flip) Px.text(c, 'PFIZER', 216 - (x + 38), y + 6, PAL.ink, 2, 'right'); else Px.text(c, 'PFIZER', x + 38, y + 6, PAL.ink, 2);
    if (flip) { c.save(); c.translate(216, 0); c.scale(-1, 1); }
    // punta e ago
    Px.bev(c, x + 140, y + 7, 8, 8, PAL.metal, '#ffffff', PAL.metalDark);
    c.fillStyle = '#e9eef2'; c.fillRect(x + 148, y + 10, 34, 2);
    c.fillStyle = PAL.metalDark; c.fillRect(x + 148, y + 12, 34, 1);
    c.fillStyle = '#ffffff'; c.fillRect(x + 181, y + 10, 2, 2);
    // goccia sull'ago
    c.fillStyle = '#7fd3ff'; c.fillRect(x + 181, y + 14, 2, 3);
  }

  // 4 fotogrammi: ginocchia che si alzano a turno, busto che rimbalza, gonna che ondeggia, siringa che ondeggia.
  function build(view, frame, flip) {
    const W = 216, Ht = 190;
    const ph = frame * Math.PI / 2;
    const liftL = Math.max(0, Math.sin(ph)) * 6, liftR = Math.max(0, -Math.sin(ph)) * 6;
    const up = (frame % 2) * 2;                 // il busto rimbalza
    const sw = Math.sin(ph);                    // oscillazione laterale
    const SKIN = '#f2c9a5', SKIN_SH = '#dfae88', BLUE = '#2f6fd0', BLUE_D = '#1d4a97';
    return Px.make(W, Ht, (c) => {
      if (flip) { c.save(); c.translate(W, 0); c.scale(-1, 1); }
      const cx = 108;
      // ---------- gambe: calze bianche, polpacci arrotondati, zoccoli ----------
      for (const [dx, lift] of [[-18, liftL], [18, liftR]]) {
        const x = cx + dx, o = dx < 0 ? -1 : 1;
        Px.line(c, x, 146, x + o * 2, 168 - lift, 14, '#f7f9fa');
        Px.line(c, x + o * 2, 164 - lift, x + o * 2, 176 - lift, 11, '#f7f9fa');
        c.fillStyle = SH; c.fillRect(x - o * 6 + (o > 0 ? 5 : 0), 150, 2, 24 - lift);       // ombra interna
        Px.ell(c, x + o * 2, 168 - lift, 5, 7, '#ffffff');                                    // polpaccio
        Px.ell(c, x + o * 3, 177 - lift, 12, 5, '#f2f5f7');                                    // zoccolo
        c.fillStyle = BLUE; c.fillRect(x + o * 3 - 12, 180 - lift, 24, 2);
        c.fillStyle = BLUE_D; c.fillRect(x + o * 3 - 12, 181 - lift, 24, 1);
        c.fillStyle = BLUE; c.fillRect(x + o * 3 - 4, 172 - lift, 8, 2);                       // cinturino
      }
      c.save(); c.translate(0, -up);
      // ---------- gonna a campana ----------
      for (let y = 116; y < 152; y++) {
        const t = (y - 116) / 36;
        const half = Math.round(21 + t * 25 + sw * t * 2);
        const x0 = cx - half + Math.round(sw * t * 1.5);
        c.fillStyle = WHITE; c.fillRect(x0, y, half * 2, 1);
        c.fillStyle = SH; c.fillRect(x0 + half * 2 - 9, y, 9, 1);
        c.fillStyle = '#ffffff'; c.fillRect(x0 + 2, y, 3, 1);
      }
      c.fillStyle = SH2; for (const fx of [-24, -9, 6, 21]) c.fillRect(cx + fx + Math.round(sw * 2), 128, 1, 22);
      c.fillStyle = '#cfe0f5'; c.fillRect(cx - 46 + Math.round(sw * 1.5), 150, 92, 2);          // bordo azzurro
      c.fillStyle = BLUE; c.fillRect(cx - 46 + Math.round(sw * 1.5), 152, 92, 1);
      // ---------- busto: vita sottile, petto e fianchi pronunciati ----------
      Px.ell(c, cx, 118, 24, 12, WHITE);                                                        // fianchi
      Px.ell(c, cx, 109, 17, 9, WHITE);                                                         // vita
      Px.ell(c, cx, 100, 31, 16, WHITE);                                                        // petto
      Px.ell(c, cx - 14, 98, 16, 13, '#ffffff'); Px.ell(c, cx + 14, 98, 16, 13, '#ffffff');
      c.fillStyle = SH; c.fillRect(cx + 14, 104, 14, 3); c.fillRect(cx - 28, 108, 56, 1);      // ombre sotto il seno
      c.fillStyle = SH; c.fillRect(cx + 28, 96, 3, 14);
      c.fillStyle = PAL.red; c.fillRect(cx - 19, 112, 38, 5);                                    // cintura rossa
      c.fillStyle = PAL.redDark; c.fillRect(cx - 19, 116, 38, 1);
      c.fillStyle = PAL.gold; c.fillRect(cx - 4, 111, 8, 7); c.fillStyle = '#fff3b0'; c.fillRect(cx - 3, 112, 6, 2);
      if (view === 'front') {
        for (const by of [100, 105]) { c.fillStyle = SH2; c.fillRect(cx - 1, by, 2, 2); }
        c.fillStyle = BLUE; c.fillRect(cx - 14, 91, 28, 2);                                      // profilo blu del colletto
        for (let i = 0; i < 9; i++) { c.fillStyle = SKIN; c.fillRect(cx - 9 + i, 88 + i, 18 - i * 2, 1); }
        Px.line(c, cx - 13, 87, cx - 1, 99, 3, WHITE); Px.line(c, cx + 13, 87, cx + 1, 99, 3, WHITE);
        Px.line(c, cx - 13, 88, cx - 2, 98, 1, BLUE); Px.line(c, cx + 13, 88, cx + 2, 98, 1, BLUE);
        c.fillStyle = '#e6b793'; c.fillRect(cx - 2, 97, 4, 1);
        c.fillStyle = '#ffffff'; c.fillRect(cx + 14, 99, 13, 9); c.fillStyle = BLUE; c.fillRect(cx + 14, 99, 13, 1);   // targhetta
        c.fillStyle = PAL.red; c.fillRect(cx + 19, 101, 2, 6); c.fillRect(cx + 17, 103, 6, 2);
        c.fillStyle = SH; c.fillRect(cx - 27, 100, 11, 1); c.fillRect(cx - 27, 104, 8, 1);       // penne nel taschino
        c.fillStyle = '#3e7bd6'; c.fillRect(cx - 26, 97, 1, 4); c.fillStyle = PAL.red; c.fillRect(cx - 23, 98, 1, 3);
      } else {
        c.fillStyle = SH; c.fillRect(cx, 90, 1, 22);
      }
      // ---------- braccia alzate: le mani stringono la siringa ----------
      for (const sx of [-1, 1]) {
        const S = [cx + sx * 31, 92], E = [cx + sx * (48 + sw * 1.5), 62 - up * 0], Hd = [cx + sx * 36, 30];
        Px.line(c, S[0], S[1], E[0], E[1], 11, SKIN);
        Px.line(c, E[0], E[1], Hd[0], Hd[1], 9, SKIN);
        Px.line(c, S[0], S[1], S[0] + (E[0] - S[0]) * 0.55, S[1] + (E[1] - S[1]) * 0.55, 14, WHITE);       // manica a sbuffo
        Px.line(c, S[0] + sx * 1, S[1], S[0] + (E[0] - S[0]) * 0.55 + sx * 1, S[1] + (E[1] - S[1]) * 0.55, 3, SH);
        c.fillStyle = '#cfe0f5'; c.fillRect(S[0] + (E[0] - S[0]) * 0.55 - 7, S[1] + (E[1] - S[1]) * 0.55 - 2, 14, 2);
        Px.line(c, E[0] - sx * 2, E[1] + 2, Hd[0] - sx * 2, Hd[1] + 4, 1, '#f8dcc2');                    // luce sull'avambraccio
        Px.ell(c, Hd[0], Hd[1], 7, 6, SKIN);
        c.fillStyle = SKIN_SH; for (let i = 0; i < 3; i++) c.fillRect(Hd[0] - 5 + i * 4, Hd[1] + 3, 1, 4);  // dita
      }
      // ---------- collo e testa ----------
      const hy = 64;
      Px.ell(c, cx, hy + 28, 8, 7, SKIN_SH);
      if (view === 'back') {
        Px.ell(c, cx, hy + 4, 27, 29, HAIR);
        c.fillStyle = HAIR_HI; c.fillRect(cx - 15, hy - 14, 22, 2); c.fillRect(cx + 4, hy + 4, 14, 2); c.fillRect(cx - 18, hy + 8, 2, 14);
        const tail = Math.round(sw * 5);                                      // codino che ondeggia
        Px.ell(c, cx + tail, hy + 34, 11, 20, HAIR); Px.ell(c, cx + tail, hy + 52, 8, 8, HAIR);
        c.fillStyle = HAIR_HI; c.fillRect(cx + tail - 6, hy + 28, 2, 18);
        c.fillStyle = PAL.red; c.fillRect(cx + tail - 5, hy + 22, 10, 4);
      } else {
        Px.ell(c, cx, hy - 2, 26, 22, HAIR);                                   // capelli dietro
        c.fillStyle = HAIR; c.fillRect(cx - 27, hy - 2, 8, 24); c.fillRect(cx + 19, hy - 2, 8, 24);
        c.fillStyle = HAIR_HI; c.fillRect(cx - 25, hy + 2, 1, 14); c.fillRect(cx + 24, hy + 2, 1, 14);
        Px.ell(c, cx, hy + 6, 19, 22, SKIN);                                   // viso
        Px.ell(c, cx + 11, hy + 12, 7, 14, '#e9b995');                         // ombra lato destro
        Px.ell(c, cx, hy + 6, 17, 21, SKIN);
        Px.ell(c, cx - 3, hy + 2, 11, 12, '#f7d9bd'); Px.ell(c, cx - 2, hy + 3, 10, 11, SKIN);
        Px.ell(c, cx, hy + 26, 9, 3, '#e6b793');                               // sotto il mento
        Px.ell(c, cx - 12, hy + 15, 5, 3, 'rgba(241,120,125,0.6)'); Px.ell(c, cx + 12, hy + 15, 5, 3, 'rgba(241,120,125,0.6)');   // guance
        for (const [ex, sd] of [[-6, -1], [8, 1]]) {                           // occhi grandi con ciglia
          const x0 = cx + ex, y0 = hy + 5;
          Px.ell(c, x0, y0, 5, 4.4, '#ffffff');
          Px.ell(c, x0, y0 + 0.3, 3.5, 4, '#3f7f5a');
          Px.ell(c, x0, y0 + 0.5, 1.9, 2.6, '#0d1a14');
          Px.ell(c, x0 - 1.3, y0 - 1.3, 1.2, 1.2, '#ffffff');
          c.strokeStyle = PAL.ink; c.lineCap = 'round'; c.lineWidth = 1.7;
          c.beginPath(); c.moveTo(x0 - 5.4, y0 - 1.6); c.quadraticCurveTo(x0, y0 - 5.6, x0 + 5.4, y0 - 1.6); c.stroke();
          c.lineWidth = 1.1; c.beginPath(); c.moveTo(x0 + sd * 5, y0 - 2.4); c.lineTo(x0 + sd * 7.4, y0 - 4.4); c.stroke();
        }
        c.strokeStyle = '#3a2418'; c.lineCap = 'round'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(cx - 12, hy - 1); c.quadraticCurveTo(cx - 7, hy - 6, cx - 2, hy - 3); c.stroke();      // sopracciglia arcuate, furbette
        c.beginPath(); c.moveTo(cx + 2, hy - 3); c.quadraticCurveTo(cx + 7, hy - 6.5, cx + 13, hy - 1.5); c.stroke();
        c.strokeStyle = '#d6a085'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx - 0.5, hy + 8); c.quadraticCurveTo(cx - 2.5, hy + 13, cx + 1, hy + 13); c.stroke();   // naso
        Px.ell(c, cx, hy + 14, 2.5, 1, '#e6b793');
        c.beginPath(); c.moveTo(cx - 9, hy + 17); c.quadraticCurveTo(cx, hy + 20, cx + 9, hy + 17); c.quadraticCurveTo(cx, hy + 31, cx - 9, hy + 17);   // sorriso con i denti
        c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = '#b9323f'; c.lineWidth = 1.6; c.lineJoin = 'round'; c.stroke();
        c.strokeStyle = '#e34a5e'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 6, hy + 19); c.quadraticCurveTo(cx, hy + 25, cx + 6, hy + 19); c.stroke();
        Px.ell(c, cx - 20, hy + 16, 1.8, 2.4, PAL.gold); Px.ell(c, cx + 20, hy + 16, 1.8, 2.4, PAL.gold);   // orecchini
        c.fillStyle = HAIR; c.fillRect(cx - 18, hy - 6, 6, 14); c.fillRect(cx + 12, hy - 6, 6, 14);        // ciocche ai lati
      }
      // ---------- cuffia ----------
      Px.ell(c, cx, hy - 14, 25, 11, WHITE);
      c.fillStyle = SH; c.fillRect(cx - 25, hy - 6, 50, 3); c.fillStyle = '#ffffff'; c.fillRect(cx - 22, hy - 20, 14, 2);
      c.fillStyle = PAL.red; c.fillRect(cx - 3, hy - 22, 6, 12); c.fillRect(cx - 6, hy - 19, 12, 6);
      c.restore();
      // ---------- siringa gigante (si muove con il busto) ----------
      syringe(c, 6, 4 - up, flip);
      if (flip) c.restore();
    });
  }

  const H_SKIN = '#f2c9a5';

  function get(frame, view = 'back', flip = false) {
    frame = ((frame | 0) % 4 + 4) % 4;
    const key = view + frame + (flip ? 'f' : '');
    if (!cache[key]) cache[key] = Px.outlined(build(view, frame, flip));
    return cache[key];
  }

  // Disegna l'infermiera: x = centro del corpo, yBottom = base dei piedi, k = scala
  function draw(ctx, x, yBottom, k = 1, frame = 0, view = 'back') {
    Px.blit(ctx, get(frame, view), x - 0, yBottom, k);
  }

  return { get, draw };
})();
