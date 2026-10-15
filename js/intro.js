// Scena iniziale: Martina arriva all'ospedale, si presenta, e l'infermiera vuole farle la puntura.
// Le battute scorrono solo toccando lo schermo, oppure SALTA per andare subito alla corsa.
function IntroScene(app, params) {
  const W = CFG.W, H = CFG.H;
  const outfit = (params && params.outfit) || 'uniforme';
  const TX = CFG.INTRO;
  const FEET = 292;
  // Le battute scorrono SOLO al tocco: ogni tocco passa alla successiva. I tempi sono presi al volo.
  const SCRIPT = TX.script;
  const T_EXT = 2.8, T_FIRST = 3.0;
  let T_NURSE = Infinity, T_N1 = Infinity, T_SCARE = Infinity, T_RUN = Infinity, idx = -1;
  const SKIP = { x: W - 52, y: 4, w: 48, h: 18 };
  const fx = Fx.create();
  let t = 0, left = false, doorDone = false;

  const rr = (ctx, x, y, w, h, c) => Px.rect(ctx, x, y, w, h, c);
  function circle(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  // ---------- esterno dell'ospedale ----------
  function drawExterior(ctx) {
    const bands = ['#8fd0ee', '#a3d9f1', '#b8e2f5', '#cdeaf8', '#e0f2fb'];
    bands.forEach((c, i) => rr(ctx, 0, i * 20, W, 21, c));
    rr(ctx, 0, 100, W, 160, '#e0f2fb');   // cielo fino al marciapiede
    const cx = (t * 4) % 220;
    for (const [bx, by, s] of [[30, 38, 1], [120, 22, 1.3], [170, 60, 0.8]]) {
      const x = ((bx + cx) % 220) - 20;
      circle(ctx, x, by, 9 * s, '#ffffff'); circle(ctx, x + 11 * s, by + 2, 11 * s, '#ffffff'); circle(ctx, x - 11 * s, by + 3, 8 * s, '#ffffff');
    }
    // edificio
    rr(ctx, 6, 82, 168, 172, '#e9eff2'); rr(ctx, 6, 82, 168, 6, '#c3cdd3'); rr(ctx, 6, 246, 168, 8, '#b4c0c8');
    rr(ctx, 6, 82, 4, 172, '#f7fafb'); rr(ctx, 170, 82, 4, 172, '#cfd9de');
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) {
      const x = 16 + i * 38, y = 98 + r * 36;
      rr(ctx, x, y, 26, 26, '#ffffff'); rr(ctx, x + 2, y + 2, 22, 22, '#7ec4e6');
      rr(ctx, x + 2, y + 2, 22, 4, '#a9dcf3'); rr(ctx, x + 12, y + 2, 1, 22, '#ffffff'); rr(ctx, x + 2, y + 13, 22, 1, '#ffffff');
      rr(ctx, x - 1, y + 26, 28, 2, '#b4c0c8');
    }
    // insegna con croce
    rr(ctx, 30, 50, 120, 30, PAL.ink); rr(ctx, 32, 52, 116, 26, '#2f6fd0'); rr(ctx, 32, 52, 116, 3, '#6ea0ec');
    rr(ctx, 40, 56, 18, 18, '#ffffff'); rr(ctx, 46, 58, 6, 14, PAL.red); rr(ctx, 42, 62, 14, 6, PAL.red);
    Px.text(ctx, TX.sign, 102, 60, '#ffffff', 3, 'center', '#1d3f87');
    // ingresso
    rr(ctx, 60, 186, 60, 8, PAL.red); rr(ctx, 60, 186, 60, 2, '#f06277'); rr(ctx, 62, 194, 4, 58, '#b4c0c8'); rr(ctx, 114, 194, 4, 58, '#b4c0c8');
    rr(ctx, 66, 194, 48, 58, '#7ec4e6'); rr(ctx, 66, 194, 48, 8, '#a9dcf3'); rr(ctx, 89, 194, 2, 58, '#ffffff');
    rr(ctx, 85, 224, 2, 10, '#c4ccd3'); rr(ctx, 93, 224, 2, 10, '#c4ccd3');
    // marciapiede e cespugli
    rr(ctx, 0, 254, W, H - 254, '#c9d2d8'); rr(ctx, 0, 254, W, 3, '#dfe6ea');
    for (let x = 0; x < W; x += 30) rr(ctx, x, 262, 1, H - 262, '#b4bfc6');
    rr(ctx, 0, 276, W, 1, '#b4bfc6');
    for (const bx of [22, 160]) { circle(ctx, bx, 246, 12, '#2f9e44'); circle(ctx, bx - 8, 250, 9, '#3fb858'); circle(ctx, bx + 8, 250, 9, '#1f7a33'); rr(ctx, bx - 14, 252, 28, 5, '#8a5a1f'); }
  }

  // ---------- atrio interno ----------
  function drawLobby(ctx) {
    rr(ctx, 0, 0, W, 238, '#d5eaf0'); rr(ctx, 0, 0, W, 6, '#eef6f8');
    rr(ctx, 0, 190, W, 48, '#9bc4d0'); rr(ctx, 0, 188, W, 3, '#f2f8fa'); rr(ctx, 0, 236, W, 3, '#6c8f9b');
    for (let x = 6; x < W; x += 30) rr(ctx, x, 192, 1, 44, '#86b0bd');
    // pavimento a piastrelle
    for (let y = 239; y < H; y += 9) for (let x = ((((y - 239) / 9) | 0) % 2) * 15 - 15; x < W; x += 30) { rr(ctx, x, y, 15, 9, '#eef4f6'); rr(ctx, x + 15, y, 15, 9, '#d5e1e5'); }
    rr(ctx, 0, 239, W, 2, '#b9c8ce');
    // cartello accettazione
    rr(ctx, 12, 34, 84, 22, PAL.ink); rr(ctx, 14, 36, 80, 18, '#3bb273'); rr(ctx, 14, 36, 80, 2, '#6fd9a2');
    Px.text(ctx, 'ACCETTAZIONE', 54, 42, '#ffffff', 2, 'center', '#26875a');
    // orologio
    circle(ctx, 124, 46, 14, PAL.ink); circle(ctx, 124, 46, 12, '#ffffff');
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(124, 46); ctx.lineTo(124, 38); ctx.moveTo(124, 46); ctx.lineTo(130, 49); ctx.stroke();
    // poster
    rr(ctx, 12, 76, 34, 46, '#ffffff'); rr(ctx, 15, 79, 28, 40, '#f08fb0'); circle(ctx, 29, 96, 8, '#ffffff'); rr(ctx, 27, 90, 4, 12, PAL.red); rr(ctx, 23, 94, 12, 4, PAL.red);
    Px.text(ctx, 'LAVATI', 29, 108, '#ffffff', 1, 'center');
    // porta a battenti a destra
    rr(ctx, 134, 112, 42, 126, '#6f8794'); rr(ctx, 137, 116, 36, 122, '#8fa7b3'); rr(ctx, 154, 116, 2, 122, '#6f8794');
    rr(ctx, 140, 124, 12, 24, '#9bd8ee'); rr(ctx, 158, 124, 12, 24, '#9bd8ee'); rr(ctx, 150, 168, 2, 12, '#c4ccd3'); rr(ctx, 158, 168, 2, 12, '#c4ccd3');
    // pianta
    rr(ctx, 100, 218, 18, 20, '#c0804a'); rr(ctx, 100, 218, 18, 3, '#d9a76a');
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#2f9e44' : '#3fb858'; ctx.beginPath(); ctx.ellipse(109 + (i - 2.5) * 5, 208 - (i % 3) * 5, 4, 12, (i - 2.5) * 0.28, 0, Math.PI * 2); ctx.fill(); }
  }

  // ---------- fumetti ----------
  function bubble(ctx, lines, cx, bottomY, tailX, bg = '#ffffff') {
    const f = 2;
    const tw = Math.max(...lines.map((l) => Px.textWidth(l, f))) + 14;
    const th = lines.length * 11 + 8;
    const bx = Px.clamp(cx - tw / 2, 3, W - tw - 3), by = bottomY - th - 8;
    rr(ctx, bx, by, tw, th, PAL.ink); rr(ctx, bx + 1, by + 1, tw - 2, th - 2, bg);
    rr(ctx, bx + 1, by + 1, tw - 2, 2, 'rgba(255,255,255,0.0)');
    // codina
    const tx = Px.clamp(tailX, bx + 8, bx + tw - 14);
    for (let i = 0; i < 6; i++) { rr(ctx, tx - 6 + i, by + th + i - 1, 12 - i * 2, 1.5, PAL.ink); rr(ctx, tx - 5 + i, by + th + i - 1, 10 - i * 2, 1.5, bg); }
    lines.forEach((l, i) => Px.text(ctx, l, bx + tw / 2, by + 5 + i * 11, PAL.ink, f, 'center'));
  }

  function star(ctx, x, y, r, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x - r, y - 0.5, r * 2, 1); ctx.fillRect(x - 0.5, y - r, 1, r * 2);
    ctx.fillRect(x - r / 2, y - r / 2, r, r);
  }

  // ---------- personaggi ----------
  const T_END = () => T_RUN + 1.4;
  const beatReady = () => (idx === -1 && t >= T_FIRST) || idx >= 0 && idx < SCRIPT.length && t >= SCRIPT[idx].__start;

  function advance() {
    const next = idx + 1;
    if (next >= SCRIPT.length) { if (T_RUN === Infinity) { T_RUN = t; Sfx.lane(); } idx = SCRIPT.length; return; }
    const b = SCRIPT[next];
    if (b.who === 'n' && T_NURSE === Infinity) { T_NURSE = t; T_N1 = t + 0.9; b.__start = T_N1; }
    else b.__start = t;
    if (b.scare && T_SCARE === Infinity) { T_SCARE = b.__start; Sfx.hit(); } else if (b.who !== 'n' || T_NURSE !== t) Sfx.lane();
    idx = next;
  }

  function marinaPose() {
    if (t < T_EXT) return { x: Px.lerp(-34, 62, Px.ease(Px.clamp(t / T_EXT, 0, 1))), pose: Hero.run(t, 10).pose, dy: Hero.run(t, 10).bob };
    if (t < T_RUN) {
      let x = 62, dy = 0, pose = 'stand';
      if (t > T_FIRST && t < T_NURSE && Math.floor(t * 3) % 2) dy = 1;
      if (t >= T_SCARE) { pose = 'jump'; dy = Math.abs(Math.sin((t - T_SCARE) * 12)) * 4; x += Math.sin(t * 40) * 1.2; }
      return { x, pose, dy };
    }
    const p = Px.clamp((t - T_RUN) / 1.0, 0, 1);
    return { x: Px.lerp(62, -50, p * p), pose: Hero.run(t, 14).pose, dy: Hero.run(t, 14).bob };
  }

  function nurseX() {
    if (t < T_NURSE) return 230;
    if (t < T_NURSE + 0.8) return Px.lerp(230, 124, 1 - Math.pow(1 - (t - T_NURSE) / 0.8, 3));
    if (t < T_RUN + 0.3) return 124;
    const p = Px.clamp((t - T_RUN - 0.3) / 1.0, 0, 1);
    return Px.lerp(124, -60, p * p);
  }

  function render(ctx) {
    if (t < T_EXT) drawExterior(ctx); else drawLobby(ctx);
    fx.draw(ctx);

    // Martina (k=2: scala intera, pixel netti)
    const m = marinaPose();
    ctx.fillStyle = 'rgba(16,21,31,0.25)';
    ctx.fillRect(m.x - 18, FEET - 2, 36, 4);
    const talkM = beatReady() && idx >= 0 && idx < SCRIPT.length && SCRIPT[idx].who === 'm' && t < T_RUN;
    const idleM = m.pose === 'stand' ? (talkM ? Math.abs(Math.sin(t * 9)) * 1.6 : Math.sin(t * 2.5) * 0.5) : 0;
    ctx.save(); ctx.translate(m.x, FEET - m.dy - idleM); ctx.rotate(m.pose === 'stand' && talkM ? Math.sin(t * 6) * 0.03 : 0);
    Hero.draw(ctx, outfit, m.pose, 0, 0, 2);
    ctx.restore();

    // infermiera con la siringa gigante
    const nx = nurseX();
    if (t >= T_NURSE && nx < 215) {
      const moving = t < T_NURSE + 0.8 || t > T_RUN + 0.3;
      const bounce = moving ? Math.abs(Math.sin(t * 14)) * 3 : Math.sin(t * 5) * 0.8;
      ctx.fillStyle = 'rgba(16,21,31,0.25)'; ctx.fillRect(nx - 30, FEET - 2, 60, 4);
      const talkN = beatReady() && idx >= 0 && idx < SCRIPT.length && SCRIPT[idx].who === 'n' && t < T_RUN;
      ctx.save(); ctx.translate(nx, FEET + 4 - bounce - (talkN ? Math.abs(Math.sin(t * 8)) * 2 : 0));
      ctx.rotate(moving ? Math.sin(t * 12) * 0.03 : Math.sin(t * (talkN ? 7 : 2.5)) * (talkN ? 0.045 : 0.02));
      Chaser.draw(ctx, 0, 0, 1, Math.floor(t * (moving ? 12 : 4)), 'front');
      ctx.restore();
      // luccichio sull'ago
      if (t > T_N1 && t < T_RUN && Math.floor(t * 3) % 2 === 0) star(ctx, nx - 54.5 + 93.5, FEET + 4 - 96 + 7, 4, '#ffffff');
    }

    // sorpresa
    if (t > T_NURSE + 0.5 && t < T_N1 + 0.4) {
      const bob = Math.sin(t * 16) * 1.2;
      Px.text(ctx, '!', m.x, FEET - 118 + bob, PAL.red, 8, 'center', '#ffffff');
    }

    // battute
    const cur = beatReady() ? SCRIPT[idx] : null;
    if (cur && t < T_RUN) {
      if (cur.who === 'm') bubble(ctx, cur.lines, m.x + 12, FEET - 100 - m.dy, m.x);
      else bubble(ctx, cur.lines, nx - 6, FEET - 112, nx - 32, '#fff3b0');
    } else if (t >= T_RUN && t < T_END() - 0.5) Px.text(ctx, 'SCAPPA!', W / 2, 120, PAL.gold, 7, 'center', PAL.ink);

    // dissolvenza fra esterno e atrio
    const a = Math.max(0, 1 - Math.abs(t - T_EXT) / 0.25);
    if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(0, 0, W, H); }

    // comandi
    if (t > 0.4) Px.button(ctx, SKIP.x, SKIP.y, SKIP.w, SKIP.h, 'SALTA', { f: 2, color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
    if ((beatReady() || t < T_FIRST) && t > 1 && Math.floor(t * 2) % 2 === 0) Px.text(ctx, 'TOCCA PER CONTINUARE', W / 2, 308, '#ffffff', 1, 'center', PAL.ink);
  }

  function update(dt) {
    t += dt;
    fx.update(dt);
    if (!left && t >= T_NURSE && !doorDone) { doorDone = true; Sfx.door(); fx.burst(200, 240, ['#fff', '#d3dfe3'], 8, 30, 0.4, 20); }
    if (!left && t >= T_END()) go();
  }

  function go() {
    if (left) return;
    left = true;
    app.go('game', { outfit }, { color: '#ffffff', time: 0.35 });
  }

  function tapNext() {
    if (t < T_FIRST) { t = T_FIRST; return; }          // salta la camminata iniziale
    if (beatReady()) advance();                        // se l'infermiera sta ancora entrando, il tocco non conta
  }

  function input(action, p) {
    if (action === 'tap') {
      if (Px.hit(SKIP, p, 6)) { Sfx.select(); go(); return; }
      tapNext();
    } else if (action === 'confirm') tapNext();
  }

  return { enter() { Sfx.stopMusic(); }, leave() {}, update, render, input };
}
