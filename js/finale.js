// Finale personalizzato: sala della cerimonia, Martina prende e indossa la corona d'alloro,
// poi schermata celebrativa "CONGRATULAZIONI!" con coriandoli e fuochi d'artificio.
function FinaleScene(app, params) {
  const W = CFG.W, H = CFG.H, CX = W / 2;
  const outfit = params.outfit || 'uniforme';
  const fx = Fx.create();
  const HK = 2;                              // scala di Martina (intera: pixel netti)
  const FEET_END = 248, FEET_START = 316;
  const T_WALK = 3.2, T_LOOK = 3.9, T_FLY = 4.9, T_CELEB = 5.8, T_BUTTONS = 7.2;
  const TITLE = CFG.FINALE.title;
  let t = 0, wreathOn = false, flash = 1, shownFanfare = false, nextFirework = 6.2;
  const score = params.score || 0;
  const cfu = params.cfu || 0;

  const BTN_AGAIN = { x: 26, y: 262, w: 128, h: 28 };
  const BTN_MENU = { x: 26, y: 294, w: 128, h: 22 };

  // ---- sprite: corona d'alloro (oggetto sul piedistallo) ----
  const wreathImg = Px.outlined(Px.make(56, 32, (c) => {
    const greens = ['#2f9e44', '#3fb858', '#1f7a33'];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const x = 28 + Math.cos(a) * 22, y = 15 + Math.sin(a) * 10;
      Px.ell(c, x, y, 4, 3, greens[i % 3]);
      if (i % 8 === 0) Px.ell(c, x, y, 1, 1, '#e0344b');
    }
    Px.line(c, 12, 20, 6, 31, 4, PAL.red); Px.line(c, 16, 22, 15, 31, 4, PAL.redDark);
    Px.ell(c, 14, 22, 3, 3, PAL.red);
  }));

  // ---- sprite: persone del pubblico ----
  const crowdCache = {};
  const HAIR = ['#4a3224', '#d9a84e', '#1f1a17', '#b5502b', '#8c8c8c', '#e8d28a'];
  const SKIN = ['#f2c9a5', '#d9a982', '#a56b43', '#f7d6bd'];
  const SHIRT = [PAL.blue, PAL.green, PAL.purple, PAL.orange, PAL.pink, PAL.yellow, PAL.red];
  function crowd(seed, up) {
    const k = seed + '|' + up;
    if (crowdCache[k]) return crowdCache[k];
    const h = (n) => Px.hash(seed * 31 + n);
    const hair = HAIR[(h(1) * HAIR.length) | 0], skin = SKIN[(h(2) * SKIN.length) | 0], shirt = SHIRT[(h(3) * SHIRT.length) | 0];
    crowdCache[k] = Px.outlined(Px.make(44, 62, (c) => {
      c.fillStyle = '#2c333d'; c.fillRect(14, 50, 7, 10); c.fillRect(23, 50, 7, 10);
      Px.ell(c, 17, 60, 6, 2, '#1d1d24'); Px.ell(c, 27, 60, 6, 2, '#1d1d24');
      Px.bev(c, 10, 32, 24, 22, shirt, '#ffffff22', '#00000033');
      if (up) { Px.line(c, 10, 36, 4, 14, 5, skin); Px.line(c, 34, 36, 40, 14, 5, skin); Px.ell(c, 4, 12, 3, 3, skin); Px.ell(c, 40, 12, 3, 3, skin); }
      else { Px.line(c, 10, 36, 6, 52, 5, skin); Px.line(c, 34, 36, 38, 52, 5, skin); }
      Px.ell(c, 22, 20, 10, 11, skin);
      Px.ell(c, 22, 12, 11, 7, hair); c.fillStyle = hair; c.fillRect(11, 12, 4, 10);
      c.fillStyle = '#2a1a10'; c.fillRect(17, 20, 2, 3); c.fillRect(25, 20, 2, 3);
      if (up) { Px.ell(c, 22, 27, 3, 2, '#8a2f2f'); } else { c.fillStyle = '#c4605a'; c.fillRect(18, 27, 8, 1); }
    }));
    return crowdCache[k];
  }
  const CROWD = [
    { x: 12, y: 306, s: 3 }, { x: 16, y: 280, s: 8 }, { x: 168, y: 308, s: 5 }, { x: 166, y: 280, s: 12 },
    { x: 152, y: 252, s: 17 }, { x: 140, y: 228, s: 23 }, { x: 26, y: 232, s: 29 }
  ];

  // ---- sala ----
  function drawHall(ctx) {
    const R = (x, y, w, h, c) => Px.rect(ctx, x, y, w, h, c);
    R(0, 0, W, 150, '#fbeccb');
    for (let x = 6; x < W; x += 20) R(x, 0, 1, 150, '#f1d9a0');
    R(0, 118, W, 32, '#8a5a1f');
    R(0, 118, W, 2, PAL.gold);
    for (let x = 4; x < W; x += 24) { R(x, 124, 16, 22, '#a06c2c'); R(x + 1, 125, 14, 1, '#bd8741'); }
    for (const [x0, dir] of [[0, 1], [W - 32, -1]]) {
      for (let i = 0; i < 32; i++) R(x0 + i, 0, 1, 150, (i + (dir < 0 ? 1 : 0)) % 8 < 4 ? '#a82036' : '#c32b44');
      R(x0 + (dir > 0 ? 28 : 0), 0, 4, 150, '#7d1527');
    }
    R(0, 0, W, 8, '#7d1527');
    for (let x = 0; x < W; x += 4) R(x, 8, 2, 3 + ((x / 4) % 2), PAL.gold);
    // striscione
    R(CX - 36, 12, 72, 19, PAL.goldDark);
    R(CX - 34, 14, 68, 15, '#1d2d7a');
    Px.text(ctx, CFG.FINALE.hallBanner, CX, 18.5, PAL.gold, 3, 'center');
    // festoni
    for (let x = 0; x < W; x += 12) {
      const col = [PAL.red, PAL.gold, PAL.blue, PAL.green][(x / 12) % 4];
      R(x, 34, 10, 2, 'rgba(255,255,255,0.35)');
      R(x + 1, 36, 8, 2, col); R(x + 2, 38, 6, 2, col); R(x + 3, 40, 4, 2, col); R(x + 4, 42, 2, 2, col);
    }
    // pavimento: parquet + tappeto rosso
    for (let y = 150; y < H; y += 0.5) {
      const v = (y - 150) / (H - 150);
      R(0, y, W, 0.5, ((Math.floor(y) >> 3) & 1) ? '#d9b57a' : '#c79f62');
      const half = Math.round(Px.lerp(15, 62, v));
      R(CX - half - 2, y, half * 2 + 4, 0.5, PAL.goldDark);
      R(CX - half, y, half * 2, 0.5, ((Math.floor(y) >> 2) & 1) ? '#b3263e' : '#a82036');
    }
    // piedistallo
    const bx = CX;
    ctx.fillStyle = 'rgba(16,21,31,0.3)'; ctx.fillRect(bx - 18, 168, 36, 4);
    R(bx - 13, 148, 26, 22, '#f3efe6');
    R(bx - 13, 148, 4, 22, '#ffffff');
    R(bx + 9, 148, 4, 22, '#cfc8b8');
    R(bx - 16, 144, 32, 5, PAL.goldDark);
    R(bx - 15, 141, 30, 4, PAL.red);
    R(bx - 16, 168, 32, 3, PAL.goldDark);
  }

  function drawCrowd(ctx) {
    const cheering = t > T_LOOK;
    for (const c of CROWD) {
      const up = cheering && (Math.floor(t * 4 + c.s) % 2 === 0);
      const bob = cheering ? Math.abs(Math.sin(t * 7 + c.s)) * 4 : Math.sin(t * 2 + c.s) * 0.8;
      Px.blit(ctx, crowd(c.s, up ? 1 : 0), c.x, c.y - bob, 1);
    }
  }

  // ---- animazione ----
  function heroState() {
    let feet = FEET_END, pose = 'stand', lift = 0;
    if (t < T_WALK) {
      feet = Px.lerp(FEET_START, FEET_END, Px.ease(t / T_WALK));
      pose = Hero.run(t, 9).pose;
    } else if (t < T_FLY) {
      pose = t > T_LOOK + 0.2 ? 'cheer' : 'stand';
    } else {
      pose = 'cheer';
      lift = t < T_CELEB ? Math.abs(Math.sin((t - T_FLY) * 9)) * 6 : Math.abs(Math.sin(t * 5)) * 3;
    }
    return { feet, pose, lift };
  }

  function wreathPos() {
    const headY = FEET_END - 84;     // sommita' della testa di Martina
    if (t < T_LOOK) return { x: CX, y: 136, k: 0.8, show: true };
    if (t < T_FLY) {
      const p = Px.ease((t - T_LOOK) / (T_FLY - T_LOOK));
      return { x: CX + Math.sin(p * Math.PI * 2) * 10, y: Px.lerp(136, headY + 10, p) - Math.sin(p * Math.PI) * 30, k: Px.lerp(0.8, 1.0, p), show: true };
    }
    return { show: false };
  }

  function update(dt) {
    t += dt;
    flash = Math.max(0, flash - dt * 2.2);
    fx.update(dt);
    if (t > T_LOOK - 0.7 && t < T_FLY && Math.random() < dt * 14) fx.burst(CX + (Math.random() - 0.5) * 28, 136, ['#fff3b0', '#ffffff'], 1, 14, 0.5, -10);
    if (t >= T_FLY && !wreathOn) {
      wreathOn = true; flash = 1;
      fx.burst(CX, FEET_END - 78, ['#fff3b0', '#ffffff', PAL.gold, '#7ee08f'], 36, 85, 0.9, 50, 1.5);
      if (!shownFanfare) { shownFanfare = true; Sfx.fanfare(); }
    }
    if (t > T_CELEB) {
      if (Math.random() < dt * 40) fx.confetti(W, [PAL.red, PAL.gold, PAL.blue, PAL.green, '#ffffff', PAL.pink, PAL.purple]);
      if (t > nextFirework) {
        nextFirework = t + 0.55 + Math.random() * 0.5;
        const cols = [[PAL.red, '#ff8a9c', '#ffffff'], [PAL.gold, '#fff3b0', '#ffffff'], ['#7fd3ff', '#ffffff', PAL.blue], ['#7ee08f', '#ffffff', PAL.gold]][(Math.random() * 4) | 0];
        fx.burst(20 + Math.random() * (W - 40), 90 + Math.random() * 50, cols, 28, 62, 1.0, 45, 1.5);
        Sfx.sparkle();
      }
    }
  }

  function drawTitle(ctx) {
    const p = Px.clamp((t - T_CELEB) / 0.7, 0, 1);
    if (p <= 0) return;
    const baseY = Px.lerp(-20, 52, Px.ease(p));
    const f = 3, u = f * 0.5;
    const x0 = CX - Px.textWidth(TITLE, f) / 2;
    for (let i = 0; i < TITLE.length; i++) {
      const wave = Math.sin(t * 6 + i * 0.6) * 2;
      Px.text(ctx, TITLE[i], x0 + Px.textWidth(TITLE.slice(0, i), f), baseY + wave, (Math.floor(t * 8 + i) % 3 === 0) ? '#ffffff' : PAL.gold, f, 'left', PAL.ink);
    }
    if (p >= 1) {
      if (CFG.FINALE.subtitle) Px.text(ctx, CFG.FINALE.subtitle, CX, 72, '#ffffff', 2, 'center', PAL.ink);
      Px.text(ctx, 'PUNTI ' + score + '   CFU ' + cfu + '/' + CFG.CFU_GOAL, CX, 86, '#fff3b0', 2, 'center', PAL.ink);
    }
  }

  function render(ctx) {
    drawHall(ctx);
    drawCrowd(ctx);

    // infermiera: ora applaude e fa i complimenti
    if (t > T_CELEB) {
      Chaser.draw(ctx, 38, 262 + Math.sin(t * 8) * 0.8, 0.7, Math.floor(t * 5), 'front');
      const bw = Px.textWidth(CFG.FINALE.chaserLine, 2) + 10;
      Px.rect(ctx, 4, 176, bw, 16, PAL.ink);
      Px.rect(ctx, 5, 177, bw - 2, 14, '#fff3b0');
      Px.text(ctx, CFG.FINALE.chaserLine, 4 + bw / 2, 180.5, PAL.ink, 2, 'center');
    }

    // Martina (stessa identica di sempre: frangia, occhi castani, capelli castano chiaro)
    const hs = heroState();
    const sh = 40 - hs.lift;
    ctx.fillStyle = 'rgba(16,21,31,0.3)';
    ctx.fillRect(CX - sh / 2, hs.feet - 2, sh, 4);
    Hero.draw(ctx, outfit, hs.pose, CX, hs.feet - hs.lift + 1, HK, { wreath: wreathOn });

    // corona in volo
    const wp = wreathPos();
    if (wp.show) Px.blit(ctx, wreathImg, wp.x, wp.y + Px.lh(wreathImg) * 0.25 * wp.k, wp.k);

    fx.draw(ctx);
    drawTitle(ctx);

    if (t > T_BUTTONS) {
      Px.button(ctx, BTN_AGAIN.x, BTN_AGAIN.y, BTN_AGAIN.w, BTN_AGAIN.h, 'RIGIOCA', { f: 4, color: '#e0344b', dark: '#a82036', light: '#f06277' });
      Px.button(ctx, BTN_MENU.x, BTN_MENU.y, BTN_MENU.w, BTN_MENU.h, 'MENU', { f: 3, color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
    }
    if (flash > 0) { ctx.fillStyle = `rgba(255,247,214,${Math.min(1, flash)})`; ctx.fillRect(0, 0, W, H); }
  }

  function input(action, p) {
    if (t < T_BUTTONS) return;
    if (action === 'tap') {
      if (Px.hit(BTN_AGAIN, p, 3)) { Sfx.select(); app.go('game', { outfit }); }
      else if (Px.hit(BTN_MENU, p, 3)) { Sfx.select(); app.go('menu'); }
    } else if (action === 'confirm') { Sfx.select(); app.go('game', { outfit }); }
  }

  return { enter() { Sfx.stopMusic(); }, leave() {}, update, render, input };
}
