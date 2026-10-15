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
  const STEP = 0.5;       // risoluzione del rendering (mezza unita' di progetto = 1 pixel reale)
  const rq = (v) => Math.round(v / STEP) * STEP;

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

  function vr(ctx, x, Y, v0, v1, color) {
    const y1 = Y(v1), y0 = Y(v0);
    ctx.fillStyle = color;
    ctx.fillRect(x, y1, STEP, Math.max(STEP, y0 - y1));
  }

  function wallColumn(ctx, st, x) {
    const xc = x + STEP / 2;
    const left = xc < CX;
    const s = Math.abs(xc - CX) / WALL;
    const sEnd = st._sEnd;
    if (s < sEnd) return;
    const w = zOf(s) + st.T;
    const th = theme(st, w);
    const yF = scrY(s), yC = HZ - CEIL * s, h = yF - yC;
    const Y = (v) => rq(yF - h * v);

    vr(ctx, x, Y, 0, 1, th.wallTop);
    vr(ctx, x, Y, 0.04, 0.42, th.wallBot);
    vr(ctx, x, Y, 0.42, 0.47, left ? th.stripeL : th.stripeR);
    vr(ctx, x, Y, 0, 0.04, th.skirt);

    const seg = Math.floor(w / SEG);
    const u = w / SEG - seg;
    if (th.special) {
      // pilastri dorati con bandiere
      if (u > 0.38 && u < 0.62) {
        vr(ctx, x, Y, 0.04, 0.78, PAL.goldDark);
        if (u > 0.42 && u < 0.58) vr(ctx, x, Y, 0.06, 0.76, PAL.gold);
        vr(ctx, x, Y, 0.5, 0.7, (seg % 2) ? PAL.red : PAL.blue);
      }
      return;
    }
    const kind = Px.hash(seg * 2 + (left ? 0 : 1) + 7);
    if (th.uni) {
      if (kind < 0.35) {
        // porta di un'aula in legno con targa blu
        if (u > 0.2 && u < 0.8) {
          const edge = u < 0.24 || u > 0.76;
          vr(ctx, x, Y, 0.04, 0.64, edge ? th.doorDark : th.door);
          if (!edge && u > 0.34 && u < 0.66) vr(ctx, x, Y, 0.4, 0.56, th.glass);
          if (!edge && u > 0.68 && u < 0.72) vr(ctx, x, Y, 0.22, 0.28, PAL.gold);
        }
        if (u > 0.36 && u < 0.64) vr(ctx, x, Y, 0.68, 0.75, '#1f3a7a');
      } else if (kind < 0.6) {
        // finestra alta
        if (u > 0.2 && u < 0.8) {
          const frame = u < 0.24 || u > 0.76 || (u > 0.48 && u < 0.52);
          vr(ctx, x, Y, 0.2, 0.8, th.frame);
          if (!frame) { vr(ctx, x, Y, 0.24, 0.76, th.glass); if (u > 0.58 && u < 0.7) vr(ctx, x, Y, 0.5, 0.66, '#eaf6fc'); }
        }
      } else if (kind < 0.8) {
        // bacheca di sughero con avvisi
        if (u > 0.22 && u < 0.78) {
          vr(ctx, x, Y, 0.3, 0.66, '#7a4d27');
          vr(ctx, x, Y, 0.32, 0.64, '#c98f55');
          const n = Math.floor(u * 9);
          if (n % 2 === 0) vr(ctx, x, Y, 0.38 + (n % 3) * 0.06, 0.54 + (n % 3) * 0.04, POSTER_COLORS[(seg + n) % POSTER_COLORS.length]);
        }
      } else {
        // libreria con libri colorati
        if (u > 0.18 && u < 0.82) {
          vr(ctx, x, Y, 0.04, 0.78, '#5f3b1a');
          const cols = ['#3e7bd6', '#e0344b', '#3bb273', '#f6c344', '#8e5bd1', '#ffffff'];
          const b = Math.floor(u * 28);
          for (const [a, c2] of [[0.08, 0.26], [0.3, 0.48], [0.52, 0.7]]) vr(ctx, x, Y, a, c2, cols[(b + Math.floor(a * 10) + seg) % cols.length]);
        }
      }
      return;
    }
    if (kind < 0.45) {
      // porta di reparto
      if (u > 0.2 && u < 0.8) {
        const edge = u < 0.24 || u > 0.76;
        vr(ctx, x, Y, 0.04, 0.62, edge ? th.doorDark : th.door);
        if (!edge && u > 0.32 && u < 0.68) vr(ctx, x, Y, 0.36, 0.54, th.glass);
        if (!edge && u > 0.7 && u < 0.74) vr(ctx, x, Y, 0.22, 0.28, PAL.metal);
      }
      if (u > 0.38 && u < 0.62) vr(ctx, x, Y, 0.66, 0.74, kind < 0.22 ? PAL.blue : PAL.green);
    } else if (kind < 0.7) {
      // finestra
      if (u > 0.15 && u < 0.85) {
        const frame = u < 0.19 || u > 0.81 || (u > 0.48 && u < 0.52);
        vr(ctx, x, Y, 0.26, 0.74, th.frame);
        if (!frame) vr(ctx, x, Y, 0.3, 0.7, th.glass);
        if (!frame && u > 0.55 && u < 0.7) vr(ctx, x, Y, 0.5, 0.64, '#c8ecf8');
      }
    } else if (kind < 0.88) {
      // poster / bacheca
      if (u > 0.3 && u < 0.7) {
        const col = POSTER_COLORS[Math.floor(Px.hash(seg * 5 + 3) * POSTER_COLORS.length)];
        vr(ctx, x, Y, 0.3, 0.62, '#ffffff');
        vr(ctx, x, Y, 0.34, 0.58, col);
        if (u > 0.4 && u < 0.6) vr(ctx, x, Y, 0.42, 0.5, '#ffffff');
      }
    }
    // corrimano lungo la parete
    vr(ctx, x, Y, 0.27, 0.31, '#b4c0c8'); vr(ctx, x, Y, 0.3, 0.31, '#e8eef1'); vr(ctx, x, Y, 0.27, 0.275, '#8493a0');
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
    ctx.fillStyle = '#1b2a41';
    ctx.fillRect(0, 0, W, H);

    drawEndFace(ctx, st);

    // soffitto
    const yCeilEnd = Math.floor(HZ - CEIL * sEnd);
    for (let y = 0; y <= yCeilEnd; y += STEP) {
      const s = (HZ - y - STEP / 2) / CEIL;
      if (s < sEnd || s <= 0) continue;
      const w = zOf(s) + T;
      const th = theme(st, w);
      const half = WALL * s;
      const x0 = Math.max(0, rq(CX - half)), x1 = Math.min(W, rq(CX + half));
      ctx.fillStyle = (Math.floor(w / TILE) & 1) ? th.ceilA : th.ceilB;
      ctx.fillRect(x0, y, x1 - x0, STEP);
      if ((w / LIGHT_P) % 1 < 0.35) {
        const lh = 26 * s;
        ctx.fillStyle = th.light;
        ctx.fillRect(rq(CX - lh), y, Math.max(STEP, rq(2 * lh)), STEP);
      }
    }

    // pareti
    for (let x = 0; x < W; x += STEP) wallColumn(ctx, st, x);

    // pavimento
    const yFloorEnd = rq(Math.ceil(scrY(sEnd)));
    for (let y = yFloorEnd; y < H; y += STEP) {
      const s = (y + STEP / 2 - HZ) / (PY - HZ);
      if (s < sEnd) continue;
      const w = zOf(s) + T;
      const th = theme(st, w);
      const half = WALL * s;
      const x0 = Math.max(0, rq(CX - half)), x1 = Math.min(W, rq(CX + half));
      const lit = (w / LIGHT_P) % 1 < 0.35;
      ctx.fillStyle = lit ? th.floorHi : ((Math.floor(w / TILE) & 1) ? th.floorA : th.floorB);
      ctx.fillRect(x0, y, x1 - x0, STEP);
      const ew = Math.max(STEP, rq(5 * s));
      ctx.fillStyle = th.line;
      ctx.fillRect(x0, y, ew, STEP);
      ctx.fillRect(x1 - ew, y, ew, STEP);
      if ((w / 0.5) % 1 < 0.6) {
        const dx = 28 * s, lw = Math.max(STEP, rq(1.2 * s));
        ctx.fillRect(rq(CX - dx), y, lw, STEP);
        ctx.fillRect(rq(CX + dx), y, lw, STEP);
      }
    }
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

  return { render, drawGate, proj, zOf, scrY, laneX, laneXf, CX, WALL, S_MIN, THEMES };
})();
