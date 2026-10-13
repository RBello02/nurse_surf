// Finale personalizzato: sala della cerimonia, la protagonista prende e indossa la corona d'alloro,
// poi schermata celebrativa "CONGRATULAZIONI!" con coriandoli e fuochi d'artificio.
function FinaleScene(app, params) {
  const W = CFG.W, H = CFG.H, CX = W / 2;
  const outfit = params.outfit || 'uniforme';
  const fx = Fx.create();
  const FEET_END = 232, FEET_START = 304;
  const T_WALK = 3.2, T_LOOK = 3.9, T_FLY = 4.9, T_CELEB = 5.8, T_BUTTONS = 7.2;
  const TITLE = CFG.FINALE.title;
  let t = 0, wreathOn = false, flash = 1, shownFanfare = false, nextFirework = 6.2, pressed = null;
  const best = Save.get().best || 0;
  const score = params.score || 0;

  const BTN_AGAIN = { x: 30, y: 262, w: 120, h: 26 };
  const BTN_MENU = { x: 30, y: 292, w: 120, h: 20 };

  // ---- sprite: corona d'alloro (oggetto sul piedistallo) ----
  const wreathImg = Px.outlined(Px.make(24, 14, (c) => {
    const greens = ['#2f9e44', '#3fb858', '#1f7a33'];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const x = 12 + Math.cos(a) * 9.5, y = 6 + Math.sin(a) * 4.5;
      Px.rect(c, x - 1, y - 1, 3, 2, greens[i % 3]);
      if (i % 7 === 0) Px.rect(c, x, y, 1, 1, '#e0344b');
    }
    Px.rect(c, 4, 7, 3, 6, PAL.red);   // nastro
    Px.rect(c, 3, 12, 2, 2, PAL.redDark);
    Px.rect(c, 6, 11, 3, 3, PAL.red);
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
    crowdCache[k] = Px.outlined(Px.make(10, 15, (c) => {
      Px.rect(c, 2, 8, 6, 5, shirt);
      Px.rect(c, 2, 13, 2, 2, '#2c333d'); Px.rect(c, 6, 13, 2, 2, '#2c333d');
      if (up) { Px.rect(c, 0, 3, 2, 6, skin); Px.rect(c, 8, 3, 2, 6, skin); }
      else { Px.rect(c, 1, 8, 1, 4, skin); Px.rect(c, 8, 8, 1, 4, skin); }
      Px.rect(c, 3, 3, 4, 5, skin);
      Px.rect(c, 3, 2, 4, 2, hair); Px.rect(c, 3, 4, 1, 2, hair);
      Px.rect(c, 4, 5, 1, 1, '#2a1a10'); Px.rect(c, 6, 5, 1, 1, '#2a1a10');
      Px.rect(c, 4, 7, 2, 1, '#c4605a');
    }));
    return crowdCache[k];
  }
  const CROWD = [
    { x: 10, y: 300, s: 3 }, { x: 15, y: 268, s: 8 }, { x: 168, y: 304, s: 5 }, { x: 165, y: 272, s: 12 },
    { x: 150, y: 240, s: 17 }, { x: 141, y: 214, s: 23 }, { x: 22, y: 218, s: 29 }
  ];

  // ---- sala ----
  function drawHall(ctx) {
    Px.rect(ctx, 0, 0, W, 150, '#fbeccb');
    for (let x = 6; x < W; x += 20) Px.rect(ctx, x, 0, 1, 150, '#f1d9a0');
    Px.rect(ctx, 0, 118, W, 32, '#8a5a1f');
    Px.rect(ctx, 0, 118, W, 2, PAL.gold);
    for (let x = 4; x < W; x += 24) { Px.rect(ctx, x, 124, 16, 22, '#a06c2c'); Px.rect(ctx, x + 1, 125, 14, 1, '#bd8741'); }
    // tende laterali con pieghe
    for (const [x0, dir] of [[0, 1], [W - 32, -1]]) {
      for (let i = 0; i < 32; i++) Px.rect(ctx, x0 + i, 0, 1, 150, (i + (dir < 0 ? 1 : 0)) % 8 < 4 ? '#a82036' : '#c32b44');
      Px.rect(ctx, x0 + (dir > 0 ? 28 : 0), 0, 4, 150, '#7d1527');
    }
    Px.rect(ctx, 0, 0, W, 8, '#7d1527');
    for (let x = 0; x < W; x += 4) Px.rect(ctx, x, 8, 2, 3 + ((x / 4) % 2), PAL.gold);
    // striscione
    Px.rect(ctx, CX - 34, 12, 68, 18, PAL.goldDark);
    Px.rect(ctx, CX - 32, 14, 64, 14, '#1d2d7a');
    Px.text(ctx, CFG.FINALE.hallBanner, CX, 17, PAL.gold, 2, 'center');
    // festoni
    for (let x = 0; x < W; x += 12) {
      const sag = Math.round(Math.sin((x / 12) * Math.PI) * 0);
      const col = [PAL.red, PAL.gold, PAL.blue, PAL.green][(x / 12) % 4];
      Px.rect(ctx, x, 34 + sag, 10, 2, '#ffffff55');
      Px.rect(ctx, x + 1, 36, 8, 2, col); Px.rect(ctx, x + 2, 38, 6, 2, col); Px.rect(ctx, x + 3, 40, 4, 2, col); Px.rect(ctx, x + 4, 42, 2, 2, col);
    }
    // pavimento: parquet + tappeto rosso
    for (let y = 150; y < H; y++) {
      const v = (y - 150) / (H - 150);
      Px.rect(ctx, 0, y, W, 1, ((y >> 3) & 1) ? '#d9b57a' : '#c79f62');
      const half = Math.round(Px.lerp(15, 62, v));
      Px.rect(ctx, CX - half - 2, y, half * 2 + 4, 1, PAL.goldDark);
      Px.rect(ctx, CX - half, y, half * 2, 1, ((y >> 2) & 1) ? '#b3263e' : '#a82036');
    }
    // piedistallo
    const bx = CX, by = 172;
    ctx.fillStyle = 'rgba(16,21,31,0.3)'; ctx.fillRect(bx - 16, by - 2, 32, 4);
    Px.rect(ctx, bx - 12, 152, 24, 20, '#f3efe6');
    Px.rect(ctx, bx - 12, 152, 3, 20, '#ffffff');
    Px.rect(ctx, bx + 9, 152, 3, 20, '#cfc8b8');
    Px.rect(ctx, bx - 14, 148, 28, 5, PAL.goldDark);
    Px.rect(ctx, bx - 13, 146, 26, 3, PAL.red);
    Px.rect(ctx, bx - 14, 170, 28, 3, PAL.goldDark);
  }

  function drawCrowd(ctx) {
    const cheering = t > T_LOOK;
    for (const c of CROWD) {
      const up = cheering && (Math.floor(t * 4 + c.s) % 2 === 0);
      const bob = cheering ? Math.round(Math.abs(Math.sin(t * 7 + c.s)) * 4) : Math.round(Math.sin(t * 2 + c.s));
      const img = crowd(c.s, up ? 1 : 0);
      ctx.drawImage(img, c.x - img.width, c.y - img.height * 2 - bob, img.width * 2, img.height * 2);
    }
  }

  // ---- animazione ----
  function heroState() {
    let feet = FEET_END, pose = 'stand', wreath = wreathOn, lift = 0;
    if (t < T_WALK) {
      const p = Px.ease(t / T_WALK);
      feet = Px.lerp(FEET_START, FEET_END, p);
      pose = (Math.floor(t * 7) % 2) ? 'run1' : 'run0';
    } else if (t < T_FLY) {
      pose = t > T_LOOK + 0.2 ? 'cheer' : 'stand';
    } else {
      pose = 'cheer';
      if (t < T_CELEB) lift = Math.abs(Math.sin((t - T_FLY) * 9)) * 6;
      else lift = Math.abs(Math.sin(t * 5)) * 3;
    }
    return { feet, pose, wreath, lift };
  }

  function wreathPos() {
    const hs = heroState();
    const headY = FEET_END - 60 + 2;
    if (t < T_LOOK) return { x: CX, y: 143, s: 1, show: true };
    if (t < T_FLY) {
      const p = Px.ease((t - T_LOOK) / (T_FLY - T_LOOK));
      return {
        x: CX + Math.sin(p * Math.PI * 2) * 9,
        y: Px.lerp(143, headY - 3, p) - Math.sin(p * Math.PI) * 30,
        s: Px.lerp(1, 2, p), show: true
      };
    }
    return { show: false };
  }

  function update(dt) {
    t += dt;
    flash = Math.max(0, flash - dt * 2.2);
    fx.update(dt);
    if (t > T_LOOK - 0.7 && t < T_FLY && Math.random() < dt * 14) fx.burst(CX + (Math.random() - 0.5) * 24, 142, ['#fff3b0', '#ffffff'], 1, 14, 0.5, -10);
    if (t >= T_FLY && !wreathOn) {
      wreathOn = true; flash = 1;
      fx.burst(CX, FEET_END - 56, ['#fff3b0', '#ffffff', PAL.gold, '#7ee08f'], 34, 80, 0.9, 50, 2);
      if (!shownFanfare) { shownFanfare = true; Sfx.fanfare(); }
    }
    if (t > T_CELEB) {
      if (Math.random() < dt * 40) fx.confetti(W, [PAL.red, PAL.gold, PAL.blue, PAL.green, '#ffffff', PAL.pink, PAL.purple]);
      if (t > nextFirework) {
        nextFirework = t + 0.55 + Math.random() * 0.5;
        const cols = [[PAL.red, '#ff8a9c', '#ffffff'], [PAL.gold, '#fff3b0', '#ffffff'], ['#7fd3ff', '#ffffff', PAL.blue], ['#7ee08f', '#ffffff', PAL.gold]][(Math.random() * 4) | 0];
        fx.burst(20 + Math.random() * (W - 40), 70 + Math.random() * 60, cols, 26, 62, 1.0, 45, 2);
        Sfx.sparkle();
      }
    }
  }

  function drawTitle(ctx) {
    const p = Px.clamp((t - T_CELEB) / 0.7, 0, 1);
    if (p <= 0) return;
    const baseY = Math.round(Px.lerp(-20, 48, Px.ease(p)));
    const total = Px.textWidth(TITLE, 2);
    let x = Math.round(CX - total / 2);
    for (let i = 0; i < TITLE.length; i++) {
      const wave = Math.round(Math.sin(t * 6 + i * 0.6) * 2);
      const col = (Math.floor(t * 8 + i) % 3 === 0) ? '#ffffff' : PAL.gold;
      Px.text(ctx, TITLE[i], x, baseY + wave, col, 2, 'left', PAL.ink);
      x += 8;
    }
    if (p >= 1) {
      if (CFG.FINALE.subtitle) Px.text(ctx, CFG.FINALE.subtitle, CX, 68, '#ffffff', 1, 'center', PAL.ink);
      Px.text(ctx, 'PUNTI ' + score, CX, 80, '#fff3b0', 1, 'center', PAL.ink);
    }
  }

  function render(ctx) {
    drawHall(ctx);
    drawCrowd(ctx);

    // infermiera inseguitrice: ora applaude e fa i complimenti
    if (t > T_CELEB) {
      const spr = Chaser.get(Math.floor(t * 3) % 2);
      ctx.drawImage(spr, 2, 246 - spr.height + Math.round(Math.sin(t * 8) * 1));
      const bw = Px.textWidth(CFG.FINALE.chaserLine) + 8;
      Px.rect(ctx, 6, 180, bw, 13, PAL.ink);
      Px.rect(ctx, 7, 181, bw - 2, 11, '#fff3b0');
      Px.text(ctx, CFG.FINALE.chaserLine, 6 + bw / 2, 184, PAL.ink, 1, 'center');
    }

    // protagonista (scala 2, stessa identica per tutto il gioco)
    const hs = heroState();
    const sh = 22 - hs.lift;
    ctx.fillStyle = 'rgba(16,21,31,0.3)';
    ctx.fillRect(Math.round(CX - sh / 2), Math.round(hs.feet - 2), Math.round(sh), 3);
    Hero.draw(ctx, outfit, hs.pose, CX, Math.round(hs.feet - hs.lift), 2, { wreath: hs.wreath });

    // corona in volo
    const wp = wreathPos();
    if (wp.show) {
      const w = Math.round(wreathImg.width * wp.s), h = Math.round(wreathImg.height * wp.s);
      ctx.drawImage(wreathImg, Math.round(wp.x - w / 2), Math.round(wp.y - h / 2), w, h);
    }

    fx.draw(ctx);
    drawTitle(ctx);

    if (t > T_BUTTONS) {
      Px.button(ctx, BTN_AGAIN.x, BTN_AGAIN.y + (pressed === 'again' ? 1 : 0), BTN_AGAIN.w, BTN_AGAIN.h, 'RIGIOCA', { scale: 2, color: '#e0344b', dark: '#a82036', light: '#f06277' });
      Px.button(ctx, BTN_MENU.x, BTN_MENU.y, BTN_MENU.w, BTN_MENU.h, 'MENU', { color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
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
