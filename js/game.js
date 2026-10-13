// Scena di gioco: endless runner a 3 corsie nel corridoio dell'ospedale.
function GameScene(app, outfit) {
  const W = CFG.W, H = CFG.H, PY = CFG.PLAYER_Y;
  const JUMP_PEAK = 34;
  const BUBBLES = ['SOLO UNA PUNTURINA!', 'FERMA LI!', 'NON FA MALE!', 'VIENI QUI!'];
  const fx = Fx.create();

  // Stato del mondo (letto da World.render)
  const st = { T: 0, specialStart: Infinity, endW: null, doorOpen: 0 };

  const g = {
    time: 0, speed: CFG.START_SPEED,
    lane: 1, laneF: 1, jumpT: 0, slideT: 0,
    objs: [], nextRowW: 2.6, lastGap: 1.2,
    hits: 0, hearts: 0, healCount: 0, invul: 0, stumble: 0, sinceHit: 0,
    gapTarget: CFG.CHASER_START_GAP, gapV: CFG.CHASER_START_GAP, chaserLane: 1,
    phase: 'run',          // run | corridor | caught | over | finishing
    phaseT: 0, shake: 0, flash: 0, paused: false,
    bubble: '', bubbleT: 0, frameT: 0, score: 0, finale: false, best: Save.get().best || 0, newBest: false
  };

  const PAUSE_BTN = { x: W - 19, y: 3, w: 16, h: 16 };
  const BTN_RETRY = { x: 30, y: 186, w: 120, h: 28 };
  const BTN_MENU = { x: 30, y: 222, w: 120, h: 24 };
  const BTN_RESUME = { x: 30, y: 150, w: 120, h: 28 };
  const BTN_QUIT = { x: 30, y: 186, w: 120, h: 24 };

  const heartImg = Props.get('cuore').img;
  const heartOff = Px.tint(heartImg, '#3a4350');

  // ---------- generazione ostacoli ----------
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const KINDS = ['jump', 'slide', 'block'];

  function add(lane, type, w) {
    g.objs.push({ lane, w, p: Props.get(type), done: false });
  }

  function heartLine(w, lane) {
    for (let i = 0; i < 3; i++) add(lane, 'cuore', w + i * 0.2);
  }

  function spawnRow(w, d) {
    const x = Math.random();
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    let used = [];
    if (x < 0.55 - d * 0.25) {
      // una sola corsia occupata
      const k = pick(KINDS);
      add(lanes[0], pick(Props.TYPES[k]), w);
      used = [lanes[0]];
    } else if (x < 0.88 - d * 0.1) {
      // due corsie occupate, una libera
      for (let i = 0; i < 2; i++) add(lanes[i], pick(Props.TYPES[pick(KINDS)]), w);
      used = [lanes[0], lanes[1]];
    } else {
      // tutte e tre: almeno una non e' un blocco (si supera con salto o scivolata)
      const ks = [pick(KINDS), pick(KINDS), pick(KINDS)];
      if (ks.every((k) => k === 'block')) ks[(Math.random() * 3) | 0] = pick(['jump', 'slide']);
      for (let i = 0; i < 3; i++) add(lanes[i], pick(Props.TYPES[ks[i]]), w);
      used = [0, 1, 2];
    }
    const free = [0, 1, 2].filter((l) => !used.includes(l));
    if (free.length && Math.random() < 0.45) add(pick(free), 'cuore', w);
  }

  function updateSpawn(dt) {
    const d = Px.clamp(g.time / CFG.FINALE_AFTER, 0, 1);
    while (g.nextRowW < st.T + 3.1) {
      if (g.time >= CFG.FINALE_AFTER - 3) {
        startCorridor();
        break;
      }
      spawnRow(g.nextRowW, d);
      const gapTime = Px.lerp(1.2, 0.82, d);
      const gapW = gapTime * g.speed;
      if (Math.random() < 0.5) heartLine(g.nextRowW + gapW * 0.35, (Math.random() * 3) | 0);
      g.nextRowW += gapW;
      g.lastGap = gapW;
    }
  }

  function startCorridor() {
    if (g.finale) return;
    g.finale = true;
    g.phase = 'corridor';
    st.specialStart = g.nextRowW + 0.5;
    st.endWTarget = st.specialStart + 7.5;
    // scia di cuori lungo il corridoio speciale
    const lanesSeq = [1, 1, 0, 1, 2, 1, 1, 0, 1, 2, 1];
    for (let i = 0; i < lanesSeq.length; i++) add(lanesSeq[i], 'cuore', st.specialStart + 0.9 + i * 0.5);
    Sfx.warn();
  }

  // ---------- azioni del giocatore ----------
  function jumpHeight() {
    if (g.jumpT <= 0) return 0;
    const p = 1 - g.jumpT / CFG.JUMP_TIME;
    return 4 * JUMP_PEAK * p * (1 - p);
  }

  function act(action) {
    if (g.paused || g.phase === 'caught' || g.phase === 'over' || g.phase === 'finishing') return;
    if (action === 'left' && g.lane > 0) { g.lane--; Sfx.lane(); }
    else if (action === 'right' && g.lane < CFG.LANES - 1) { g.lane++; Sfx.lane(); }
    else if (action === 'up') {
      if (g.jumpT <= 0) {
        g.slideT = 0; g.jumpT = CFG.JUMP_TIME; Sfx.jump();
        fx.burst(World.laneXf(g.laneF, 1), PY, ['#ffffff', '#d3dfe3'], 5, 30, 0.3, 40);
      }
    } else if (action === 'down') {
      if (g.slideT <= 0) { g.jumpT = 0; g.slideT = CFG.SLIDE_TIME; Sfx.slide(); }
    }
  }

  // ---------- collisioni ----------
  function onHit(o) {
    g.hits++;
    g.invul = 1.4;
    g.stumble = 0.8;
    g.shake = 0.35;
    g.sinceHit = 0;
    g.gapTarget = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP;
    g.bubble = pick(BUBBLES); g.bubbleT = 1.6;
    Sfx.hit();
    fx.burst(World.laneXf(g.laneF, 1), PY - 14, ['#ffd23f', '#ffffff', '#e0344b'], 16, 70, 0.5, 120);
    if (g.hits >= CFG.MAX_HITS) {
      g.phase = 'caught'; g.phaseT = 0; g.gapTarget = -0.15; g.jumpT = 0; g.slideT = 0;
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
        o.done = true;
        g.hearts++; g.healCount++;
        Sfx.coin();
        fx.burst(World.laneXf(o.lane, 1), PY - 20, ['#ff8a9c', '#ffffff'], 8, 40, 0.4, 20);
        if (g.healCount >= 6 && g.hits > 0) {
          g.healCount = 0; g.hits--; g.gapTarget = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP;
          g.bubble = ''; Sfx.start();
        } else if (g.healCount >= 6) g.healCount = 0;
        continue;
      }
      if (g.invul > 0 || g.phase !== 'run' || dl > 0.5) continue;
      let hit;
      if (o.p.kind === 'jump') hit = jumpHeight() < o.p.clear;
      else if (o.p.kind === 'slide') hit = g.slideT <= 0;
      else hit = true;
      if (hit) { o.done = true; onHit(o); }
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

    g.time += dt;
    g.sinceHit += dt;
    g.invul = Math.max(0, g.invul - dt);
    g.stumble = Math.max(0, g.stumble - dt);

    // velocita' e difficolta' progressiva
    let target = Math.min(CFG.MAX_SPEED, CFG.START_SPEED + CFG.SPEED_GAIN * g.time);
    if (g.phase === 'corridor' || g.phase === 'finishing') target = Math.min(target, 1.25);
    g.speed += (target - g.speed) * Math.min(1, dt * 2);
    const mul = 1 - 0.45 * (g.stumble / 0.8);
    st.T += g.speed * mul * dt;

    // movimento
    g.laneF += Math.sign(g.lane - g.laneF) * Math.min(Math.abs(g.lane - g.laneF), dt / CFG.LANE_SWITCH_TIME);
    if (g.jumpT > 0) g.jumpT = Math.max(0, g.jumpT - dt);
    if (g.slideT > 0) g.slideT = Math.max(0, g.slideT - dt);

    // l'inseguitrice insegue la corsia e recupera terreno se non sbagli
    g.chaserLane += (g.laneF - g.chaserLane) * Math.min(1, dt * 4);
    if (g.hits > 0 && g.sinceHit > 10 && g.phase === 'run') {
      g.hits--; g.sinceHit = 0;
      g.gapTarget = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP;
    }
    if (g.phase !== 'run') g.gapTarget = 1.1;
    g.gapV += (g.gapTarget - g.gapV) * Math.min(1, dt * 3);

    if (g.phase === 'run' || g.phase === 'corridor') updateSpawn(dt);

    // corridoio speciale: porta in fondo
    if (st.endWTarget != null && st.endW == null && st.endWTarget - st.T <= 3.0) st.endW = st.endWTarget;
    if (st.endW != null) {
      st.doorOpen = Px.clamp((1.7 - (st.endW - st.T)) / 1.0, 0, 1);
      if (st.endW - st.T < 0.35 && g.phase !== 'finishing') {
        g.phase = 'finishing'; g.phaseT = 0; g.flash = 0.5;
        Sfx.door(); Sfx.stopMusic();
        app.go('finale', { outfit, score: g.score + 500 }, { color: '#fff7d6', time: 0.45 });
      }
    }
    if (g.phase === 'corridor' && g.frameT % 0.05 < dt) fx.confetti(W, [PAL.red, PAL.gold, PAL.blue, PAL.green, '#fff', PAL.pink]);

    collide();
    g.objs = g.objs.filter((o) => o.w - st.T > -0.4);
    g.score = Math.floor(st.T * 10) + g.hearts * 25;
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
    const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
    const x = World.laneXf(o.lane, s);
    let y = World.scrY(s);
    if (o.p.kind === 'pickup') y -= (14 + Math.sin(g.time * 6 + o.w * 5) * 2) * s;
    ctx.globalAlpha = Px.clamp((3.0 - z) / 0.7, 0, 1);
    ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h), w, h);
    ctx.globalAlpha = 1;
  }

  function drawHero(ctx) {
    const jh = jumpHeight();
    const x = Math.round(World.laneXf(g.laneF, 1));
    let pose;
    if (g.phase === 'caught' || g.phase === 'over') pose = 'stand';
    else if (g.slideT > 0) pose = 'slide';
    else if (jh > 0.5) pose = 'jump';
    else pose = (Math.floor(g.frameT * 9) % 2) ? 'run1' : 'run0';
    // ombra
    ctx.fillStyle = 'rgba(16,21,31,0.28)';
    const sw = Math.max(6, 14 - jh * 0.2);
    ctx.fillRect(Math.round(x - sw / 2), PY - 1, Math.round(sw), 2);
    if (g.invul > 0 && Math.floor(g.invul * 14) % 2 === 0) return;
    const bob = (pose === 'run0' || pose === 'run1') && Math.floor(g.frameT * 9) % 2 ? 1 : 0;
    Hero.draw(ctx, outfit, pose, x, Math.round(PY - jh + bob), 1);
  }

  function drawChaser(ctx) {
    if (g.gapV >= 1.0) return;
    const sc = 2;
    const spr = Chaser.get(Math.floor(g.frameT * 6) % 2);
    const cx = World.laneXf(g.chaserLane, 1);
    const bottom = H + 20 + g.gapV * 70 + Math.sin(g.frameT * 12) * 1.5;
    const w = spr.width * sc, h = spr.height * sc;
    ctx.drawImage(spr, Math.round(cx - w / 2), Math.round(bottom - h), w, h);
    if (g.bubbleT > 0 && g.bubble) {
      const tw = Px.textWidth(g.bubble) + 8;
      const bx = Math.round(Px.clamp(cx, tw / 2 + 2, W - tw / 2 - 2) - tw / 2), by = H - 34;
      Px.rect(ctx, bx, by, tw, 13, PAL.ink);
      Px.rect(ctx, bx + 1, by + 1, tw - 2, 11, '#fff3b0');
      Px.text(ctx, g.bubble, bx + tw / 2, by + 4, PAL.ink, 1, 'center');
    }
  }

  function arrow(ctx, x, y, dir, color) {
    ctx.fillStyle = color;
    const rows = [1, 3, 5];
    for (let i = 0; i < 3; i++) {
      const w = rows[i];
      if (dir === 'up') ctx.fillRect(x - (w >> 1), y + i, w, 1);
      else if (dir === 'down') ctx.fillRect(x - (w >> 1), y + 2 - i, w, 1);
      else if (dir === 'left') ctx.fillRect(x + i - 2, y - (w >> 1), 1, w);
      else ctx.fillRect(x + 2 - i, y - (w >> 1), 1, w);
    }
  }

  function drawHud(ctx) {
    // vite
    for (let i = 0; i < CFG.MAX_HITS; i++) ctx.drawImage(i < CFG.MAX_HITS - g.hits ? heartImg : heartOff, 3 + i * 14, 3);
    // punteggio
    Px.text(ctx, String(g.score), W / 2, 7, '#ffffff', 1, 'center', PAL.ink);
    // pausa
    Px.button(ctx, PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h, '', { color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
    Px.rect(ctx, PAUSE_BTN.x + 5, PAUSE_BTN.y + 4, 2, 8, '#fff');
    Px.rect(ctx, PAUSE_BTN.x + 9, PAUSE_BTN.y + 4, 2, 8, '#fff');
    // progresso verso il finale
    const prog = Px.clamp(g.time / CFG.FINALE_AFTER, 0, 1);
    Px.rect(ctx, 5, 22, W - 10, 5, PAL.ink);
    Px.rect(ctx, 6, 23, W - 12, 3, '#3a4350');
    Px.rect(ctx, 6, 23, Math.round((W - 12) * prog), 3, PAL.gold);
    Px.rect(ctx, W - 10, 20, 5, 9, PAL.ink);
    Px.rect(ctx, W - 9, 21, 3, 7, '#3fb858');
    // tutorial
    if (g.time < 5 && g.phase === 'run') {
      ctx.globalAlpha = Px.clamp((5 - g.time) / 0.8, 0, 1);
      Px.rect(ctx, 28, 118, 124, 50, 'rgba(16,21,31,0.6)');
      arrow(ctx, 40, 130, 'left', '#fff'); arrow(ctx, 140, 130, 'right', '#fff');
      Px.text(ctx, 'CORSIA', W / 2, 127, '#fff', 1, 'center');
      arrow(ctx, 40, 143, 'up', PAL.gold); Px.text(ctx, 'SALTA', W / 2, 142, PAL.gold, 1, 'center');
      arrow(ctx, 40, 156, 'down', '#7fd3ff'); Px.text(ctx, 'SCIVOLA', W / 2, 155, '#7fd3ff', 1, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function dim(ctx, a) { ctx.fillStyle = `rgba(16,21,31,${a})`; ctx.fillRect(0, 0, W, H); }

  function render(ctx) {
    ctx.save();
    if (g.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 6 * (g.shake / 0.35)), Math.round((Math.random() - 0.5) * 4 * (g.shake / 0.35)));
    World.render(ctx, st);
    World.drawGate(ctx, st);
    const objs = g.objs.slice().sort((a, b) => b.w - a.w);
    let heroDone = false;
    for (const o of objs) {
      if (!heroDone && o.w - st.T <= 0) { drawHero(ctx); heroDone = true; }
      drawObj(ctx, o);
    }
    if (!heroDone) drawHero(ctx);
    drawChaser(ctx);
    fx.draw(ctx);
    ctx.restore();

    if (g.flash > 0) { ctx.fillStyle = `rgba(255,247,214,${Math.min(1, g.flash * 2)})`; ctx.fillRect(0, 0, W, H); }
    drawHud(ctx);

    if (g.paused) {
      dim(ctx, 0.65);
      Px.text(ctx, 'PAUSA', W / 2, 100, '#fff', 3, 'center', PAL.ink);
      Px.button(ctx, BTN_RESUME.x, BTN_RESUME.y, BTN_RESUME.w, BTN_RESUME.h, 'RIPRENDI', { scale: 2 });
      Px.button(ctx, BTN_QUIT.x, BTN_QUIT.y, BTN_QUIT.w, BTN_QUIT.h, 'MENU', { color: '#e0344b', dark: '#a82036', light: '#f06277' });
    }
    if (g.phase === 'over') {
      dim(ctx, Math.min(0.7, g.phaseT * 2));
      if (g.phaseT > 0.25) {
        Px.text(ctx, 'OPS!', W / 2, 78, PAL.gold, 4, 'center', PAL.ink);
        Px.text(ctx, "L'INFERMIERA TI HA", W / 2, 118, '#fff', 1, 'center', PAL.ink);
        Px.text(ctx, 'ACCHIAPPATA!', W / 2, 128, '#fff', 1, 'center', PAL.ink);
        Px.text(ctx, 'PUNTI ' + g.score, W / 2, 148, '#fff', 1, 'center', PAL.ink);
        Px.text(ctx, (g.newBest ? 'NUOVO RECORD ' : 'RECORD ') + g.best, W / 2, 160, g.newBest ? PAL.gold : '#b7c6cc', 1, 'center', PAL.ink);
        Px.button(ctx, BTN_RETRY.x, BTN_RETRY.y, BTN_RETRY.w, BTN_RETRY.h, 'RIPROVA', { scale: 2 });
        Px.button(ctx, BTN_MENU.x, BTN_MENU.y, BTN_MENU.w, BTN_MENU.h, 'MENU', { color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
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
