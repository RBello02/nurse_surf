// Scena di gioco: endless runner a 3 corsie nel corridoio dell'ospedale.
function GameScene(app, outfit) {
  const W = CFG.W, H = CFG.H, PY = CFG.PLAYER_Y, HK = CFG.HERO_K;
  const fx = Fx.create();

  // Stato del mondo (letto da World.render)
  const st = { T: 0, specialStart: Infinity, uniStart: Infinity, endW: null, doorOpen: 0 };

  const g = {
    time: 0, speed: CFG.START_SPEED,
    lane: 1, laneF: 1, jumpT: 0, slideT: 0,
    objs: [], nextRowW: 2.6,
    zone: 'hospital', zoneBannerT: 0, uniGate: false,
    hits: 0, cfu: 0, medals: 0, healCount: 0, invul: 0, stumble: 0, sinceHit: 0,
    gapTarget: CFG.CHASER_START_GAP, gapV: CFG.CHASER_START_GAP, chaserLane: 1,
    phase: 'run',          // run | corridor | caught | over | finishing
    phaseT: 0, shake: 0, flash: 0, paused: false,
    bubble: '', bubbleT: 0, frameT: 0, score: 0, finale: false, best: Save.get().best || 0, newBest: false
  };

  const PAUSE_BTN = { x: W - 20, y: 3, w: 17, h: 17 };
  const BTN_RETRY = { x: 30, y: 184, w: 120, h: 30 };
  const BTN_MENU = { x: 30, y: 222, w: 120, h: 26 };
  const BTN_RESUME = { x: 30, y: 150, w: 120, h: 30 };
  const BTN_QUIT = { x: 30, y: 188, w: 120, h: 26 };

  // icone HUD: croce medica (vite) e medaglietta
  const crossOn = Px.outlined(Px.make(16, 16, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 16, 16); c.fillStyle = PAL.red; c.fillRect(6, 1, 4, 14); c.fillRect(1, 6, 14, 4); c.fillStyle = '#f06277'; c.fillRect(6, 1, 1, 14); c.fillRect(1, 6, 14, 1); }));
  const crossOff = Px.tint(crossOn, '#3a4350');
  const medalImg = Props.medal();

  // ---------- generazione ostacoli ----------
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const KINDS = ['jump', 'slide', 'block'];
  const add = (lane, type, w) => g.objs.push({ lane, w, p: Props.get(type), done: false, seed: Math.random() * 6.28 });
  const cfuLine = (w, lane) => { for (let i = 0; i < 3; i++) add(lane, 'cfu', w + i * 0.22); };

  function spawnRow(w, d) {
    const x = Math.random();
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    let used;
    if (x < 0.55 - d * 0.25) {
      add(lanes[0], pick(Props.SETS[g.uniGate ? 'uni' : 'hospital'][pick(KINDS)]), w); used = [lanes[0]];
    } else if (x < 0.88 - d * 0.1) {
      for (let i = 0; i < 2; i++) add(lanes[i], pick(Props.SETS[g.uniGate ? 'uni' : 'hospital'][pick(KINDS)]), w);
      used = [lanes[0], lanes[1]];
    } else {
      // tutte e tre le corsie: almeno una non e' un blocco (si supera con salto o scivolata)
      const ks = [pick(KINDS), pick(KINDS), pick(KINDS)];
      if (ks.every((k) => k === 'block')) ks[(Math.random() * 3) | 0] = pick(['jump', 'slide']);
      for (let i = 0; i < 3; i++) add(lanes[i], pick(Props.SETS[g.uniGate ? 'uni' : 'hospital'][ks[i]]), w);
      used = [0, 1, 2];
    }
    const free = [0, 1, 2].filter((l) => !used.includes(l));
    if (free.length && Math.random() < 0.45) add(pick(free), 'cfu', w);
  }

  function updateSpawn() {
    const d = Px.clamp(g.time / CFG.RAMP_TIME, 0, 1);
    while (g.nextRowW < st.T + 3.1) {
      if (g.cfu >= CFG.CFU_GOAL) { startCorridor(); break; }
      if (!g.uniGate && g.cfu >= CFG.UNI_AT_CFU) startUni();
      spawnRow(g.nextRowW, d);
      const gapW = Px.lerp(1.25, 0.88, d) * g.speed;
      if (Math.random() < 0.5) cfuLine(g.nextRowW + gapW * 0.35, (Math.random() * 3) | 0);
      g.nextRowW += gapW;
    }
  }

  // Passaggio dall'ospedale all'universita': arco d'ingresso, poi nuove pareti, pavimento e ostacoli
  function startUni() {
    g.uniGate = true;
    st.uniStart = g.nextRowW + 0.5;
    g.nextRowW = st.uniStart + 0.8;
    g.zoneChangeW = st.uniStart;
  }

  function startCorridor() {
    if (g.finale) return;
    g.finale = true;
    g.phase = 'corridor';
    st.specialStart = g.nextRowW + 0.5;
    st.endWTarget = st.specialStart + 7.5;
    const seq = [1, 1, 0, 1, 2, 1, 1, 0, 1, 2, 1];
    seq.forEach((l, i) => add(l, 'cfu', st.specialStart + 0.9 + i * 0.5));
    Sfx.warn();
  }

  // ---------- azioni del giocatore ----------
  function jumpHeight() {
    if (g.jumpT <= 0) return 0;
    const p = 1 - g.jumpT / CFG.JUMP_TIME;
    return 4 * CFG.JUMP_PEAK * p * (1 - p);
  }

  function act(action) {
    if (g.paused || g.phase === 'caught' || g.phase === 'over' || g.phase === 'finishing') return;
    if (action === 'left' && g.lane > 0) { g.lane--; Sfx.lane(); }
    else if (action === 'right' && g.lane < CFG.LANES - 1) { g.lane++; Sfx.lane(); }
    else if (action === 'up') {
      if (g.jumpT <= 0) {
        g.slideT = 0; g.jumpT = CFG.JUMP_TIME; Sfx.jump();
        fx.burst(World.laneXf(g.laneF, 1), PY, ['#ffffff', '#d3dfe3'], 6, 30, 0.3, 40);
      }
    } else if (action === 'down') {
      if (g.slideT <= 0) { g.jumpT = 0; g.slideT = CFG.SLIDE_TIME; Sfx.slide(); }
    }
  }

  // ---------- collisioni ----------
  function onHit() {
    g.hits++;
    g.invul = 1.4; g.stumble = 0.8; g.shake = 0.35; g.sinceHit = 0;
    g.gapTarget = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP;
    g.bubble = pick(CFG.ZONES[g.zone].bubbles); g.bubbleT = 1.6;
    Sfx.hit();
    fx.burst(World.laneXf(g.laneF, 1), PY - 26, ['#ffd23f', '#ffffff', '#e0344b'], 18, 80, 0.5, 120);
    if (g.hits >= CFG.MAX_HITS) {
      g.phase = 'caught'; g.phaseT = 0; g.gapTarget = -0.2; g.jumpT = 0; g.slideT = 0;
      Sfx.stopMusic();
    }
  }

  function collide() {
    for (const o of g.objs) {
      if (o.done) continue;
      const z = o.w - st.T;
      if (z > 0.06 || z < -o.p.len) continue;
      const dl = Math.abs(g.laneF - o.lane);
      if (o.p.kind === 'pickup') {
        if (dl > 0.7) continue;
        o.done = true; g.medals++; g.cfu = Math.min(CFG.CFU_GOAL, g.cfu + CFG.CFU_PER_MEDAL); g.healCount++;
        Sfx.coin();
        fx.burst(World.laneXf(o.lane, 1), PY - 40, ['#ffe27a', '#ffffff', '#c9962a'], 10, 45, 0.4, 20);
        if (g.healCount >= 6) {
          g.healCount = 0;
          if (g.hits > 0) { g.hits--; g.gapTarget = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP; g.bubble = ''; Sfx.start(); }
        }
        continue;
      }
      if (g.invul > 0 || g.phase !== 'run' || dl > 0.5) continue;
      let hit;
      if (o.p.kind === 'jump') hit = jumpHeight() < o.p.clear;
      else if (o.p.kind === 'slide') hit = g.slideT <= 0;
      else hit = true;
      if (hit) { o.done = true; onHit(); }
    }
  }

  // ---------- aggiornamento ----------
  function update(dt) {
    if (g.paused) return;
    g.frameT += dt;
    fx.update(dt);
    g.bubbleT = Math.max(0, g.bubbleT - dt);
    g.shake = Math.max(0, g.shake - dt);
    g.flash = Math.max(0, g.flash - dt);

    if (g.phase === 'over') { g.phaseT += dt; return; }
    if (g.phase === 'caught') {
      g.phaseT += dt;
      g.speed = Math.max(0, g.speed - dt * 3);
      st.T += g.speed * dt;
      g.gapV += (g.gapTarget - g.gapV) * Math.min(1, dt * 5);
      if (g.phaseT > 1.5) finish();
      return;
    }

    g.time += dt; g.sinceHit += dt;
    g.invul = Math.max(0, g.invul - dt);
    g.stumble = Math.max(0, g.stumble - dt);

    let target = Math.min(CFG.MAX_SPEED, CFG.START_SPEED + CFG.SPEED_GAIN * g.time);
    if (g.phase === 'corridor' || g.phase === 'finishing') target = Math.min(target, 1.25);
    g.speed += (target - g.speed) * Math.min(1, dt * 2);
    st.T += g.speed * (1 - 0.45 * (g.stumble / 0.8)) * dt;

    g.laneF += Math.sign(g.lane - g.laneF) * Math.min(Math.abs(g.lane - g.laneF), dt / CFG.LANE_SWITCH_TIME);
    if (g.jumpT > 0) g.jumpT = Math.max(0, g.jumpT - dt);
    if (g.slideT > 0) g.slideT = Math.max(0, g.slideT - dt);

    g.chaserLane += (g.laneF - g.chaserLane) * Math.min(1, dt * 4);
    if (g.hits > 0 && g.sinceHit > 10 && g.phase === 'run') {
      g.hits--; g.sinceHit = 0; g.gapTarget = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP;
    }
    if (g.phase !== 'run') g.gapTarget = 1.1;
    g.gapV += (g.gapTarget - g.gapV) * Math.min(1, dt * 3);

    if (g.zoneChangeW != null && st.T >= g.zoneChangeW && g.zone !== 'uni') { g.zone = 'uni'; g.zoneBannerT = 3; Sfx.start(); }
    g.zoneBannerT = Math.max(0, g.zoneBannerT - dt);
    if (g.phase === 'run' || g.phase === 'corridor') updateSpawn();

    if (st.endWTarget != null && st.endW == null && st.endWTarget - st.T <= 3.0) st.endW = st.endWTarget;
    if (st.endW != null) {
      st.doorOpen = Px.clamp((1.7 - (st.endW - st.T)) / 1.0, 0, 1);
      if (st.endW - st.T < 0.35 && g.phase !== 'finishing') {
        g.phase = 'finishing'; g.phaseT = 0; g.flash = 0.5;
        Sfx.door(); Sfx.stopMusic();
        app.go('finale', { outfit, score: g.score + 500, cfu: g.cfu }, { color: '#fff7d6', time: 0.45 });
      }
    }
    if (g.phase === 'corridor' && g.frameT % 0.05 < dt) fx.confetti(W, [PAL.red, PAL.gold, PAL.blue, PAL.green, '#fff', PAL.pink]);

    collide();
    g.objs = g.objs.filter((o) => o.w - st.T > -0.4);
    g.score = Math.floor(st.T * 10) + g.cfu * 25;
  }

  function finish() {
    g.phase = 'over'; g.phaseT = 0;
    if (g.score > g.best) { g.best = g.score; g.newBest = true; Save.set({ best: g.best }); }
    Sfx.gameOver();
  }

  // ---------- disegno ----------
  function drawObj(ctx, o) {
    const z = o.w - st.T;
    if (z > 3.0 || z < -0.3 || o.done) return;
    const s = World.proj(z);
    const img = o.p.img;
    let w = img.width * 0.5 * s;
    const h = img.height * 0.5 * s;
    const x = World.laneXf(o.lane, s);
    let y = World.scrY(s);
    if (o.p.kind === 'pickup') {
      y -= (26 + Math.sin(g.time * 6 + o.seed) * 3) * s;
      w *= 0.3 + 0.7 * Math.abs(Math.cos(g.time * 4 + o.seed));      // la medaglia gira su se stessa
    }
    ctx.globalAlpha = Px.clamp((3.0 - z) / 0.7, 0, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, x - w / 2, y - h, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
  }

  // icona "cosa devo fare" sopra l'ostacolo, visibile quando e' vicino
  function drawHint(ctx, o) {
    const k = o.p.kind;
    if (k === 'pickup' || o.done) return;
    const z = o.w - st.T;
    if (z > 1.6 || z < 0.12) return;
    const s = World.proj(z);
    const img = Props.hint(k);
    const hs = Math.max(s, 0.5);
    const w = img.width * 0.5 * hs, h = img.height * 0.5 * hs;
    const x = World.laneXf(o.lane, s);
    const top = (o.p.topUnits || 40) + 8;
    const bob = Math.sin(g.time * 9) * 2 * hs;
    ctx.globalAlpha = Px.clamp((1.6 - z) / 0.3, 0, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, x - w / 2, World.scrY(s) - top * s - h + bob, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
  }

  function drawHero(ctx) {
    const jh = jumpHeight();
    const x = World.laneXf(g.laneF, 1);
    let pose;
    if (g.phase === 'caught' || g.phase === 'over') pose = 'stand';
    else if (g.slideT > 0) pose = 'slide';
    else if (jh > 0.5) pose = 'jump';
    else pose = (Math.floor(g.frameT * 9) % 2) ? 'run1' : 'run0';
    ctx.fillStyle = 'rgba(16,21,31,0.28)';
    const sw = Math.max(10, 26 - jh * 0.3);
    ctx.fillRect(x - sw / 2, PY - 1, sw, 2.5);
    if (g.invul > 0 && Math.floor(g.invul * 14) % 2 === 0) return;
    const bob = (pose === 'run0' || pose === 'run1') && Math.floor(g.frameT * 9) % 2 ? 0.8 : 0;
    Hero.draw(ctx, outfit, pose, x, PY - jh + bob + 1, HK);
  }

  function drawChaser(ctx) {
    if (g.gapV >= 1.0) return;
    const spr = Chaser.get(Math.floor(g.frameT * 6) % 2, 'back');
    const cx = World.laneXf(g.chaserLane, 1);
    const bottom = H + 20 + g.gapV * 70 + Math.sin(g.frameT * 12) * 1.5;
    Px.blit(ctx, spr, cx, bottom, 1);
    if (g.bubbleT > 0 && g.bubble) {
      const tw = Px.textWidth(g.bubble, 2) + 10;
      const bx = Px.clamp(cx, tw / 2 + 2, W - tw / 2 - 2) - tw / 2, by = H - 36;
      Px.rect(ctx, bx, by, tw, 16, PAL.ink);
      Px.rect(ctx, bx + 1, by + 1, tw - 2, 14, '#fff3b0');
      Px.text(ctx, g.bubble, bx + tw / 2, by + 4.5, PAL.ink, 2, 'center');
    }
  }

  function arrow(ctx, x, y, dir, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
      const w = 1 + i * 2;
      if (dir === 'up') ctx.fillRect(x - w / 2, y + i, w, 1);
      else if (dir === 'down') ctx.fillRect(x - w / 2, y + 3 - i, w, 1);
      else if (dir === 'left') ctx.fillRect(x + i - 1, y - w / 2, 1, w);
      else ctx.fillRect(x + 3 - i - 1, y - w / 2, 1, w);
    }
  }

  function drawHud(ctx) {
    for (let i = 0; i < CFG.MAX_HITS; i++) ctx.drawImage(i < CFG.MAX_HITS - g.hits ? crossOn : crossOff, 4 + i * 11, 4, crossOn.width * 0.5, crossOn.height * 0.5);
    Px.text(ctx, String(g.score), W / 2, 6, '#ffffff', 3, 'center', PAL.ink);
    Px.button(ctx, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, '', { color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
    Px.rect(ctx, PAUSE_BTN.x + 5, PAUSE_BTN.y + 4.5, 2.5, 8, '#fff');
    Px.rect(ctx, PAUSE_BTN.x + 10, PAUSE_BTN.y + 4.5, 2.5, 8, '#fff');
    // progresso verso il finale
    const prog = Px.clamp(g.cfu / CFG.CFU_GOAL, 0, 1);
    Px.rect(ctx, 5, 25, W - 10, 6, PAL.ink);
    Px.rect(ctx, 6, 26, W - 12, 4, '#3a4350');
    Px.rect(ctx, 6, 26, (W - 12) * prog, 4, g.zone === 'uni' ? '#6ea0ec' : PAL.gold);
    Px.rect(ctx, 6 + (W - 12) * CFG.UNI_AT_CFU / CFG.CFU_GOAL, 25, 1, 6, '#ffffff');   // inizio universita'
    Px.rect(ctx, W - 11, 23, 6, 10, PAL.ink);
    Px.rect(ctx, W - 10, 24, 4, 8, '#3fb858');
    // CFU raccolti
    ctx.drawImage(medalImg, 4, 36, medalImg.width * 0.25, medalImg.height * 0.25);
    Px.text(ctx, g.cfu + '/' + CFG.CFU_GOAL + ' CFU', 22, 40, '#ffe27a', 3, 'left', PAL.ink);
    // cartello di benvenuto all'universita'
    if (g.zoneBannerT > 0) {
      ctx.globalAlpha = Px.clamp(g.zoneBannerT / 0.6, 0, 1);
      Px.rect(ctx, 8, 100, W - 16, 40, 'rgba(16,21,31,0.7)');
      Px.rect(ctx, 8, 100, W - 16, 2, '#f6c344'); Px.rect(ctx, 8, 138, W - 16, 2, '#f6c344');
      Px.text(ctx, 'BENVENUTA', W / 2, 108, '#ffffff', 3, 'center', PAL.ink);
      Px.text(ctx, "ALL'UNIVERSITA'!", W / 2, 122, '#f6c344', 3, 'center', PAL.ink);
      ctx.globalAlpha = 1;
    }
    // tutorial
    if (g.time < 5 && g.phase === 'run') {
      ctx.globalAlpha = Px.clamp((5 - g.time) / 0.8, 0, 1);
      Px.rect(ctx, 22, 118, 136, 58, 'rgba(16,21,31,0.62)');
      arrow(ctx, 36, 128, 'left', '#fff'); arrow(ctx, 144, 128, 'right', '#fff');
      Px.text(ctx, 'CORSIA', W / 2, 125, '#fff', 2, 'center');
      arrow(ctx, 36, 142, 'up', PAL.gold); Px.text(ctx, 'SALTA', W / 2, 140, PAL.gold, 2, 'center');
      arrow(ctx, 36, 157, 'down', '#7fd3ff'); Px.text(ctx, 'SCIVOLA', W / 2, 155, '#7fd3ff', 2, 'center');
      ctx.globalAlpha = 1;
    }
  }

  const dim = (ctx, a) => { ctx.fillStyle = `rgba(16,21,31,${a})`; ctx.fillRect(0, 0, W, H); };

  function render(ctx) {
    ctx.save();
    if (g.shake > 0) ctx.translate((Math.random() - 0.5) * 3 * (g.shake / 0.35), (Math.random() - 0.5) * 2 * (g.shake / 0.35));
    World.render(ctx, st);
    World.drawGate(ctx, st);
    if (g.uniGate) World.drawGate(ctx, st, st.uniStart, CFG.ZONES.uni.gate, { main: '#1f3a7a', hi: '#4a69b0', dark: '#0e1a3d' });
    const objs = g.objs.slice().sort((a, b) => b.w - a.w);
    let heroDone = false;
    for (const o of objs) {
      if (!heroDone && o.w - st.T <= 0) { drawHero(ctx); heroDone = true; }
      drawObj(ctx, o);
    }
    if (!heroDone) drawHero(ctx);
    for (const o of objs) drawHint(ctx, o);
    drawChaser(ctx);
    fx.draw(ctx);
    ctx.restore();

    if (g.flash > 0) { ctx.fillStyle = `rgba(255,247,214,${Math.min(1, g.flash * 2)})`; ctx.fillRect(0, 0, W, H); }
    drawHud(ctx);

    if (g.paused) {
      dim(ctx, 0.65);
      Px.text(ctx, 'PAUSA', W / 2, 90, '#fff', 6, 'center', PAL.ink);
      Px.button(ctx, BTN_RESUME.x, BTN_RESUME.y, BTN_RESUME.w, BTN_RESUME.h, 'RIPRENDI', { f: 3 });
      Px.button(ctx, BTN_QUIT.x, BTN_QUIT.y, BTN_QUIT.w, BTN_QUIT.h, 'MENU', { f: 3, color: '#e0344b', dark: '#a82036', light: '#f06277' });
    }
    if (g.phase === 'over') {
      dim(ctx, Math.min(0.7, g.phaseT * 2));
      if (g.phaseT > 0.25) {
        Px.text(ctx, 'OPS!', W / 2, 62, PAL.gold, 9, 'center', PAL.ink);
        Px.text(ctx, "L'INFERMIERA TI HA", W / 2, 116, '#fff', 2, 'center', PAL.ink);
        Px.text(ctx, 'ACCHIAPPATA!', W / 2, 130, '#fff', 2, 'center', PAL.ink);
        Px.text(ctx, 'PUNTI ' + g.score + '   CFU ' + g.cfu, W / 2, 150, '#fff', 2, 'center', PAL.ink);
        Px.text(ctx, (g.newBest ? 'NUOVO RECORD ' : 'RECORD ') + g.best, W / 2, 164, g.newBest ? PAL.gold : '#b7c6cc', 2, 'center', PAL.ink);
        Px.button(ctx, BTN_RETRY.x, BTN_RETRY.y, BTN_RETRY.w, BTN_RETRY.h, 'RIPROVA', { f: 3 });
        Px.button(ctx, BTN_MENU.x, BTN_MENU.y, BTN_MENU.w, BTN_MENU.h, 'MENU', { f: 3, color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
      }
    }
  }

  // ---------- input ----------
  function input(action, p) {
    if (action === 'tap') {
      if (g.phase === 'over') {
        if (g.phaseT < 0.5) return;
        if (Px.hit(BTN_RETRY, p, 3)) { Sfx.select(); app.go('game', { outfit }); }
        else if (Px.hit(BTN_MENU, p, 3)) { Sfx.select(); app.go('menu'); }
        return;
      }
      if (g.paused) {
        if (Px.hit(BTN_RESUME, p, 3)) { Sfx.select(); setPaused(false); }
        else if (Px.hit(BTN_QUIT, p, 3)) { Sfx.select(); app.go('menu'); }
        return;
      }
      if (Px.hit(PAUSE_BTN, p, 6)) { Sfx.select(); setPaused(true); }
      return;
    }
    act(action);
  }

  function setPaused(v) {
    if (g.phase === 'over' || g.phase === 'finishing') return;
    g.paused = v;
    if (v) Sfx.stopMusic(); else if (g.phase === 'run' || g.phase === 'corridor') Sfx.startMusic();
  }

  return {
    enter() { Sfx.start(); Sfx.startMusic(); },
    leave() { Sfx.stopMusic(); },
    update, render, input,
    pause() { if (g.phase === 'run' || g.phase === 'corridor') setPaused(true); },
    debug: { g, st }
  };
}
