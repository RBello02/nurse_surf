// Rendering pseudo-3D del corridoio: pavimento, soffitto e pareti calcolati riga per riga / colonna per colonna
// (effetto "mode 7"), cosi' i pixel restano nitidi. La coordinata di mondo w = z + T (T = distanza percorsa).
const World = (() => {
  const W = CFG.W, H = CFG.H;
  const CX = W / 2, HZ = CFG.HORIZON_Y, PY = CFG.PLAYER_Y;
  const WALL = 84;        // semi-larghezza del corridoio a scala 1
  const CEIL = 70;        // quanto sale il soffitto sopra l'orizzonte
  const S_MIN = 0.1;      // scala minima (fondo del corridoio)
  const SEG = 0.75;       // lunghezza dei segmenti di parete (porte, finestre, poster)
  const TILE = 0.3;       // lunghezza delle piastrelle del pavimento
  const LIGHT_P = 1.5;    // distanza fra le luci a soffitto
  const STEP = 0.25;      // spessore minimo di una linea (unita')
  const rq = (v) => v;    // il corridoio e' disegnato con poligoni in prospettiva: nessun arrotondamento a pixel

  const THEMES = {
    normal: {
      special: false,
      ceilA: '#eef6f8', ceilB: '#dbe8ec', light: '#fffbe0',
      wallTop: PAL.wallTop, wallBot: PAL.wallBot, skirt: '#6c7a86',
      stripeL: PAL.green, stripeR: PAL.blue,
      floorA: PAL.floorA, floorB: PAL.floorB, floorHi: '#f7fbfc', line: PAL.floorLine,
      door: '#8fa7b3', doorDark: '#6f8794', glass: '#9bd8ee', frame: '#e8eef1'
    },
    uni: {
      uni: true,
      ceilA: '#f1ece1', ceilB: '#e0d9c9', light: '#fff6d6',
      wallTop: '#efe2c8', wallBot: '#b4573d', skirt: '#4a2f1a',
      stripeL: '#1f3a7a', stripeR: '#f6c344',
      floorA: '#c78d55', floorB: '#b47b46', floorHi: '#e0a96f', line: '#7a4d27',
      door: '#8a5a2f', doorDark: '#5f3b1a', glass: '#cfe3f0', frame: '#f7efdc'
    },
    special: {
      special: true,
      ceilA: '#1d2d7a', ceilB: '#16236a', light: '#ffe9a0',
      wallTop: '#fbeccb', wallBot: '#f1d9a0', skirt: '#8a5a1f',
      stripeL: PAL.gold, stripeR: PAL.gold,
      floorA: '#b3263e', floorB: '#9b1e34', floorHi: '#d23a52', line: PAL.gold,
      door: PAL.gold, doorDark: PAL.goldDark, glass: '#ffe9a0', frame: PAL.goldDark
    }
  };

  const POSTER_COLORS = [PAL.pink, PAL.yellow, PAL.orange, PAL.purple, PAL.green, '#ffffff'];

  function proj(z) { return 1 / (1 + 3 * z); }
  function zOf(s) { return (1 / s - 1) / 3; }
  function scrY(s) { return HZ + (PY - HZ) * s; }
  function laneX(l, s) { return CX + (CFG.LANE_X_NEAR[l] - CX) * s; }
  function laneXf(lf, s) {
    const c = Px.clamp(lf, 0, CFG.LANES - 1);
    const a = Math.min(CFG.LANES - 2, Math.floor(c));
    const t = c - a;
    return laneX(a, s) * (1 - t) + laneX(a + 1, s) * t;
  }

  function theme(st, w) { return w >= st.specialStart ? THEMES.special : (w >= st.uniStart ? THEMES.uni : THEMES.normal); }

  // ---------- geometria in prospettiva (poligoni nitidi a qualsiasi risoluzione) ----------
  // Un punto del corridoio e' (lato, profondita' di mondo w, altezza v 0..1 sulla parete). Con s = proj(w - T):
  //   x = CX + lato * WALL * s,   y = HZ + s * (K1 - K2 * v)      (lineare in s: i bordi restano rettilinei)
  const K1 = PY - HZ, K2 = PY - HZ + CEIL;
  let _T = 0, _w0 = 0, _w1 = 1, _st = null;
  const S_OF = (w) => proj(w - _T);

  function poly(ctx, pts, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fill();
  }
  // porzione di parete: lato -1 (sinistra) / +1 (destra), tra le profondita' wa..wb e le altezze va..vb
  function wq(ctx, side, wa, wb, va, vb, color) {
    wa = Math.max(wa, _w0); wb = Math.min(wb, _w1);
    if (wb <= wa) return;
    const s0 = S_OF(wa), s1 = S_OF(wb), X = (s) => CX + side * WALL * s, Y = (s, v) => HZ + s * (K1 - K2 * v);
    poly(ctx, [X(s0), Y(s0, va), X(s1), Y(s1, va), X(s1), Y(s1, vb), X(s0), Y(s0, vb)], color);
  }
  // porzione di pavimento (y = floor) o soffitto, tra le profondita' wa..wb e le posizioni laterali xa..xb (unita' a scala 1)
  function fq(ctx, ceil, wa, wb, xa, xb, color) {
    wa = Math.max(wa, _w0); wb = Math.min(wb, _w1);
    if (wb <= wa) return;
    const s0 = S_OF(wa), s1 = S_OF(wb), Y = (s) => ceil ? HZ - CEIL * s : HZ + K1 * s;
    poly(ctx, [CX + xa * s0, Y(s0), CX + xb * s0, Y(s0), CX + xb * s1, Y(s1), CX + xa * s1, Y(s1)], color);
  }
  function themeAt(st, w) { return theme(st, w); }
  // suddivide [wa, wb] ai confini fra ambienti (ospedale / universita' / finale)
  function spans(st, wa, wb, fn) {
    const cuts = [wa];
    for (const c of [st.uniStart, st.specialStart]) if (isFinite(c) && c > wa && c < wb) cuts.push(c);
    cuts.sort((p, q) => p - q); cuts.push(wb);
    for (let i = 0; i + 1 < cuts.length; i++) fn(cuts[i], cuts[i + 1], themeAt(st, (cuts[i] + cuts[i + 1]) / 2));
  }
  // ripete un motivo periodico (periodo per, parte attiva [0, on)) nell'intervallo corrente
  function periodic(per, on, fn) {
    for (let k = Math.floor(_w0 / per); k * per < _w1; k++) fn(k * per, k * per + on * per, k);
  }

  function drawWalls(ctx, st) {
    for (const side of [-1, 1]) {
      const left = side < 0;
      spans(st, _w0, _w1, (a, b, th) => {
        wq(ctx, side, a, b, 0, 1, th.wallTop);
        wq(ctx, side, a, b, 0.04, 0.42, th.wallBot);
        wq(ctx, side, a, b, 0.42, 0.47, left ? th.stripeL : th.stripeR);
        wq(ctx, side, a, b, 0, 0.04, th.skirt);
        wq(ctx, side, a, b, 0.04, 0.16, 'rgba(10,20,40,0.13)'); wq(ctx, side, a, b, 0.04, 0.09, 'rgba(10,20,40,0.12)');   // ombra d'ambiente in basso
        wq(ctx, side, a, b, 0.9, 1, 'rgba(10,20,40,0.12)');                                                         // e sotto il soffitto
      });
      for (let seg = Math.floor(_w0 / SEG); seg * SEG < _w1; seg++) {
        const wA = seg * SEG, th = themeAt(st, wA + SEG / 2);
        const D = (u0, u1, v0, v1, col) => wq(ctx, side, wA + u0 * SEG, wA + u1 * SEG, v0, v1, col);
        if (th.special) {                                     // pilastri dorati con bandiere
          D(0.38, 0.62, 0.04, 0.78, PAL.goldDark); D(0.42, 0.58, 0.06, 0.76, PAL.gold); D(0.42, 0.58, 0.5, 0.7, (seg % 2) ? PAL.red : PAL.blue);
          continue;
        }
        const kind = Px.hash(seg * 2 + (left ? 0 : 1) + 7);
        if (th.uni) {
          if (kind < 0.35) {                                  // porta di un'aula in legno con targa blu
            D(0.2, 0.8, 0.04, 0.64, th.door); D(0.2, 0.24, 0.04, 0.64, th.doorDark); D(0.76, 0.8, 0.04, 0.64, th.doorDark);
            D(0.34, 0.66, 0.4, 0.56, th.glass); D(0.68, 0.72, 0.22, 0.28, PAL.gold); D(0.36, 0.64, 0.68, 0.75, '#1f3a7a');
          } else if (kind < 0.6) {                            // finestra alta
            D(0.2, 0.8, 0.2, 0.8, th.frame); D(0.24, 0.48, 0.24, 0.76, th.glass); D(0.52, 0.76, 0.24, 0.76, th.glass); D(0.58, 0.7, 0.5, 0.66, '#eaf6fc');
          } else if (kind < 0.8) {                            // bacheca di sughero con avvisi
            D(0.22, 0.78, 0.3, 0.66, '#7a4d27'); D(0.24, 0.76, 0.32, 0.64, '#c98f55');
            for (let n = 2; n < 7; n += 2) D(n / 9, (n + 1) / 9, 0.38 + (n % 3) * 0.06, 0.54 + (n % 3) * 0.04, POSTER_COLORS[(seg + n) % POSTER_COLORS.length]);
          } else {                                            // libreria con libri colorati
            D(0.18, 0.82, 0.04, 0.78, '#5f3b1a');
            const cols = ['#3e7bd6', '#e0344b', '#3bb273', '#f6c344', '#8e5bd1', '#ffffff'];
            for (let b = 6; b < 23; b++) for (const [va, vb] of [[0.08, 0.26], [0.3, 0.48], [0.52, 0.7]]) D(b / 28, (b + 1) / 28, va, vb, cols[(b + Math.floor(va * 10) + seg) % cols.length]);
          }
          continue;
        }
        if (kind < 0.45) {                                    // porta di reparto
          D(0.2, 0.8, 0.04, 0.62, th.door); D(0.2, 0.24, 0.04, 0.62, th.doorDark); D(0.76, 0.8, 0.04, 0.62, th.doorDark);
          D(0.32, 0.68, 0.36, 0.54, th.glass); D(0.7, 0.74, 0.22, 0.28, PAL.metal); D(0.38, 0.62, 0.66, 0.74, kind < 0.22 ? PAL.blue : PAL.green);
        } else if (kind < 0.7) {                              // finestra
          D(0.15, 0.85, 0.26, 0.74, th.frame); D(0.19, 0.48, 0.3, 0.7, th.glass); D(0.52, 0.81, 0.3, 0.7, th.glass); D(0.55, 0.7, 0.5, 0.64, '#c8ecf8');
        } else if (kind < 0.88) {                             // poster / bacheca
          const col = POSTER_COLORS[Math.floor(Px.hash(seg * 5 + 3) * POSTER_COLORS.length)];
          D(0.3, 0.7, 0.3, 0.62, '#ffffff'); D(0.3, 0.7, 0.34, 0.58, col); D(0.4, 0.6, 0.42, 0.5, '#ffffff');
        }
        // corrimano lungo la parete
        D(0, 1, 0.27, 0.31, '#b4c0c8'); D(0, 1, 0.3, 0.31, '#e8eef1'); D(0, 1, 0.27, 0.275, '#8493a0');
      }
    }
  }

  function drawEndFace(ctx, st) {
    const s = st._sEnd;
    const x0 = rq(CX - WALL * s), x1 = rq(CX + WALL * s);
    const yT = rq(HZ - CEIL * s), yB = rq(scrY(s));
    const th = st.endW != null ? THEMES.special : THEMES.normal;
    ctx.fillStyle = th.wallTop;
    ctx.fillRect(x0, yT, x1 - x0, yB - yT);
    if (st.endW == null) {
      // fondo del corridoio: portone con luce
      ctx.fillStyle = '#c9dde4';
      ctx.fillRect(rq(CX - 20 * s), rq(yB - 150 * s), rq(40 * s), rq(150 * s));
      ctx.fillStyle = '#f4fbff';
      ctx.fillRect(rq(CX - 14 * s), rq(yB - 144 * s), rq(28 * s), rq(144 * s));
      return;
    }
    const o = Px.clamp(st.doorOpen || 0, 0, 1);
    const F = 0.8;
    const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(rq(CX + a * s * F), rq(yB - b * s * F), Math.max(STEP, rq(w * s * F)), Math.max(STEP, rq(h * s * F))); };
    // cornice
    R(-82, 206, 164, 206, PAL.goldDark);
    R(-76, 200, 152, 200, '#fff7d6');
    R(-40, 160, 80, 120, '#ffffff');
    // battenti
    const shift = 70 * o;
    const lw = 76 - shift;
    if (lw > 0.5) {
      R(-76, 200, lw, 200, PAL.gold);
      R(-76, 200, lw, 6, PAL.goldDark);
      R(-70, 188, Math.max(0, lw - 12), 70, PAL.goldDark);
      R(-70, 108, Math.max(0, lw - 12), 70, PAL.goldDark);
      R(-8 - shift, 105, 3, 22, '#fff3b0');
      R(shift, 200, lw, 200, PAL.gold);
      R(shift, 200, lw, 6, PAL.goldDark);
      R(shift + 6, 188, Math.max(0, lw - 12), 70, PAL.goldDark);
      R(shift + 6, 108, Math.max(0, lw - 12), 70, PAL.goldDark);
      R(5 + shift, 105, 3, 22, '#fff3b0');
    }
    // targa sopra la porta
    R(-44, 236, 88, 28, PAL.goldDark);
    R(-42, 234, 84, 24, '#1d2d7a');
    const txt = CFG.FINALE.doorText;
    const sc = Math.max(1, Math.floor(s * 2.4));
    if (Px.textWidth(txt, sc) <= 80 * s * F) {
      Px.text(ctx, txt, CX, yB - 234 * s * F + (24 * s * F - 7 * sc * 0.5) / 2, PAL.gold, sc, 'center');
    }
  }

  function render(ctx, st) {
    const T = st.T;
    st._sEnd = st.endW != null ? Math.max(S_MIN, proj(Math.max(0, st.endW - T))) : S_MIN;
    const sEnd = st._sEnd;
    _T = T; _st = st; _w0 = T - 0.14; _w1 = T + zOf(sEnd);
    ctx.fillStyle = '#1b2a41';
    ctx.fillRect(0, 0, W, H);

    drawEndFace(ctx, st);

    // soffitto
    spans(st, _w0, _w1, (a, b, th) => fq(ctx, true, a, b, -WALL, WALL, th.ceilB));
    periodic(TILE, 1, (a, b, k) => { if (k & 1) spans(st, a, b, (c, d, th) => fq(ctx, true, c, d, -WALL, WALL, th.ceilA)); });
    periodic(LIGHT_P, 0.35, (a, b) => spans(st, a, b, (c, d, th) => {
      fq(ctx, true, c, d, -34, 34, th.light + '55'); fq(ctx, true, c, d, -26, 26, th.light);
    }));

    drawWalls(ctx, st);

    // pavimento
    spans(st, _w0, _w1, (a, b, th) => fq(ctx, false, a, b, -WALL, WALL, th.floorB));
    periodic(TILE, 1, (a, b, k) => { if (k & 1) spans(st, a, b, (c, d, th) => fq(ctx, false, c, d, -WALL, WALL, th.floorA)); });
    periodic(LIGHT_P, 0.35, (a, b) => spans(st, a, b, (c, d, th) => fq(ctx, false, c, d, -WALL, WALL, th.floorHi)));
    spans(st, _w0, _w1, (a, b, th) => {
      fq(ctx, false, a, b, -WALL, -WALL + 5, th.line); fq(ctx, false, a, b, WALL - 5, WALL, th.line);
    });
    periodic(1.5, 0.8, (a, b) => spans(st, a, b, (c, d) => { fq(ctx, false, c, d, -14, 14, 'rgba(255,255,255,0.07)'); fq(ctx, false, c, d, -5, 5, 'rgba(255,255,255,0.06)'); }));   // riflesso lucido
    periodic(0.5, 0.6, (a, b) => spans(st, a, b, (c, d, th) => {
      fq(ctx, false, c, d, -28.6, -27.4, th.line); fq(ctx, false, c, d, 27.4, 28.6, th.line);
    }));
  }

  // Arco d'ingresso del corridoio speciale (billboard a z fissato nel mondo)
  function drawGate(ctx, st, startW, txt, cols) {
    if (startW == null) { startW = st.specialStart; txt = CFG.FINALE.gateText; }
    if (!isFinite(startW)) return;
    cols = cols || { main: PAL.red, hi: '#f06277', dark: PAL.redDark };
    const z = startW - st.T;
    if (z > 3.2 || z < -0.35) return;
    const s = proj(z);
    if (s < st._sEnd) return;
    const yF = scrY(s);
    const xl = CX - WALL * s, xr = CX + WALL * s;
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(rq(x), rq(y), Math.max(STEP, rq(w)), Math.max(STEP, rq(h))); };
    const pw = Math.max(2, 12 * s);
    R(xl, yF - 215 * s, pw, 215 * s, cols.main);
    R(xr - pw, yF - 215 * s, pw, 215 * s, cols.main);
    R(xl + pw * 0.3, yF - 215 * s, Math.max(1, pw * 0.25), 215 * s, cols.hi);
    R(xl, yF - 215 * s, xr - xl, 24 * s, cols.main);
    R(xl, yF - 215 * s, xr - xl, Math.max(1, 3 * s), PAL.gold);
    R(xl, yF - 194 * s, xr - xl, Math.max(1, 3 * s), PAL.gold);
    const sc = Math.max(1, Math.floor(s * 2.4));
    if (Px.textWidth(txt, sc) <= (xr - xl) - 2 * pw) {
      Px.text(ctx, txt, CX, yF - 213 * s + (20 * s - 7 * sc * 0.5) / 2, '#ffffff', sc, 'center', cols.dark);
    }
    // lucine festive
    for (let i = 0; i <= 14; i++) {
      const lx = xl + ((xr - xl) * i) / 14;
      R(lx, yF - 190 * s, Math.max(1, 3 * s), Math.max(1, 3 * s), (i % 2) ? PAL.yellow : '#ffffff');
    }
  }

  return { render, drawGate, proj, zOf, scrY, laneX, laneXf, CEIL, LIGHT_P, CX, WALL, S_MIN, THEMES };
})();
