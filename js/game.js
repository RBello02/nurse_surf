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
    zone: 'hospital', zoneBannerT: 0, uniGate: false, doorIdx: 0,
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
  const SPEEDS = [{ k: 0.8, l: 'LENTO' }, { k: 1, l: 'NORMALE' }, { k: 1.2, l: 'VELOCE' }];
  const SPD_BTN = SPEEDS.map((v, i) => ({ x: 24 + i * 44, y: 122, w: 40, h: 18 }));
  let speedK = (Save.get().speedK) || 1;
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
      if (g.doorIdx < CFG.DOOR.puzzles.length && g.uniGate && g.phase === 'run' && g.cfu >= CFG.DOOR.puzzles[g.doorIdx].atCfu) { startDoor(); break; }
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

  // ---------- indovinello delle tre porte ----------
  const DOOR_X = [30, 90, 150], DOOR_BOTTOM = 222, HERO_DOOR_FEET = 244, HERO_DOOR_K = 1.25;
  const DOOR_BOXES = DOOR_X.map((x) => ({ x: x - 21, y: 158, w: 42, h: 68 }));
  const CATCH = { arrive: 1.3, back: 1.9, stab: 2.2, end: 6.2 };       // tempi (s) della scena della cattura
  const NURSE_K = 0.8, NURSE_TIP = 63, TH_BACK = -0.2, TH_STAB = 0.6;

  function startDoor() {
    const pz = CFG.DOOR.puzzles[g.doorIdx++];
    g.phase = 'door';
    g.door = { state: 'arrive', t: 0, pz, doors: pz.doors.slice().sort(() => Math.random() - 0.5), sel: 1, pick: -1, result: null, ev: {}, stabbed: false, poison: !!pz.poison, smoke: [] };
    g.objs = g.objs.filter((o) => o.w - st.T < 0.05);
    g.lane = 1; g.jumpT = 0; g.slideT = 0;
  }

  function pickDoor(i) {
    const d = g.door;
    if (!d || d.state !== 'ask') return;
    d.pick = i; d.state = 'anim'; d.t = 0;
    d.result = d.doors[i].right ? 'right' : 'wrong';
    d.hx = Px.clamp(DOOR_X[i], 40, 140);
    d.dir = d.hx <= 90 ? 1 : -1;            // da che lato arriva l'infermiera (1 = da destra)
    Sfx.select();
  }

  function updateDoor(dt) {
    const d = g.door;
    d.t += dt;
    g.laneF += (1 - g.laneF) * Math.min(1, dt * 6);
    g.chaserLane += (g.laneF - g.chaserLane) * Math.min(1, dt * 4);
    g.gapV += (g.gapTarget - g.gapV) * Math.min(1, dt * 3);
    if (d.state === 'arrive') {
      g.speed = Math.max(0, g.speed - dt * 2.2);
      st.T += g.speed * dt;
      if (g.speed < 0.02 && d.t > 0.6) { g.speed = 0; d.state = 'ask'; d.t = 0; Sfx.warn(); }
      return;
    }
    if (d.state !== 'anim') return;
    const once = (k, tm, fn) => { if (!d.ev[k] && d.t >= tm) { d.ev[k] = true; fn(); } };
    if (d.result === 'right') {
      once('open', 0.6, () => Sfx.door());
      once('ok', 0.9, () => { Sfx.start(); fx.confetti(W, [PAL.gold, '#fff', PAL.green, PAL.blue]); });
      once('flash', 1.9, () => { g.flash = 0.45; });
      if (d.t >= 2.1) {                       // si prosegue la corsa
        g.phase = 'run'; g.door = null;
        g.nextRowW = st.T + 2.6; g.invul = 1.2; g.speed = 0.6;
      }
    } else {
      once('bump', 0.7, () => { Sfx.hit(); g.shake = 0.3; });
      once('warn', 1.5, () => Sfx.warn());
      once('roar', 4.41, () => { Sfx.roar(); g.shake = 0.7; g.flash = 0.3; fx.burst(d.hx, HERO_DOOR_FEET - 30, ['#ffffff', '#2c2c34', '#7ee08f', '#6e32aa'], 36, 120, 0.8, 80); });
      once('stab', 2.95, () => { d.stabbed = true; g.flash = 0.35; g.shake = 0.5; Sfx.hit(); fx.burst(d.hx, HERO_DOOR_FEET - 28, ['#ffffff', '#7fd3ff', PAL.red, PAL.gold], 24, 90, 0.6, 60); });
      const END = d.poison ? 7.0 : 4.5;
      if (d.t >= END) { g.hits = CFG.MAX_HITS; g.phase = 'caught'; g.phaseT = 1.5; g.door = null; g.gapTarget = -0.2; Sfx.stopMusic(); finish(); }
    }
  }

  // Pelle verde a 6 livelli per la fase iniziale della trasformazione (cache)
  const greenCache = new Map();
  function greenImg(img, lvl) {
    if (!lvl) return img;
    let arr = greenCache.get(img);
    if (!arr) greenCache.set(img, (arr = []));
    if (!arr[lvl]) {
      const a = Math.min(0.7, 0.12 * lvl + 0.1);
      arr[lvl] = Px.make(img.width, img.height, (c) => {
        c.drawImage(img, 0, 0);
        c.globalCompositeOperation = 'source-atop';
        const gr = c.createLinearGradient(0, 0, img.width, 0);
        gr.addColorStop(0, `rgba(120,235,90,${a})`); gr.addColorStop(1, `rgba(30,140,55,${a})`);
        c.fillStyle = gr; c.fillRect(0, 0, img.width, img.height);
      }, true);
      arr[lvl].__lw = Px.lw(img); arr[lvl].__lh = Px.lh(img); arr[lvl].__S = img.__S;
    }
    return arr[lvl];
  }

  // Martina trasformata: prima trema e diventa verde, poi esplode nel personaggio gigante (sprite dedicato)
  const SWAP = 0.6;
  function drawHulk(ctx, pose, x, y, k, amt, t) {
    ctx.save();
    if (amt < SWAP) {
      const q = amt / SWAP, lvl = amt <= 0 ? 0 : Math.min(6, Math.floor(q * 5.99) + 1);
      const img = greenImg(Hero.get(outfit, pose), lvl);
      ctx.translate(x + Math.sin(t * 50) * q * 1.2, y);
      ctx.scale(1 + 0.18 * q, 1 + 0.1 * q);
      Px.blit(ctx, img, 0, 0, k);
    } else {
      const q = Px.clamp((amt - SWAP) / 0.4, 0, 1), pop = 1 + 0.18 * Math.sin(q * Math.PI) * (1 - q * 0.3);
      const breathe = amt >= 1 ? Math.sin(t * 6) * 0.012 : 0;
      ctx.translate(x + (amt >= 1 ? Math.sin(t * 38) * 0.35 : 0), y);
      ctx.scale((0.9 + 0.1 * Px.ease(q)) * pop * (1 - breathe), (0.9 + 0.1 * Px.ease(q)) * pop * (1 + breathe));
      Px.blit(ctx, Hero.get(outfit, 'big'), 0, 0, k);
    }
    ctx.restore();
  }

  function drawSmoke(ctx, d, hx, feet, k, sp) {
    if (g.frameT % 0.05 < 0.017 || d.smoke.length < 3) {
      const rate = Px.clamp((sp - 0.7) / 1.5, 0.2, 1);
      if (Math.random() < rate) d.smoke.push({ x: hx + (Math.random() < 0.5 ? -1 : 1) * (22 + Math.random() * 8) * k / 1.25, y: feet - 30 - Math.random() * 30, vx: (Math.random() - 0.5) * 8, vy: -(14 + Math.random() * 16), r: 3 + Math.random() * 3, age: 0, life: 1.4 + Math.random() * 0.8, c: ['#7ee08f', '#4fb866', '#2f8a46'][(Math.random() * 3) | 0] });
    }
    const dt = 1 / 60;
    for (const q of d.smoke) { q.age += dt; q.x += (q.vx + Math.sin(q.age * 5 + q.y) * 6) * dt; q.y += q.vy * dt; q.r += dt * 5; }
    d.smoke = d.smoke.filter((q) => q.age < q.life);
    for (const q of d.smoke) {
      ctx.globalAlpha = Px.clamp(0.4 * (1 - q.age / q.life), 0, 0.4);
      Px.ell(ctx, q.x, q.y, q.r, q.r * 0.85, q.c);
    }
    ctx.globalAlpha = 1;
  }

  function drawDoorScene(ctx) {
    const d = g.door;
    const pop = d.state === 'ask' ? Px.ease(Px.clamp(d.t / 0.4, 0, 1)) : (d.state === 'anim' ? 1 : 0);
    // chaser dietro (non nella sequenza della puntura: arriva quella frontale)
    if (pop > 0) {
      Px.rect(ctx, 0, 112, W, 116, '#efe2c8'); Px.rect(ctx, 0, 112, W, 4, '#b4573d'); Px.rect(ctx, 0, 124, W, 30, 'rgba(180,87,61,0.35)');
      Px.rect(ctx, 0, 224, W, 5, '#4a2f1a');
      const wrong = d.result === 'wrong';
      for (let i = 0; i < 3; i++) {
        const kind = d.doors[i].kind, dr = Doors.get(kind), x = DOOR_X[i];
        const dy = (1 - pop) * 26;
        ctx.globalAlpha = pop;
        let shake = 0, open = 0;
        if (d.state === 'anim' && d.pick === i) {
          if (d.result === 'right') open = Px.ease(Px.clamp((d.t - 0.6) / 0.5, 0, 1));
          else if (d.t > 0.7 && d.t < 1.5) shake = Math.sin(d.t * 60) * 1.4 * (1.5 - d.t);
        }
        const sel = (d.state === 'ask' && d.sel === i) || (d.state === 'anim' && d.pick === i);
        if (sel) Px.rect(ctx, x - 22 + shake, 156 + dy, 44, 70, (Math.floor(g.frameT * 5) % 2 && d.state === 'ask') ? '#ffffff' : PAL.gold);
        Px.blit(ctx, dr.base, x + shake, DOOR_BOTTOM + dy, 1);
        ctx.imageSmoothingEnabled = true;
        const lw = 33 * (1 - open * 0.88);
        ctx.drawImage(dr.leaf, x - 16.5 + shake, 162 + dy, lw, 60);
        // cartello con la scelta
        const lab = d.doors[i].label, tw = Px.textWidth(lab, 2) + 6;
        Px.rect(ctx, x - tw / 2 + shake, 143 + dy, tw, 12, PAL.ink); Px.rect(ctx, x - tw / 2 + 1 + shake, 144 + dy, tw - 2, 10, '#fff3b0');
        Px.text(ctx, lab, x + shake, 146.5 + dy, PAL.ink, 2, 'center');
        if (wrong && d.pick === i && d.t > 0.7) {                  // porta bloccata: X rossa e lucchetto
          Px.line(ctx, x - 9 + shake, 182, x + 9 + shake, 204, 3, PAL.ink); Px.line(ctx, x + 9 + shake, 182, x - 9 + shake, 204, 3, PAL.ink);
          Px.line(ctx, x - 9 + shake, 182, x + 9 + shake, 204, 1.5, PAL.red); Px.line(ctx, x + 9 + shake, 182, x - 9 + shake, 204, 1.5, PAL.red);
        }
        ctx.globalAlpha = 1;
      }
      // titolo
      let lines = d.pz.question, col = '#ffffff';
      if (d.state === 'anim' && d.result === 'right' && d.t > 0.6) { lines = ['GIUSTO! BRAVA!']; col = '#7ee08f'; }
      if (d.state === 'anim' && d.result === 'wrong' && d.t > 0.7) { lines = ['PORTA CHIUSA!']; col = '#ff8a9a'; }
      const mw = Math.min(W - 6, Math.max(...lines.map((l) => Px.textWidth(l, 2))) + 14), mh = 6 + lines.length * 10;
      const my = 102 - mh;
      ctx.globalAlpha = pop;
      Px.rect(ctx, 90 - mw / 2, my, mw, mh, PAL.ink); Px.rect(ctx, 90 - mw / 2 + 1, my + 1, mw - 2, mh - 2, '#1f3a7a');
      Px.rect(ctx, 90 - mw / 2 + 1, my + 1, mw - 2, 2, '#4a69b0');
      lines.forEach((l, i) => Px.text(ctx, l, 90, my + 5 + i * 10, col, 2, 'center', '#0e1a3d'));
      ctx.globalAlpha = 1;
      if (d.state === 'ask' && Math.floor(g.frameT * 2) % 2 === 0) Px.text(ctx, 'TOCCA LA PORTA', 90, 108, '#ffffff', 1, 'center', PAL.ink);
    }
    // Martina
    let hx = World.laneXf(g.laneF, 1), feet = PY, k = HK, pose = 'stand', alpha = 1;
    const runPose = Hero.run(g.frameT, 12).pose;
    if (d.state === 'arrive') pose = runPose;
    if (d.state === 'ask') { hx = 90; pose = 'stand'; }
    if (d.state === 'anim') {
      const walk = Px.ease(Px.clamp(d.t / 0.6, 0, 1)), fromX = 90;
      hx = Px.lerp(fromX, d.hx, walk); feet = Px.lerp(PY, HERO_DOOR_FEET, walk); k = Px.lerp(HK, HERO_DOOR_K, walk);
      pose = d.t < 0.6 ? runPose : 'stand';
      if (d.result === 'right' && d.t >= 1.2) {
        hx = Px.lerp(d.hx, DOOR_X[d.pick], Px.clamp((d.t - 1.2) / 0.7, 0, 1));
        const p = Px.clamp((d.t - 1.2) / 0.7, 0, 1);
        feet = Px.lerp(HERO_DOOR_FEET, DOOR_BOTTOM + 2, p); k = Px.lerp(HERO_DOOR_K, 0.7, p); alpha = 1 - p * 0.7; pose = runPose;
      }
      if (d.result === 'right' && d.t > 0.9 && d.t < 1.2) pose = 'cheer';
      if (d.stabbed && (!d.poison || d.t - 2.95 < 0.9)) { pose = 'jump'; hx += Math.sin(d.t * 50) * 1.5; feet -= Math.abs(Math.sin((d.t - 2.95) * 9)) * 8; }
    }
    ctx.fillStyle = 'rgba(16,21,31,0.28)'; ctx.fillRect(hx - 12, feet - 1, 24, 2.5);
    ctx.globalAlpha = alpha;
    const sp0 = d.stabbed ? d.t - 2.95 : -1;
    if (d.poison && sp0 > 0.9) { pose = 'stand'; hx += Math.sin(d.t * 9) * 1.2; feet -= Math.abs(Math.sin(d.t * 7)) * 1.2; }
    const amt = d.poison && sp0 > 0.5 ? Px.clamp((sp0 - 0.5) / 1.6, 0, 1) : 0;
    drawHulk(ctx, pose, hx, feet, k, amt, g.frameT);
    if (amt >= 1 && sp0 < 2.6) { ctx.strokeStyle = `rgba(160,255,150,${0.6 - (sp0 - 2.1) * 1.2})`; ctx.lineWidth = 2; const r = (sp0 - 2.1) * 90; if (r > 0) { ctx.beginPath(); ctx.ellipse(hx, feet - 8, r, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke(); } }
    ctx.globalAlpha = 1;
    if (d.poison && sp0 > 0.7) drawSmoke(ctx, d, hx, feet, k, sp0);
    // infermiera che arriva con la siringa
    if (d.state === 'anim' && d.result === 'wrong' && d.t > 1.5) {
      const finalX = d.hx + d.dir * (NURSE_TIP + 4);
      const off = d.dir > 0 ? W + 70 : -70;
      const p = Px.ease(Px.clamp((d.t - 1.5) / 0.9, 0, 1));
      const nx = Px.lerp(off, finalX, p);
      let th = 0;
      if (d.t > 2.4 && d.t < 2.8) th = TH_BACK * Px.ease((d.t - 2.4) / 0.4);
      else if (d.t >= 2.8) th = Px.lerp(TH_BACK, TH_STAB, Px.clamp((d.t - 2.8) / 0.15, 0, 1));
      const moving = d.t < 2.4;
      const bounce = moving ? Math.abs(Math.sin(d.t * 14)) * 3 : 0;
      ctx.fillStyle = 'rgba(16,21,31,0.25)'; ctx.fillRect(nx - 22, feet - 1, 44, 3);
      ctx.save();
      ctx.translate(nx, feet + 4 - bounce);
      ctx.rotate(d.dir > 0 ? -th : th);
      Px.blit(ctx, Chaser.get(Math.floor(d.t * (moving ? 12 : 5)), 'front', d.dir > 0), 0, 0, NURSE_K);
      ctx.restore();
      if (d.t > 1.5 && d.t < 2.4) Px.text(ctx, '!', hx, feet - 62 + Math.sin(d.t * 16) * 1.2, PAL.red, 6, 'center', '#ffffff');
      if (d.stabbed) {
        const sp = d.t - 2.95;
        if (sp < 1.2) Px.text(ctx, 'AHI!', hx, feet - 72 - sp * 6, PAL.red, 5, 'center', '#ffffff');
        if (sp > 0.5 && sp < 1.4) Px.text(ctx, 'PUNTURA!', 90, 112, PAL.gold, 5, 'center', PAL.ink);
        if (d.poison && sp > 1.7 && sp < 4.0) Px.text(ctx, sp > 2.3 ? 'GRAAAH!' : 'GRRR...', 90, feet - 84 - (sp > 2.3 ? Math.sin(sp * 20) * 1.2 : 0), '#7ee08f', sp > 2.3 ? 5 : 3, 'center', PAL.ink);
      }
    }
    const T_FADE = d.poison ? 6.4 : 3.9;
    if (d.state === 'anim' && d.result === 'wrong' && d.t > T_FADE) { ctx.fillStyle = `rgba(16,21,31,${Math.min(1, (d.t - T_FADE) / 0.6)})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- azioni del giocatore ----------
  function jumpHeight() {
    if (g.jumpT <= 0) return 0;
    const p = 1 - g.jumpT / CFG.JUMP_TIME;
    return 4 * CFG.JUMP_PEAK * p * (1 - p);
  }

  function act(action) {
    if (g.paused || g.phase === 'caught' || g.phase === 'over' || g.phase === 'finishing') return;
    if (g.phase === 'door') {
      const d = g.door;
      if (!d || d.state !== 'ask') return;
      if (action === 'left') { d.sel = Math.max(0, d.sel - 1); Sfx.lane(); }
      else if (action === 'right') { d.sel = Math.min(2, d.sel + 1); Sfx.lane(); }
      else if (action === 'up' || action === 'confirm' || action === 'down') pickDoor(d.sel);
      return;
    }
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
      g.phase = 'caught'; g.phaseT = 0; g.gapTarget = 1.2; g.jumpT = 0; g.slideT = 0; g.catchEv = {}; g.catchHx = World.laneXf(g.laneF, 1); g.catchDir = g.catchHx <= 90 ? 1 : -1;
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
    Gfx.track(dt);
    if (g.paused) return;
    g.frameT += dt;
    fx.update(dt);
    g.bubbleT = Math.max(0, g.bubbleT - dt);
    g.shake = Math.max(0, g.shake - dt);
    g.flash = Math.max(0, g.flash - dt);

    if (g.phase === 'over') { g.phaseT += dt; return; }
    if (g.phase === 'caught') {
      g.phaseT += dt;
      const pt = g.phaseT, ev = g.catchEv, hx = g.catchHx, once = (k, tm, fn) => { if (!ev[k] && pt >= tm) { ev[k] = true; fn(); } };
      g.speed = Math.max(0, g.speed - dt * 3);
      st.T += g.speed * dt;
      g.gapV += (g.gapTarget - g.gapV) * Math.min(1, dt * 5);
      once('warn', 0.35, () => Sfx.warn());
      once('stab', CATCH.stab, () => { g.flash = 0.35; g.shake = 0.5; Sfx.hit(); fx.burst(hx, PY - 28, ['#ffffff', '#7fd3ff', PAL.red, PAL.gold], 24, 90, 0.6, 60); });
      once('roar', CATCH.stab + 0.5 + 0.6 * 1.6, () => { Sfx.roar(); g.shake = 0.7; g.flash = 0.3; fx.burst(hx, PY - 30, ['#ffffff', '#2c2c34', '#7ee08f', '#6e32aa'], 36, 120, 0.8, 80); });
      if (pt > CATCH.end) finish();
      return;
    }

    if (g.phase === 'door') { updateDoor(dt); return; }

    g.time += dt; g.sinceHit += dt;
    g.invul = Math.max(0, g.invul - dt);
    g.stumble = Math.max(0, g.stumble - dt);

    let target = Math.min(CFG.MAX_SPEED, CFG.START_SPEED + CFG.SPEED_GAIN * g.time) * speedK;
    if (g.phase === 'corridor' || g.phase === 'finishing') target = Math.min(target, 1.25);
    g.speed += (target - g.speed) * Math.min(1, dt * 2);
    st.T += g.speed * (1 - 0.45 * (g.stumble / 0.8)) * dt;

    g.laneF += Math.sign(g.lane - g.laneF) * Math.min(Math.abs(g.lane - g.laneF), dt / CFG.LANE_SWITCH_TIME);
    if (g.landT > 0) g.landT = Math.max(0, g.landT - dt);
    if (g.jumpT > 0) { g.jumpT = Math.max(0, g.jumpT - dt); if (g.jumpT === 0) { g.landT = 0.14; fx.burst(World.laneXf(g.laneF, 1), PY, ['#ffffff', '#d3dfe3'], 6, 26, 0.3, 0); } }
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

    if (g.phase === 'run' && g.jumpT <= 0 && g.slideT <= 0 && g.frameT % 0.11 < dt) {
      fx.burst(World.laneXf(g.laneF, 1) + (Math.random() - 0.5) * 8, PY, ['#ffffff', '#d3dfe3', '#b7c6cc'], 1, 12, 0.35, 0);
    }
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
  // foschia in fondo al corridoio + vignettatura ai bordi: piu' profondita'
  let vignette = null;
  function drawAtmosphere(ctx) {
    if (!vignette) vignette = Px.make(W * 2, H * 2, (c) => {
      const gr = c.createRadialGradient(W, H * 0.95, H * 0.35, W, H * 0.95, H * 1.05);
      gr.addColorStop(0, 'rgba(8,16,36,0)'); gr.addColorStop(1, 'rgba(8,16,36,0.42)');
      c.fillStyle = gr; c.fillRect(0, 0, W * 2, H * 2);
    }, true);
    const hz = CFG.HORIZON_Y;
    const hg = ctx.createLinearGradient(0, hz - 36, 0, hz + 46);
    hg.addColorStop(0, 'rgba(255,252,236,0)'); hg.addColorStop(0.5, 'rgba(255,252,236,0.22)'); hg.addColorStop(1, 'rgba(255,252,236,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, hz - 36, W, 82);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(vignette, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
  }

  function drawObj(ctx, o) {
    const z = o.w - st.T;
    if (z > 3.0 || z < -0.3 || o.done) return;
    const s = World.proj(z);
    const img = o.p.img;
    let w = Px.lw(img) * 0.5 * s;
    const h = Px.lh(img) * 0.5 * s;
    const x = World.laneXf(o.lane, s);
    let y = World.scrY(s);
    if (o.p.kind === 'pickup') {
      y -= (26 + Math.sin(g.time * 6 + o.seed) * 3) * s;
      w *= 0.3 + 0.7 * Math.abs(Math.cos(g.time * 4 + o.seed));      // la medaglia gira su se stessa
    }
    const fade = Px.clamp((3.0 - z) / 0.7, 0, 1);
    if (o.p.kind === 'pickup') {                                      // alone dorato attorno alla medaglia
      const gy = y - h / 2, r = Math.max(6, 15 * s);
      const gr = ctx.createRadialGradient(x, gy, 1, x, gy, r);
      gr.addColorStop(0, `rgba(255,226,122,${0.55 * fade})`); gr.addColorStop(1, 'rgba(255,226,122,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - r, gy - r, r * 2, r * 2);
    } else if (o.p.kind !== 'slide') {                                 // ombra a terra morbida
      Gfx.softShadow(ctx, x, y, Math.max(5, w * 0.55), Math.max(1.8, 6 * s), 0.34 * fade);
    }
    ctx.globalAlpha = fade;
    ctx.imageSmoothingEnabled = true;
    if (o.p.kind === 'pickup') ctx.drawImage(img, x - w / 2, y - h, w, h);
    else {
      Gfx.reflect(ctx, img, x, y, w, h, 0.16);
      Gfx.extrude(ctx, img, x, y, w, h, s);
    }
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
    const w = Px.lw(img) * 0.5 * hs, h = Px.lh(img) * 0.5 * hs;
    const x = World.laneXf(o.lane, s);
    const top = (o.p.topUnits || 40) + 8;
    const bob = Math.sin(g.time * 9) * 2 * hs;
    ctx.globalAlpha = Px.clamp((1.6 - z) / 0.3, 0, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, x - w / 2, World.scrY(s) - top * s - h + bob, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1;
  }

  function drawHero(ctx) {
    const jh = jumpHeight();
    const x = World.laneXf(Gfx.smooth(g.laneF), 1);
    let pose;
    if (g.phase === 'caught' || g.phase === 'over') pose = 'stand';
    else if (g.slideT > 0) pose = 'slide';
    else if (jh > 0.5) pose = 'jump';
    else pose = Hero.run(g.frameT, 12).pose;
    Gfx.softShadow(ctx, x, PY, Math.max(8, 17 - jh * 0.2), 3.4, 0.4 * (1 - Math.min(0.6, jh / 80)));
    if (g.phase === 'caught' || g.phase === 'over') {                        // presa dall'infermiera: puntura e trasformazione
      const sp = g.phase === 'over' ? 9 : g.phaseT - CATCH.stab;
      const amt = sp > 0.5 ? Px.clamp((sp - 0.5) / 1.6, 0, 1) : 0;
      let cp = 'stand', cy = PY + 1;
      if (g.phase === 'caught' && sp >= 0 && sp < 0.9) { cp = 'jump'; cy -= Math.abs(Math.sin(sp * 9)) * 8; }
      drawHulk(ctx, cp, g.catchHx != null ? g.catchHx : x, cy, HK, amt, g.frameT);
      if (g.phase === 'caught' && sp > 0.7 && sp < 3.4) drawCatchSmoke(ctx, g.catchHx, PY + 1, sp);
      return;
    }
    if (g.invul > 0 && Math.floor(g.invul * 14) % 2 === 0) return;
    const bob = pose.startsWith('run') ? Hero.run(g.frameT, 12).bob : 0;
    // movimento extra: inclinazione quando cambia corsia, allungamento al salto, schiacciamento all'atterraggio
    const lean = Px.clamp((g.lane - g.laneF) * 0.3, -0.25, 0.25) + (pose.startsWith('run') ? 0.05 : 0);
    let sx = 1, sy = 1;
    if (g.jumpT > 0) { const p = 1 - g.jumpT / CFG.JUMP_TIME; sy = 1 + 0.1 * Math.max(0, 1 - p * 5); sx = 2 - sy; }
    else if (g.landT > 0) { const q = g.landT / 0.14; sy = 1 - 0.13 * q; sx = 1 + 0.12 * q; }
    const yaw = 1 - Math.min(0.12, Math.abs(g.lane - g.laneF) * 0.14);   // si "gira" un po' cambiando corsia
    if (Gfx.level >= 1) {                                                   // riflesso sul pavimento lucido
      ctx.save(); ctx.globalAlpha = 0.17; ctx.translate(x, PY + 1); ctx.scale(sx * yaw, -0.4 * sy); ctx.rotate(-lean);
      Hero.draw(ctx, outfit, pose, 0, 0, HK); ctx.restore();
    }
    ctx.save();
    ctx.translate(x, PY - jh + bob + 1);
    ctx.rotate(lean);
    ctx.scale(sx * yaw, sy);
    Hero.draw(ctx, outfit, pose, 0, 0, HK);
    ctx.restore();
  }

  // infermiera che arriva di corsa, prende la rincorsa e punge Martina
  const catchSmoke = { list: [] };
  function drawCatchSmoke(ctx, hx, feet, sp) {
    const d = { smoke: catchSmoke.list };
    drawSmoke(ctx, d, hx, feet, HK, sp);
    catchSmoke.list = d.smoke;
  }
  function drawCatchNurse(ctx) {
    const pt = g.phaseT, hx = g.catchHx, dir = g.catchDir, feet = PY + 1;
    const finalX = hx + dir * (NURSE_TIP + 4), off = dir > 0 ? W + 70 : -70;
    const p = Px.ease(Px.clamp(pt / CATCH.arrive, 0, 1));
    const nx = Px.lerp(off, finalX, p);
    let th = 0;
    if (pt > CATCH.arrive + 0.3 && pt < CATCH.back) th = TH_BACK * Px.ease((pt - CATCH.arrive - 0.3) / (CATCH.back - CATCH.arrive - 0.3));
    else if (pt >= CATCH.back) th = Px.lerp(TH_BACK, TH_STAB, Px.clamp((pt - CATCH.stab + 0.15) / 0.15, 0, 1));
    const moving = pt < CATCH.arrive + 0.3, bounce = moving ? Math.abs(Math.sin(pt * 14)) * 3 : 0;
    ctx.fillStyle = 'rgba(16,21,31,0.25)'; ctx.fillRect(nx - 22, feet - 1, 44, 3);
    ctx.save();
    ctx.translate(nx, feet + 4 - bounce);
    ctx.rotate(dir > 0 ? -th : th);
    Px.blit(ctx, Chaser.get(Math.floor(pt * (moving ? 12 : 5)), 'front', dir > 0), 0, 0, NURSE_K);
    ctx.restore();
    if (pt > 0.3 && pt < CATCH.arrive + 0.3) Px.text(ctx, '!', hx, feet - 62 + Math.sin(pt * 16) * 1.2, PAL.red, 6, 'center', '#ffffff');
    const sp = pt - CATCH.stab;
    if (sp >= 0 && sp < 1.2) Px.text(ctx, 'AHI!', hx, feet - 72 - sp * 6, PAL.red, 5, 'center', '#ffffff');
    if (sp > 0.5 && sp < 1.4) Px.text(ctx, 'PUNTURA!', 90, 112, PAL.gold, 5, 'center', PAL.ink);
    if (sp > 1.7 && sp < 3.4) Px.text(ctx, sp > 2.3 ? 'GRAAAH!' : 'GRRR...', 90, feet - 90 - (sp > 2.3 ? Math.sin(sp * 20) * 1.2 : 0), '#7ee08f', sp > 2.3 ? 5 : 3, 'center', PAL.ink);
  }

  function drawChaser(ctx) {
    if (g.gapV >= 1.0) return;
    const spr = Chaser.get(Math.floor(g.frameT * 10), 'back');
    const cx = World.laneXf(g.chaserLane, 1);
    const bottom = H + 20 + g.gapV * 70 + Math.sin(g.frameT * 12) * 1.5;
    ctx.save();                                           // l'infermiera ondeggia mentre corre
    ctx.translate(cx + Math.sin(g.frameT * 5) * 3, bottom);
    ctx.rotate(Math.sin(g.frameT * 6) * 0.05);
    Px.blit(ctx, spr, 0, 0, 1);
    ctx.restore();
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
    for (let i = 0; i < CFG.MAX_HITS; i++) ctx.drawImage(i < CFG.MAX_HITS - g.hits ? crossOn : crossOff, 4 + i * 11, 4, Px.lw(crossOn) * 0.5, Px.lh(crossOn) * 0.5);
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
    Px.rect(ctx, 2, 34, 120, 14, 'rgba(16,21,31,0.45)'); Px.rect(ctx, 2, 34, 120, 1, 'rgba(255,255,255,0.25)');
    ctx.drawImage(medalImg, 4, 36, Px.lw(medalImg) * 0.25, Px.lh(medalImg) * 0.25);
    Px.text(ctx, g.cfu + '/' + CFG.CFU_GOAL + ' CFU', 22, 40, '#ffe27a', 3, 'left', PAL.ink);
    // cartello di benvenuto all'universita'
    if (g.zoneBannerT > 0 && g.phase !== 'door') {
      ctx.globalAlpha = Px.clamp(g.zoneBannerT / 0.6, 0, 1); ctx.save(); ctx.translate(0, -48);
      Px.rect(ctx, 24, 104, W - 48, 28, 'rgba(16,21,31,0.7)');
      Px.rect(ctx, 24, 104, W - 48, 1.5, '#f6c344'); Px.rect(ctx, 24, 130.5, W - 48, 1.5, '#f6c344');
      Px.text(ctx, 'BENVENUTA', W / 2, 110, '#ffffff', 2, 'center', PAL.ink);
      Px.text(ctx, "ALL'UNIVERSITA'!", W / 2, 121, '#f6c344', 2, 'center', PAL.ink);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    // tutorial
    if (g.time < 5 && g.phase === 'run') {
      ctx.globalAlpha = Px.clamp((5 - g.time) / 0.8, 0, 1); ctx.save(); ctx.translate(0, -66);
      Px.panel(ctx, 22, 118, 136, 58, { r: 6 });
      arrow(ctx, 36, 128, 'left', '#fff'); arrow(ctx, 144, 128, 'right', '#fff');
      Px.text(ctx, 'CORSIA', W / 2, 125, '#fff', 2, 'center');
      arrow(ctx, 36, 142, 'up', PAL.gold); Px.text(ctx, 'SALTA', W / 2, 140, PAL.gold, 2, 'center');
      arrow(ctx, 36, 157, 'down', '#7fd3ff'); Px.text(ctx, 'SCIVOLA', W / 2, 155, '#7fd3ff', 2, 'center');
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }

  const dim = (ctx, a) => { ctx.fillStyle = `rgba(16,21,31,${a})`; ctx.fillRect(0, 0, W, H); };

  function render(ctx) {
    ctx.save();
    if (g.shake > 0) ctx.translate((Math.random() - 0.5) * 3 * (g.shake / 0.35), (Math.random() - 0.5) * 2 * (g.shake / 0.35));
    const camX = Px.clamp((g.laneF - 1) * 0.9, -1.6, 1.6);                 // la camera segue appena la corsia
    ctx.translate(W / 2, H); ctx.rotate(-camX * 0.006); ctx.scale(1.035, 1.035); ctx.translate(-W / 2 - camX * 0.8, -H);
    World.render(ctx, st);
    Gfx.lights(ctx, st.T, g.zone === 'uni');
    drawAtmosphere(ctx);
    World.drawGate(ctx, st);
    if (g.uniGate) World.drawGate(ctx, st, st.uniStart, CFG.ZONES.uni.gate, { main: '#1f3a7a', hi: '#4a69b0', dark: '#0e1a3d' });
    const objs = g.objs.slice().sort((a, b) => b.w - a.w);
    let heroDone = false;
    for (const o of objs) {
      if (!heroDone && o.w - st.T <= 0) { if (g.phase !== 'door') drawHero(ctx); heroDone = true; }
      drawObj(ctx, o);
    }
    if (!heroDone && g.phase !== 'door') drawHero(ctx);
    for (const o of objs) drawHint(ctx, o);
    if (!(g.phase === 'door' && g.door && g.door.result === 'wrong' && g.door.t > 0.7) && !(g.phase === 'caught' && g.phaseT > 0.15)) drawChaser(ctx);
    if (g.phase === 'caught') drawCatchNurse(ctx);
    if (g.phase === 'door' && g.door) drawDoorScene(ctx);
    fx.draw(ctx);
    Gfx.speedLines(ctx, g.time, g.speed);
    ctx.restore();

    if (g.flash > 0) { ctx.fillStyle = `rgba(255,247,214,${Math.min(1, g.flash * 2)})`; ctx.fillRect(0, 0, W, H); }
    drawHud(ctx);

    if (g.paused) {
      dim(ctx, 0.65);
      Px.text(ctx, 'PAUSA', W / 2, 84, '#fff', 6, 'center', PAL.ink);
      Px.text(ctx, 'VELOCITA', W / 2, 111, '#fff', 2, 'center', PAL.ink);
      SPEEDS.forEach((v, i) => {
        const on = v.k === speedK, b = SPD_BTN[i];
        Px.button(ctx, b.x, b.y, b.w, b.h, v.l, on ? { f: 1.5, color: '#f6c344', dark: '#b98a1c', light: '#ffe27a', text: '#3a2a00' } : { f: 1.5, color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
      });
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
        const si = SPD_BTN.findIndex((b) => Px.hit(b, p, 2));
        if (si >= 0) { speedK = SPEEDS[si].k; Save.set({ speedK }); Sfx.select(); }
        else if (Px.hit(BTN_RESUME, p, 3)) { Sfx.select(); setPaused(false); }
        else if (Px.hit(BTN_QUIT, p, 3)) { Sfx.select(); app.go('menu'); }
        return;
      }
      if (Px.hit(PAUSE_BTN, p, 6)) { Sfx.select(); setPaused(true); return; }
      if (g.phase === 'door' && g.door && g.door.state === 'ask') {
        for (let i = 0; i < 3; i++) if (Px.hit(DOOR_BOXES[i], p, 3)) { g.door.sel = i; pickDoor(i); return; }
      }
      return;
    }
    act(action);
  }

  function setPaused(v) {
    if (g.phase === 'over' || g.phase === 'finishing') return;
    g.paused = v;
    if (v) Sfx.stopMusic(); else if (g.phase === 'run' || g.phase === 'corridor' || g.phase === 'door') Sfx.startMusic();
  }

  return {
    enter() { Sfx.start(); Sfx.startMusic(); },
    leave() { Sfx.stopMusic(); },
    update, render, input,
    pause() { if (g.phase === 'run' || g.phase === 'corridor' || g.phase === 'door') setPaused(true); },
    debug: { g, st }
  };
}
