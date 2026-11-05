// Nurse Surf 3D: avvio, scene (menu, intro, gioco, finale) e interfaccia. Usa le regole di js/config.js (CFG).
import { THREE, clamp, lerp, ease, easeOut, rnd, pick, lam, std, box, rbox, cyl, sph, labelTex, canvasTex } from './util.js';
import { buildMartina, setForm, face, pose } from './martina.js';
import { buildNurse, nursePose, buildProf, profPose } from './nurse.js';
import { makeProp, makeMedal, makeHint } from './props3d.js';
import { buildWorld, U, HALF_W, LANES } from './world.js';
import { createParticles } from './fx3d.js';

// ---------------------------------------------------------------- base: renderer, camera, luci
const stage = document.getElementById('stage');
const canvas = document.getElementById('game3d');
const ui = document.getElementById('ui');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdff2f6);
scene.fog = new THREE.Fog(0xdff2f6, 24, 72);
const camera = new THREE.PerspectiveCamera(62, 9 / 16, 0.1, 140);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c9d1, 1.15));
const sun = new THREE.DirectionalLight(0xfff4e0, 0.75); sun.position.set(3, 8, 5); scene.add(sun);

function resize() {
  let h = window.innerHeight, w = h * 9 / 16;
  if (w > window.innerWidth) { w = window.innerWidth; h = w * 16 / 9; }
  stage.style.width = Math.floor(w) + 'px'; stage.style.height = Math.floor(h) + 'px';
  renderer.setPixelRatio(pixelRatio); renderer.setSize(Math.floor(w), Math.floor(h), false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

const world = buildWorld(scene);
const fx = createParticles(scene, 1400);

const camPos = new THREE.Vector3(0, 3, 5), camLook = new THREE.Vector3(0, 1.3, -8), tmpV = new THREE.Vector3();
function setCam(pos, look, k, dt) {                      // k = rapidita' di inseguimento (1/s); k=0 -> subito
  const f = k ? 1 - Math.exp(-dt * k) : 1;
  camPos.lerp(pos, f); camLook.lerp(look, f);
}
let shakeAmt = 0;

const $ = (html) => { const t = document.createElement('div'); t.innerHTML = html.trim(); return t.firstChild; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function project(v) { const p = tmpV.copy(v).project(camera); return { x: (p.x * 0.5 + 0.5) * 100, y: (-p.y * 0.5 + 0.5) * 100 }; }

const flashEl = $('<div id="flash"></div>');
let flashT = 0, flashDur = 0.4;
function flash(color = '#fff', dur = 0.4) { flashEl.style.background = color; flashT = dur; flashDur = dur; }

// ---------------------------------------------------------------- scene manager
const app = {
  scene: null, name: '',
  go(name, arg) {
    if (app.scene && app.scene.leave) app.scene.leave();
    ui.innerHTML = ''; ui.appendChild(flashEl);
    fx.clear(); shakeAmt = 0;
    app.name = name; app.scene = SCENES[name](arg);
    app.scene.enter();
  }
};
const SCENES = {};

function resetWorld() {
  for (const o of world.objects.slice()) world.remove(o.obj);
  world.gateIdx = Infinity; world.root.visible = true;
  for (const s of world.segs) s.idx = -999;
  world.setFog(scene, false, 0);
}
function clearActors() { for (const c of scene.children.slice()) if (c.userData.actor) scene.remove(c); }
const actor = (o) => { o.userData.actor = true; scene.add(o); return o; };

// ---------------------------------------------------------------- cache degli oggetti (niente costruzioni durante la corsa)
const TPL = {};
function getProp(type) {
  const t = TPL[type] || (TPL[type] = makeProp(type));
  return { root: t.root.clone(true), kind: t.kind, len: t.len };
}
function getMedal() {
  const t = TPL.__medal || (TPL.__medal = makeMedal());
  const root = t.root.clone(true); return { root, spin: root.children[0] };
}

// ---------------------------------------------------------------- tabelle del gioco
const SETS = {
  hospital: { jump: ['wetsign', 'bucket', 'boxes', 'barrier'], block: ['gurney1', 'gurney2', 'wheelchair', 'cart', 'vending'], slide: ['rx', 'lab', 'cardio', 'pedia'] },
  uni: { jump: ['books', 'backpacks', 'papers', 'wetsign'], block: ['prof', 'bookshelf', 'whiteboard', 'vending'], slide: ['u_aula', 'u_bib', 'u_esami', 'u_lez'] }
};
const ROAR = { hulk: ['GRRR...', 'GRAAAH!', '#7ee08f'], hen: ['CO CO...', "COCCODE'!", '#fff3b0'], sumo: ['', 'HAI!', '#ffd27a'] };
const OUTFIT_SW = { casual: 'linear-gradient(135deg,#34343f,#1c1c23 60%,#7a1f35)', elegante: 'linear-gradient(135deg,#aab1a5,#8f978c 60%,#b33a3a)', uniforme: 'linear-gradient(135deg,#58d3c1,#2fb5a3 60%,#fff)' };
let outfitSel = (Save.get().outfit && CFG.OUTFITS.includes(Save.get().outfit)) ? Save.get().outfit : 'casual';

function muteBtn() {
  const b = $('<button class="btn sq mute">♪</button>');
  const sync = () => { b.textContent = Sfx.isMuted() ? '✕' : '♪'; };
  b.onclick = () => { Sfx.unlock(); Sfx.toggleMute(); sync(); }; sync();
  return b;
}

// ---------------------------------------------------------------- MENU
SCENES.menu = () => {
  let M, t = 0;
  const S = {};
  S.enter = () => {
    resetWorld(); clearActors(); world.update(0.35);
    M = buildMartina(outfitSel); M.root.position.set(0, 0, 0); actor(M.root);
    const best = Save.get().best || 0;
    const el = $(`<div id="menu">
      <div class="logo"><span class="a title">NURSE</span><span class="b title">SURF 3D</span></div>
      <div class="sub">UNA CORSA PER ${esc(CFG.NAME)}</div>
      ${best ? `<div class="rec">RECORD<b>${best}</b></div>` : ''}
      <div class="name" id="oname"></div>
      <div class="outfits"></div>
      <button class="btn start">GIOCA!</button></div>`);
    const outs = el.querySelector('.outfits'), name = el.querySelector('#oname');
    const refresh = () => {
      name.textContent = CFG.OUTFIT_TITLES[outfitSel];
      outs.querySelectorAll('.opt').forEach((o) => o.classList.toggle('on', o.dataset.o === outfitSel));
    };
    CFG.OUTFITS.forEach((o) => {
      const d = $(`<div class="opt" data-o="${o}"><div class="sw" style="background:${OUTFIT_SW[o]}"></div>${esc(CFG.OUTFIT_LABELS[o])}</div>`);
      d.onclick = () => {
        Sfx.unlock(); Sfx.select(); outfitSel = o; Save.set({ outfit: o });
        scene.remove(M.root); M = buildMartina(o); actor(M.root); refresh();
      };
      outs.appendChild(d);
    });
    el.querySelector('.start').onclick = () => { Sfx.unlock(); Sfx.start(); app.go('intro'); };
    ui.appendChild(el); ui.appendChild(muteBtn()); refresh();
  };
  S.update = (dt) => {
    t += dt; pose(M, 'stand', t); M.root.rotation.y = Math.sin(t * 0.8) * 0.35;
    setCam(new THREE.Vector3(Math.sin(t * 0.35) * 0.7, 1.35, -2.7), new THREE.Vector3(0, 1.0, 0), 0, dt);
  };
  return S;
};

// ---------------------------------------------------------------- INTRO (fumetti: si avanza solo toccando)
SCENES.intro = () => {
  const S = {}, script = CFG.INTRO.script;
  let M, N, i = -1, t = 0, nurseIn = 0, leave = 0, dlg, say;
  const go = () => { Sfx.start(); app.go('game', { outfit: outfitSel }); };
  const next = () => {
    i++;
    if (i >= script.length) { leave = 0.0001; say && say.remove(); say = null; Sfx.warn(); return; }
    const L = script[i];
    if (L.who === 'n' && !nurseIn) nurseIn = 0.0001;
    face(M, L.scare ? 'scared' : 'smile'); S.scare = !!L.scare;
    if (say) say.remove();
    say = $(`<div class="say">${L.lines.map(esc).join('<br>')}</div>`); dlg.appendChild(say); Sfx.select();
    S.speaker = L.who;
  };
  S.enter = () => {
    resetWorld(); clearActors(); world.update(0.35);
    M = buildMartina(outfitSel); M.root.position.set(-0.8, 0, 0); actor(M.root);
    N = buildNurse(); N.root.position.set(3.8, 0, 0.4); actor(N.root);
    dlg = $('<div id="dlg"></div>'); ui.appendChild(dlg);
    const skip = $('<button class="btn blue skip">SALTA ▸▸</button>'); skip.onclick = (e) => { e.stopPropagation(); go(); }; dlg.appendChild(skip);
    dlg.appendChild($('<div class="tapmsg">TOCCA PER CONTINUARE</div>'));
    next();
  };
  S.input = (a) => { if ((a === 'tap' || a === 'confirm') && !leave) next(); };
  S.update = (dt) => {
    t += dt;
    if (nurseIn) { nurseIn = Math.min(1, nurseIn + dt / 0.9); N.root.position.x = lerp(3.8, 0.95, easeOut(nurseIn)); nursePose(N, nurseIn < 1 ? 'run' : 'stand', t); N.root.rotation.y = 0; }
    else N.root.position.x = 3.8;
    if (!leave) { pose(M, S.scare ? 'scared' : 'stand', t); M.root.rotation.y = 0.15; }
    else {
      leave += dt; const p = leave;
      M.root.rotation.y = Math.PI; pose(M, 'run', t); M.root.position.z += 7 * dt; N.root.rotation.y = Math.PI; nursePose(N, 'run', t);
      N.root.position.set(lerp(N.root.position.x, M.root.position.x, 0.04), 0, N.root.position.z + 6.2 * dt);
      if (p > 0.55) { go(); return; }
    }
    // fumetto sopra chi parla
    if (say) {
      const who = S.speaker === 'n' ? N : M;
      const pt = project(tmpV.set(who.root.position.x, S.speaker === 'n' ? 2.35 : 2.05, who.root.position.z));
      say.style.left = clamp(pt.x, 33, 67) + '%'; say.style.top = pt.y + '%'; say.style.transform = 'translate(-50%,-110%)';
    }
    setCam(new THREE.Vector3(0.3, 1.5, -4.3), new THREE.Vector3(0.1, 1.1, 0), 4, dt);
  };
  return S;
};

// ---------------------------------------------------------------- GIOCO
SCENES.game = (opt) => {
  const outfit = (opt && opt.outfit) || outfitSel;
  const S = {};
  const CATCH = { arrive: 1.3, back: 1.9, stab: 2.2, end: 6.2 };
  let M, N, hud, hearts = [], scoreEl, progEl, cfuEl, bubbleEl, bannerEl, tutEl, panel = null, qEl = null, roarEl = null;
  const track = actor(new THREE.Group());
  let speedK = Save.get().speedK || 1;
  const g = {
    time: 0, T: 0, speed: CFG.START_SPEED * 0.7, lane: 1, laneF: 1, x: 0, jumpT: 0, slideT: 0,
    objs: [], nextRowW: 2.4, uniGate: false, doorIdx: 0, hits: 0, cfu: 0, healCount: 0, invul: 0, sinceHit: 0,
    gap: CFG.CHASER_START_GAP, gapT: CFG.CHASER_START_GAP, nurseX: 0,
    phase: 'run', phaseT: 0, bubble: '', bubbleT: 0, score: 0, finale: false, paused: false, ended: false,
    pre: {}, warm: [], tasks: [], gateW: null, uniW: null, finaleDoor: null, door: null, c: null, t: 0, bannerT: 0, tutT: 7
  };
  S.g = g;

  // ---- costruzione ----
  S.enter = () => {
    resetWorld(); clearActors(); actor(track);
    M = buildMartina(outfit); actor(M.root); N = buildNurse(); actor(N.root); S.M = M; S.N = N;
    hud = $('<div id="hud"></div>'); ui.appendChild(hud);
    const hr = $('<div class="hearts"></div>'); hud.appendChild(hr);
    for (let i = 0; i < CFG.MAX_HITS; i++) { const h = $('<div class="heart"></div>'); hr.appendChild(h); hearts.push(h); }
    scoreEl = $('<div class="score title">0</div>'); hud.appendChild(scoreEl);
    const pb = $('<button class="btn sq pause">❚❚</button>'); pb.onclick = () => setPaused(true); hud.appendChild(pb);
    progEl = $('<div class="prog"><i></i></div>'); hud.appendChild(progEl);
    const marks = CFG.DOOR.puzzles.map((p) => p.atCfu).concat([CFG.UNI_AT_CFU]);
    marks.forEach((c) => { const u = document.createElement('u'); u.style.left = (c / CFG.CFU_GOAL * 100) + '%'; progEl.appendChild(u); });
    cfuEl = $('<div class="cfu"><div class="med"></div><b>0/' + CFG.CFU_GOAL + ' CFU</b></div>'); hud.appendChild(cfuEl);
    tutEl = $('<div class="tut glass"><i>◀▶</i> CAMBIA CORSIA<br><i>▲</i> SALTA &nbsp; <i>▼</i> SCIVOLA</div>'); hud.appendChild(tutEl);
    updateHud(); Sfx.start(); Sfx.startMusic();
    const warm = (o) => { o.position.set(0, 0, -66); scene.add(o); g.warm.push({ o, n: 3 }); };
    ['hospital', 'uni'].forEach((z) => Object.values(SETS[z]).flat().forEach((t) => g.tasks.push(() => { const p = getProp(t); warm(p.root); })));
    g.tasks.push(() => { warm(getMedal().root); });
    CFG.DOOR.puzzles.forEach((pz, i) => g.tasks.push(() => { const doors = pz.doors.slice().sort(() => Math.random() - 0.5); const wall = world.makeDoorWall(doors, doors.map((d) => d.label)); g.pre['wall' + i] = { doors, wall }; warm(wall); }));
    g.tasks.push(() => { g.pre.gateUni = world.makeGate(CFG.ZONES.uni.gate); warm(g.pre.gateUni); });
    g.tasks.push(() => { g.pre.gateFin = world.makeGate(CFG.FINALE.gateText); warm(g.pre.gateFin); });
    g.tasks.push(() => { g.pre.finDoor = world.makeFinaleDoor(CFG.FINALE.doorText); warm(g.pre.finDoor); });
    camPos.set(0, 3.7, 6.6); camLook.set(0, 1.4, -9);
  };
  S.leave = () => { Sfx.stopMusic(); };

  // ---- generazione ----
  const KINDS = ['jump', 'slide', 'block'];
  function add(lane, type, w) {
    if (type === 'cfu') { const m = getMedal(); track.add(m.root); g.objs.push({ lane, w, medal: m, root: m.root, done: false, seed: Math.random() * 6.28, kind: 'cfu', len: 0.8 }); return; }
    const p = getProp(type); track.add(p.root); let hint = null;
    if (p.kind !== 'slide') { hint = makeHint(p.kind); hint.position.set(0, p.kind === 'block' ? 2.15 : 1.6, 0); p.root.add(hint); }
    g.objs.push({ lane, w, root: p.root, kind: p.kind, len: p.len, done: false, hint });
  }
  function spawnRow(w, d) {
    const set = SETS[g.uniGate ? 'uni' : 'hospital'], x = Math.random(), lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    let used;
    if (x < 0.55 - d * 0.25) { add(lanes[0], pick(set[pick(KINDS)]), w); used = [lanes[0]]; }
    else if (x < 0.88 - d * 0.1) { for (let i = 0; i < 2; i++) add(lanes[i], pick(set[pick(KINDS)]), w); used = [lanes[0], lanes[1]]; }
    else {
      const ks = [pick(KINDS), pick(KINDS), pick(KINDS)];
      if (ks.every((k) => k === 'block')) ks[(Math.random() * 3) | 0] = pick(['jump', 'slide']);
      for (let i = 0; i < 3; i++) add(lanes[i], pick(set[ks[i]]), w);
      used = [0, 1, 2];
    }
    const free = [0, 1, 2].filter((l) => !used.includes(l));
    if (free.length && Math.random() < 0.45) add(pick(free), 'cfu', w);
  }
  function updateSpawn() {
    const d = clamp(g.time / CFG.RAMP_TIME, 0, 1);
    while (g.nextRowW < g.T + 3.2) {
      if (g.cfu >= CFG.CFU_GOAL) { startCorridor(); break; }
      const pz = CFG.DOOR.puzzles[g.doorIdx];
      if (pz && g.cfu >= pz.atCfu && (pz.zone === 'hospital' ? !g.uniGate : g.uniGate)) { startDoor(pz); break; }
      if (!g.uniGate && g.cfu >= CFG.UNI_AT_CFU) startUni();
      spawnRow(g.nextRowW, d);
      const gapW = lerp(1.25, 0.9, d) * Math.max(g.speed, 0.8);
      if (Math.random() < 0.5) { const l = (Math.random() * 3) | 0; for (let i = 0; i < 3; i++) add(l, 'cfu', g.nextRowW + gapW * 0.35 + i * 0.2); }
      g.nextRowW += gapW;
    }
  }
  function startUni() {
    g.uniGate = true; g.uniW = Math.ceil(g.nextRowW + 0.5); g.nextRowW = g.uniW + 0.8;
    world.gateIdx = g.uniW;
    const gate = g.pre.gateUni || world.makeGate(CFG.ZONES.uni.gate); world.anchor(gate, g.uniW + 0.5);
  }
  function startCorridor() {
    if (g.finale) return;
    g.finale = true; g.phase = 'corridor';
    const gw = g.nextRowW + 0.5;
    world.anchor(g.pre.gateFin || world.makeGate(CFG.FINALE.gateText), gw);
    const seq = [1, 1, 0, 1, 2, 1, 1, 0, 1, 2, 1];
    seq.forEach((l, i) => add(l, 'cfu', gw + 0.5 + i * 0.3));
    g.finaleDoor = { w: gw + 0.5 + seq.length * 0.3 + 1.0 };
    const d = g.pre.finDoor || world.makeFinaleDoor(CFG.FINALE.doorText); world.anchor(d, g.finaleDoor.w); g.finaleDoor.obj = d; g.finaleDoor.open = 0;
    Sfx.warn();
  }

  // ---- indovinello a tre porte ----
  function startDoor(pz) {
    const pre = g.pre['wall' + g.doorIdx];
    const doors = pre ? pre.doors : pz.doors.slice().sort(() => Math.random() - 0.5);
    const w = g.nextRowW + 1.0;
    const wall = pre ? pre.wall : world.makeDoorWall(doors, doors.map((d) => d.label));
    world.anchor(wall, w);
    g.phase = 'door'; if (tutEl) { tutEl.remove(); tutEl = null; }
    g.door = { w, wall, pz, doors, state: 'run', t: 0, sel: 1, pick: -1, stop: 7.0 };
  }
  function showQuestion() {
    const d = g.door, pz = d.pz;
    const q = $(`<div id="q" class="glass"><h3>${pz.question.map(esc).join('<br>')}</h3>${pz.answers ? pz.answers.map((a) => '<p>' + esc(a) + '</p>').join('') : ''}<div class="ans"></div><div class="hint">TOCCA UNA PORTA</div></div>`);
    const ans = q.querySelector('.ans');
    d.doors.forEach((dr, i) => {
      const o = $(`<div class="opt"><b>${esc(dr.kind)}</b>${esc(dr.label)}</div>`);
      o.onclick = () => choose(i);
      ans.appendChild(o);
    });
    qEl = q; hud.appendChild(q);
  }
  function choose(i) {
    const d = g.door; if (!d || d.state !== 'ask') return;
    d.pick = i; d.t = 0; Sfx.select();
    if (qEl) { qEl.remove(); qEl = null; }
    if (d.doors[i].right) { d.state = 'open'; Sfx.door(); }
    else d.state = 'bump';
  }
  function updateDoor(dt) {
    const d = g.door; d.t += dt;
    const dz = (d.w - g.T) * U;                              // distanza dalla parete (m)
    if (d.state === 'run') {
      const rem = dz - d.stop;
      g.speed = Math.min(g.speed, Math.max(0, rem * 0.09));
      if (rem < 0.12 || g.speed < 0.02 && rem < 1) { g.speed = 0; d.state = 'ask'; d.t = 0; Sfx.warn(); showQuestion(); }
    } else if (d.state === 'ask') { g.speed = 0; }
    else if (d.state === 'open') {
      g.speed = 0;
      const k = easeOut(d.t / 0.7), dr = d.wall.userData.doors[d.pick];
      dr.hinge.rotation.y = k * 1.7;
      if (d.t > 0.8 && !d.ok) { d.ok = true; flash('#fff7d6', 0.5); Sfx.start(); fx.burst(dr.x, 1.8, -dz, [0xf6c344, 0xffffff, 0x3bb273, 0x3e7bd6], 40, 4, 1.2, 4, 2); }
      if (d.ok) {
        d.wall.userData.doors.forEach((o) => { o.frame.visible = false; });
        d.wall.visible = d.t < 1.0;
        g.speed = Math.min(CFG.START_SPEED, g.speed + dt * 1.2); g.speed = Math.max(g.speed, 0.7);
        g.x += (dr.x - g.x) * Math.min(1, dt * 7);
        if (g.T > d.w + 1.3) { world.remove(d.wall); g.doorIdx++; g.phase = 'run'; g.door = null; g.nextRowW = Math.max(g.nextRowW, g.T + 3.2); g.lane = 1; }
      }
    } else if (d.state === 'bump') {
      g.speed = 0;
      if (d.t > 0.15 && !d.bumped) { d.bumped = true; Sfx.hit(); shakeAmt = 0.4; }
      if (d.t > 0.9) startCatch('door');
    }
  }

  // ---- cattura: puntura e trasformazione ----
  function startCatch(why) {
    if (g.phase === 'catch') return;
    g.phase = 'catch'; g.hits = CFG.MAX_HITS; if (tutEl) { tutEl.remove(); tutEl = null; }
    g.c = { t: 0, morph: pick(['hulk', 'hen', 'sumo']), ev: {}, sz: N.root.position.z, x: g.x, morphed: false };
    g.door = g.door; updateHud(); Sfx.stopMusic();
    g.bubble = ''; if (bubbleEl) { bubbleEl.remove(); bubbleEl = null; }
    if (g.door && g.door.wall) { /* la parete resta dov'e' */ }
  }
  function morphBurst(kind) {
    const p = M.root.position, y = 1.6;
    if (kind === 'hen') { Sfx.cluck(); fx.burst(p.x, y, p.z, [0xffffff, 0xfff3d6, 0xe0344b, 0xf7a531], 60, 4, 1.2, 3, 1); }
    else if (kind === 'sumo') { Sfx.sumo(); shakeAmt = 0.9; fx.burst(p.x, 0.5, p.z, [0xe8d9c0, 0xcdb89a, 0xffffff, 0xf6c344], 50, 4, 1.0, 1, 2); }
    else { Sfx.roar(); shakeAmt = 0.7; fx.burst(p.x, y, p.z, [0xffffff, 0x2c2c34, 0x7ee08f, 0x6e32aa], 50, 5, 0.9, 1, 2); }
  }
  function updateCatch(dt) {
    const c = g.c; c.t += dt; const t = c.t;
    g.speed = Math.max(0, g.speed - dt * 18);
    const stabAt = CATCH.stab;
    const pz = (arr) => arr;
    // Martina
    const turn = ease((t - 0.25) / 0.6);
    M.yaw = Math.PI * turn; M.root.position.x = g.x; M.root.position.z = 0;
    if (!c.morphed) {
      pose(M, 'scared', t); face(M, 'scared');
      if (t > stabAt + 0.45) {                                // si gonfia / trema prima di trasformarsi
        const k = clamp((t - stabAt - 0.45) / 1.0, 0, 1), s = 1 + Math.sin(t * 38) * 0.04 * k + k * 0.12;
        M.root.scale.set(M.hs * s, M.hs * s, M.hs * s);
        if (!c.glow && (c.glow = true)) { fx.burst(g.x, 1.0, 0, c.morph === 'hulk' ? [0x7ee08f, 0x3bb273] : [0xffffff, 0xf6c344], 24, 2.2, 0.9, -1, 1); }
      }
      if (t >= stabAt + 1.46) { c.morphed = true; setForm(M, c.morph); morphBurst(c.morph); c.mt = t; }
    } else {
      pose(M, 'roar', t); face(M, c.morph === 'hen' ? 'hen' : 'angry');
    }
    // infermiera
    const nx = N.root.position;
    nx.x = lerp(nx.x, g.x, Math.min(1, dt * 8));
    let nz;
    const arrive = easeOut(clamp(t / CATCH.arrive, 0, 1));
    nz = lerp(c.sz, 1.75, arrive);
    if (t > CATCH.arrive + 0.3 && t < CATCH.back) nz = lerp(1.75, 2.1, ease((t - CATCH.arrive - 0.3) / (CATCH.back - CATCH.arrive - 0.3)));
    else if (t >= CATCH.back) nz = lerp(2.1, 1.22, ease((t - CATCH.stab + 0.12) / 0.12));
    if (c.morphed) nz = lerp(1.22, 2.7, ease((t - c.mt) / 0.7));
    nx.z = nz; N.root.rotation.y = 0;
    nursePose(N, t < CATCH.arrive ? 'run' : 'stand', t);
    const sy = N.syringe, ar = ease((t - CATCH.arrive) / 0.4);
    sy.rotation.y = lerp(0, -Math.PI / 2, ar); sy.position.set(0, lerp(0.95, 0.42, ar), lerp(0, -0.05, ar));
    if (t > CATCH.arrive + 0.3 && t < CATCH.back) sy.position.z = lerp(-0.05, 0.25, ease((t - CATCH.arrive - 0.3) / 0.5));
    // eventi
    const once = (k, at, fn) => { if (t >= at && !c.ev[k]) { c.ev[k] = 1; fn(); } };
    once('warn', 0.35, () => Sfx.warn());
    once('stab', stabAt, () => { flash('#ffffff', 0.35); shakeAmt = 0.6; Sfx.hit(); fx.burst(g.x, 1.3, 0.2, [0xffffff, 0x7fd3ff, 0xe0344b, 0xf6c344], 30, 3, 0.7, 4, 1); });
    // testo del verso
    const sp = t - stabAt;
    if (c.morphed && sp > 1.46 && sp < 3.8 && ROAR[c.morph][1]) {
      if (!roarEl) { roarEl = $('<div class="big"></div>'); hud.appendChild(roarEl); }
      roarEl.textContent = ROAR[c.morph][1]; roarEl.style.color = ROAR[c.morph][2];
    } else if (roarEl) { roarEl.remove(); roarEl = null; }
    if (t > 0.3 && t < CATCH.arrive + 0.3 && !c.exc) { c.exc = true; }
    if (t > CATCH.end && !g.ended) endGame();
  }

  // ---- fine partita / pannelli ----
  function endGame() {
    g.ended = true; g.phase = 'over';
    const best = Save.get().best || 0, nb = g.score > best; if (nb) Save.set({ best: g.score });
    Sfx.gameOver();
    const p = $(`<div class="panel glass"><h2 class="title">${nb ? 'RECORD!' : 'PUNTURA!'}</h2><p>PUNTI <b>${g.score}</b></p><p>CFU <b>${g.cfu}/${CFG.CFU_GOAL}</b></p><p>RECORD <b>${Math.max(best, g.score)}</b></p><button class="btn wide" id="again">RIPROVA</button><button class="btn blue wide" id="home">MENU</button></div>`);
    p.querySelector('#again').onclick = () => { Sfx.select(); app.go('game', { outfit }); };
    p.querySelector('#home').onclick = () => { Sfx.select(); app.go('menu'); };
    hud.appendChild(p);
  }
  function setPaused(v) {
    g.paused = v;
    if (panel) { panel.remove(); panel = null; }
    if (v) {
      Sfx.stopMusic();
      panel = $('<div><div class="dim" style="pointer-events:auto"></div><div class="panel glass"><h2 class="title">PAUSA</h2><p>VELOCITA\'</p><div class="row" id="spd"></div><button class="btn wide" id="res">RIPRENDI</button><button class="btn red wide" id="quit">ESCI</button></div></div>');
      const row = panel.querySelector('#spd');
      [{ k: 0.8, l: 'LENTO' }, { k: 1, l: 'NORMALE' }, { k: 1.2, l: 'VELOCE' }].forEach((s) => {
        const b = $(`<button class="btn blue${s.k === speedK ? ' on' : ''}">${s.l}</button>`);
        b.onclick = () => { speedK = s.k; Save.set({ speedK }); Sfx.select(); row.querySelectorAll('.btn').forEach((x) => x.classList.remove('on')); b.classList.add('on'); };
        row.appendChild(b);
      });
      panel.querySelector('#res').onclick = () => { Sfx.select(); setPaused(false); };
      panel.querySelector('#quit').onclick = () => { Sfx.select(); app.go('menu'); };
      hud.appendChild(panel);
    } else if (g.phase === 'run' || g.phase === 'corridor' || g.phase === 'door') Sfx.startMusic();
  }
  function updateHud() {
    hearts.forEach((h, i) => h.classList.toggle('off', i >= CFG.MAX_HITS - g.hits));
    scoreEl.textContent = g.score;
    progEl.firstChild.style.width = clamp(g.cfu / CFG.CFU_GOAL, 0, 1) * 100 + '%';
    cfuEl.querySelector('b').textContent = g.cfu + '/' + CFG.CFU_GOAL + ' CFU';
  }
  function say(text, t = 1.6) {
    if (bubbleEl) bubbleEl.remove();
    bubbleEl = $(`<div class="bubble">${esc(text)}</div>`); hud.appendChild(bubbleEl); g.bubbleT = t;
  }

  // ---- ostacoli, medagliette ----
  function hit() {
    g.hits++; g.invul = 1.3; g.sinceHit = 0; g.gapT = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP;
    Sfx.hit(); shakeAmt = 0.5; flash('rgba(224,52,75,0.5)', 0.3); updateHud();
    if (g.hits >= CFG.MAX_HITS) { startCatch('hits'); return; }
    say(pick(CFG.ZONES[g.uniGate ? 'uni' : 'hospital'].bubbles));
  }
  function collide() {
    for (const o of g.objs) {
      if (o.done) continue;
      const d = (o.w - g.T) * U;
      if (Math.abs(LANES[o.lane] - g.x) > 1.1) continue;
      if (o.kind === 'cfu') {
        if (Math.abs(d) < 1.0) {
          o.done = true; o.root.visible = false; g.cfu = Math.min(CFG.CFU_GOAL, g.cfu + CFG.CFU_PER_MEDAL); g.healCount++;
          Sfx.coin(); fx.burst(LANES[o.lane], 1.0, -d, [0xffe27a, 0xffffff, 0xf6c344], 10, 2.4, 0.5, 2, 1);
          if (g.healCount >= 6) { g.healCount = 0; if (g.hits > 0) { g.hits--; g.gapT = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP; Sfx.start(); say('+1 CUORE!'); } }
          updateHud();
        }
        continue;
      }
      if (d > o.len / 2 + 0.3 || d < -o.len / 2 - 0.3) continue;
      if (g.invul > 0) continue;
      const jh = g.jumpT > 0 ? 4 * 1.7 * (1 - g.jumpT / CFG.JUMP_TIME) * (g.jumpT / CFG.JUMP_TIME) : 0;
      let bad = false;
      if (o.kind === 'jump') bad = jh < 0.7; else if (o.kind === 'slide') bad = g.slideT <= 0; else bad = true;
      if (bad) { o.done = true; hit(); if (o.kind === 'block') o.root.rotation.z = 0.25; }
    }
  }

  // ---- input ----
  S.input = (a, data) => {
    if (g.paused || g.phase === 'over') return;
    if (g.phase === 'door' && g.door && g.door.state === 'ask') {
      if (a === 'left') { g.door.sel = Math.max(0, g.door.sel - 1); Sfx.lane(); }
      else if (a === 'right') { g.door.sel = Math.min(2, g.door.sel + 1); Sfx.lane(); }
      else if (a === 'up' || a === 'confirm') choose(g.door.sel);
      else if (a === 'tap' && data) {                            // tocco su una porta 3D
        const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(data.x / CFG.W * 2 - 1, -(data.y / CFG.H * 2 - 1)), camera);
        let best = -1, bd = 1e9;
        g.door.wall.userData.doors.forEach((dr, i) => { const hit = ray.intersectObject(dr.leaf, false)[0]; if (hit && hit.distance < bd) { bd = hit.distance; best = i; } });
        if (best >= 0) choose(best);
      }
      return;
    }
    if (g.phase !== 'run' && g.phase !== 'corridor' && !(g.phase === 'door' && g.door && (g.door.state === 'run'))) return;
    if (a === 'left' && g.lane > 0) { g.lane--; Sfx.lane(); }
    else if (a === 'right' && g.lane < 2) { g.lane++; Sfx.lane(); }
    else if (a === 'up' && g.jumpT <= 0) { g.slideT = 0; g.jumpT = CFG.JUMP_TIME; Sfx.jump(); }
    else if (a === 'down') { if (g.jumpT > 0) g.jumpT = Math.min(g.jumpT, 0.12); if (g.slideT <= 0) { g.slideT = CFG.SLIDE_TIME; Sfx.slide(); } }
  };

  // ---- aggiornamento ----
  S.update = (dt) => {
    if (g.paused) return;
    g.t += dt;
    g.frame = (g.frame || 0) + 1; if (g.tasks.length && g.frame % 6 === 0) g.tasks.shift()();
    for (let i = g.warm.length - 1; i >= 0; i--) { if (--g.warm[i].n <= 0) { scene.remove(g.warm[i].o); g.warm.splice(i, 1); } }
    const run = g.phase === 'run' || g.phase === 'corridor' || g.phase === 'door';
    if (g.tutT > 0 && g.phase === 'run') { g.tutT -= dt; if (g.tutT < 0 && tutEl) { tutEl.remove(); tutEl = null; } else if (tutEl && g.tutT < 1) tutEl.style.opacity = g.tutT; }
    if (g.phase !== 'catch' && g.phase !== 'over') {
      g.time += dt;
      const target = Math.min(CFG.MAX_SPEED, CFG.START_SPEED + CFG.SPEED_GAIN * g.time) * speedK;
      if (g.phase === 'run' || g.phase === 'corridor') g.speed += (target - g.speed) * Math.min(1, dt * 1.5);
    }
    if (g.phase === 'door') updateDoor(dt);
    if (g.phase === 'catch') updateCatch(dt);
    if (run) {
      if (g.phase === 'run' || g.phase === 'corridor') { /* velocita' gia' in g.speed */ }
      g.T += g.speed * dt;
      if (g.phase === 'run') updateSpawn();
      if (g.phase !== 'door' || (g.door && g.door.state === 'run')) { /* niente */ }
      g.invul = Math.max(0, g.invul - dt); g.sinceHit += dt;
      if (g.hits > 0 && g.sinceHit > 10 && g.phase === 'run') { g.hits--; g.sinceHit = 0; g.gapT = CFG.CHASER_START_GAP - g.hits * CFG.CHASER_CLOSE_STEP; updateHud(); }
    }
    // corsia e salto
    const frozen = g.phase === 'catch' || (g.phase === 'door' && g.door && g.door.state !== 'run');
    if (!frozen) g.x += (LANES[g.lane] - g.x) * Math.min(1, dt * 12);
    g.laneF = (g.x - LANES[0]) / 2.4;
    if (g.jumpT > 0) g.jumpT = Math.max(0, g.jumpT - dt);
    if (g.slideT > 0) g.slideT = Math.max(0, g.slideT - dt);
    // finale: porta dell'Aula Magna
    if (g.finaleDoor && g.phase === 'corridor') {
      const fd = g.finaleDoor, dz = (fd.w - g.T) * U;
      if (dz < 14) fd.open = Math.min(1, fd.open + dt * 1.4);
      fd.obj.userData.leaves.forEach((l) => { l.hinge.rotation.y = -l.s * fd.open * 1.6; });
      if (dz < 0.4 && !g.ended) { g.ended = true; Sfx.door(); Sfx.stopMusic(); flash('#fff7d6', 0.5); S.toFinale = 0.45; }
    }
    if (S.toFinale != null) { S.toFinale -= dt; if (S.toFinale <= 0) { app.go('finale', { outfit, score: g.score + 500, cfu: g.cfu }); return; } }
    if (g.phase === 'run' || g.phase === 'corridor' || g.phase === 'door') collide();
    // inseguitrice (dietro Martina) e zona
    if (g.phase !== 'catch') {
      g.gap += (g.gapT - g.gap) * Math.min(1, dt * 2.2);
      N.root.position.set(lerp(N.root.position.x, g.x, Math.min(1, dt * 5)), 0, 2.6 + g.gap * 7);
      N.root.rotation.y = 0; nursePose(N, g.speed > 0.05 ? 'run' : 'stand', g.t);
      N.root.visible = g.phase !== 'corridor' || true;
    }
    if (g.uniW != null && g.T >= g.uniW + 0.5 && !g.bannerDone) { g.bannerDone = true; Sfx.start(); bannerEl = $(`<div class="banner glass">${esc(CFG.ZONES.uni.banner.split(' ')[0])}<span>${esc(CFG.ZONES.uni.banner.split(' ').slice(1).join(' '))}</span></div>`); hud.appendChild(bannerEl); g.bannerT = 3; }
    if (g.bannerT > 0) { g.bannerT -= dt; if (g.bannerT <= 0 && bannerEl) { bannerEl.remove(); bannerEl = null; } }
    if (g.bubbleT > 0) { g.bubbleT -= dt; if (g.bubbleT <= 0 && bubbleEl) { bubbleEl.remove(); bubbleEl = null; } }
    // nebbia/tema
    world.update(g.T);
    world.setFog(scene, true, g.uniW != null ? clamp((g.T - g.uniW) / 0.8, 0, 1) : 0);
    // oggetti
    for (let i = g.objs.length - 1; i >= 0; i--) {
      const o = g.objs[i], z = -(o.w - g.T) * U;
      if (z > 14) { track.remove(o.root); g.objs.splice(i, 1); continue; }
      o.root.position.set(LANES[o.lane], 0, z);
      if (o.hint) o.hint.visible = z < -7 && !o.done;
      if (o.medal) { o.medal.spin.rotation.y += dt * 3.2; o.root.position.y = 0.95 + Math.sin(g.t * 3 + o.seed) * 0.08; }
    }
    // Martina
    if (g.phase !== 'catch') {
      M.root.position.set(g.x, 0, 0);
      const lean = clamp((LANES[g.lane] - g.x) / 2.4, -1, 1);
      let nm = 'run';
      if (g.jumpT > 0) nm = 'jump'; else if (g.slideT > 0) nm = 'slide';
      if (g.phase === 'door' && g.door && (g.door.state === 'ask' || g.door.state === 'bump')) nm = g.door.state === 'bump' ? 'scared' : 'stand';
      if (g.phase === 'door' && g.door && g.door.state === 'open' && !g.door.ok) nm = 'stand';
      M.yaw = 0;
      pose(M, nm, g.t * (0.5 + g.speed * 0.6), { lean: nm === 'run' ? lean : 0 });
      const jh = g.jumpT > 0 ? 4 * 1.7 * (1 - g.jumpT / CFG.JUMP_TIME) * (g.jumpT / CFG.JUMP_TIME) : 0;
      M.root.position.y = jh;
      if (g.invul > 0 && Math.floor(g.invul * 14) % 2) M.root.visible = false; else M.root.visible = true;
      face(M, g.hits > 0 ? 'worried' : 'smile');
      if (M.shadow) M.shadow.position.y = 0.012 - jh / M.hs;
    }
    // punteggio
    if (g.phase === 'run' || g.phase === 'corridor') { g.score = Math.floor(g.T * 10) + g.cfu * 25; scoreEl.textContent = g.score; progEl.firstChild.style.width = clamp(g.cfu / CFG.CFU_GOAL, 0, 1) * 100 + '%'; }
    // telecamera
    if (g.phase === 'catch') {
      const k = ease((g.c.t - 0.4) / 1.0), side = lerp(0, 3.4, k);
      setCam(new THREE.Vector3(g.x * 0.5 + side, lerp(3.7, 2.0, k), lerp(6.6, 4.3, k)), new THREE.Vector3(g.x * 0.5, 1.3, lerp(-8, 0.6, k)), 5, dt);
    } else if (g.phase === 'door' && g.door && g.door.state !== 'run' && !g.door.ok) {
      setCam(new THREE.Vector3(0, 3.1, 8.4), new THREE.Vector3(0, 1.9, -7), 3, dt);
    } else {
      const spd = clamp(g.speed / CFG.MAX_SPEED, 0, 1), jh = g.jumpT > 0 ? 4 * 1.7 * (1 - g.jumpT / CFG.JUMP_TIME) * (g.jumpT / CFG.JUMP_TIME) : 0;
      setCam(new THREE.Vector3(g.x * 0.6, 3.7 + jh * 0.35, 6.6 - spd * 0.3), new THREE.Vector3(g.x * 0.35, 1.4 + jh * 0.2, -9), 7, dt);
    }
    camera.fov += ((g.phase === 'run' || g.phase === 'corridor' ? 60 + g.speed * 4 : 62) - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();
  };
  return S;
};

// ---------------------------------------------------------------- FINALE: la cerimonia di laurea nell'Aula Magna
SCENES.finale = (opt) => {
  const S = {}; let M, N, profs = [], hall, hats = [], t = 0, fwT = 0, capEl, finEl, stage2 = 0, revealed = false, shown = false;
  const caps = CFG.FINALE.proclaim || [['AULA MAGNA', 'SEDUTA DI LAUREA'], ['LA COMMISSIONE', 'PROCLAMA...']];
  const doctor = CFG.FINALE.doctor || ['DOTTORESSA', CFG.NAME, 'IN INFERMIERISTICA!'];
  const T_CAP = 2.2, T_DRUM = caps.length * T_CAP, T_REVEAL = T_DRUM + 2.0;
  const showCap = (lines, cls = '') => {
    if (capEl) capEl.remove();
    capEl = $(`<div class="proc ${cls}">${lines.map((l, i) => `<div class="l${i}">${esc(l)}</div>`).join('')}</div>`); ui.appendChild(capEl);
  };
  function hatMesh() {
    const g = new THREE.Group(), blk = lam(0x15151b);
    g.add(box(0.5, 0.035, 0.5, blk, 0, 0.12, 0)); g.add(cyl(0.17, 0.2, 0.14, blk, 0, 0.04, 0, 16)); g.add(sph(0.025, lam(0xf6c344), 0.24, 0.1, 0.24));
    g.add(box(0.012, 0.012, 0.25, lam(0xf6c344), 0.24, 0.0, 0.24)); return g;
  }
  S.enter = () => {
    clearActors(); world.root.visible = false;
    scene.background.set(0x2a0a14); scene.fog.color.set(0x2a0a14); scene.fog.near = 20; scene.fog.far = 64;
    hall = actor(new THREE.Group());
    const wood = lam(0xb98f52), red = lam(0x8c1a2f), gold = lam(0xf6c344);
    hall.add(box(26, 0.2, 34, wood, 0, -0.1, -2));
    hall.add(box(2.6, 0.22, 26, lam(0xa8203a), 0, 0.01, 2));
    hall.add(box(11, 0.5, 7, lam(0x6b4a2e), 0, 0.25, -6.2)); hall.add(box(11.4, 0.1, 7.4, gold, 0, 0.52, -6.2));
    hall.add(box(26, 11, 0.5, lam(0x5a0f1f), 0, 5.5, -11));
    for (let i = -6; i <= 6; i++) hall.add(box(1.0, 9.5, 0.5, i % 2 ? red : lam(0x741528), i * 1.9, 5.2, -10.6));
    hall.add(box(26, 0.7, 0.6, gold, 0, 9.9, -10.4));
    for (const s of [-1, 1]) hall.add(box(0.5, 11, 34, lam(0x3a0a16), s * 12.5, 5.5, -2));
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.5), new THREE.MeshBasicMaterial({ map: labelTex(CFG.FINALE.hallBanner, '#7d1527', '#fff3b0', 1024, 240) })); ban.position.set(0, 7.3, -10.3); hall.add(ban);
    for (let k = 0; k < 5; k++) { const lamp = sph(0.28, new THREE.MeshBasicMaterial({ color: 0xfff1b8 }), -8 + k * 4, 8.6, -4); hall.add(lamp); }
    // tavolo della commissione (dietro Martina) con tovaglia e targhette
    hall.add(box(7.4, 0.95, 1.3, lam(0x5a0f1f), 0, 1.0, -8.3)); hall.add(box(7.6, 0.07, 1.5, lam(0x3a2a1a), 0, 1.5, -8.3)); hall.add(box(7.2, 0.5, 0.04, lam(0xf6c344), 0, 0.95, -7.63));
    [-2.4, 0, 2.4].forEach((x, i) => { const P = buildProf(i); P.root.position.set(x, 0.52, -8.95); P.root.rotation.y = Math.PI; P.baseY = 0.52; actor(P.root); profs.push(P); });
    // pubblico ai lati
    for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) {
      const x = s * (6.4 + r * 1.6), z = -9 + k * 1.8, col = pick([0xe0344b, 0x3e7bd6, 0x3bb273, 0xf6c344, 0x8e5bd1, 0xf28c28]);
      hall.add(rbox(0.9, 0.5, 0.8, 0.1, lam(0x4a2f1a), x, 0.35, z)); hall.add(rbox(0.6, 0.7, 0.4, 0.15, lam(col), x, 0.95, z)); hall.add(sph(0.22, lam(pick([0xf2c9a5, 0xd9a982, 0x8d5a3b])), x, 1.5, z)); hall.add(sph(0.23, lam(pick([0x2a1810, 0x5a3a26, 0xc9a36a, 0x999999])), x, 1.57, z + (s > 0 ? 0.03 : -0.03), 1, 0.7, 1));
    }
    M = buildMartina(opt.outfit || 'casual'); M.root.position.set(0, 0.52, -5.2); M.yaw = Math.PI; actor(M.root);
    const wreath = new THREE.Group(); wreath.position.set(0, 0.2, 0.0); M.head.add(wreath);
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, l = sph(0.05, lam(i % 2 ? 0x3d9a4c : 0x2f7d3b), Math.cos(a) * 0.205, 0, Math.sin(a) * 0.205, 1.5, 0.5, 0.8); l.rotation.y = -a; wreath.add(l); }
    wreath.add(sph(0.045, lam(0x7a1f35), 0, -0.01, -0.21, 1.6, 1, 1));
    N = buildNurse(); N.syringe.visible = false; N.root.position.set(2.0, 0.52, -4.6); N.root.rotation.y = Math.PI + 0.35; actor(N.root);
    const bouquet = new THREE.Group(); for (let i = 0; i < 7; i++) bouquet.add(sph(0.06, lam(pick([0xe0344b, 0xf08fb0, 0xffd23f, 0xffffff])), Math.cos(i) * 0.09, 0.02 + (i % 3) * 0.04, Math.sin(i) * 0.09)); bouquet.position.set(0.0, 0.3, -0.06); N.arms[0].el.add(bouquet); S.bouquet = bouquet;
    best_save();
    camPos.set(0, 2.6, 1.8); camLook.set(0, 1.7, -6);
    Sfx.start(); showCap(caps[0]);
    ui.appendChild($('<div class="hint-skip">TOCCA PER SALTARE</div>'));
  };
  function best_save() { const b = Save.get().best || 0; if (opt.score > b) Save.set({ best: opt.score }); }
  S.input = (a) => { if ((a === 'tap' || a === 'confirm') && t < T_REVEAL + 0.6 && !revealed) { t = T_REVEAL - 0.01; } };
  S.leave = () => { world.root.visible = true; scene.fog.near = 24; scene.fog.far = 72; };
  function reveal() {
    revealed = true; { const h = ui.querySelector('.hint-skip'); if (h) h.remove(); } Sfx.fanfare(); flash('#fff7d6', 0.7); shakeAmt = 0.3;
    if (capEl) capEl.remove();
    capEl = $(`<div class="proc big"><div class="l0">${esc(doctor[0])}</div><div class="l1">${esc(doctor[1])}</div><div class="l2">${esc(doctor[2])}</div></div>`); ui.appendChild(capEl);
    for (let i = 0; i < 16; i++) { const h = hatMesh(); h.position.set(rnd(-2.5, 2.5), 1.4, -5.2 + rnd(-0.8, 0.8)); h.userData.v = new THREE.Vector3(rnd(-2.5, 2.5), rnd(7, 11), rnd(-1.5, 3)); h.userData.w = new THREE.Vector3(rnd(-6, 6), rnd(-8, 8), rnd(-6, 6)); hall.add(h); hats.push(h); }
    for (const x of [-4.5, 4.5]) for (let i = 0; i < 90; i++) fx.emit(x, 0.8, -4.5, -Math.sign(x) * rnd(1, 4.5), rnd(6, 11), rnd(-1.5, 1.5), pick([0xe0344b, 0xf6c344, 0x3bb273, 0x3e7bd6, 0xffffff, 0xf08fb0]), 3.5, 5, 0.3);
  }
  S.update = (dt) => {
    t += dt; fwT -= dt;
    const yawFace = Math.PI;
    M.yaw = yawFace;
    if (!revealed) {
      pose(M, 'stand', t); face(M, 'smile');
      profs.forEach((P, i) => profPose(P, 'idle', t, i));
      nursePose(N, 'stand', t); N.arms.forEach((a, i) => { a.sh.rotation.z = (i ? 1 : -1) * -0.3; });
      const ci = Math.min(caps.length - 1, Math.floor(t / T_CAP));
      if (ci !== stage2 && t < T_DRUM) { stage2 = ci; showCap(caps[ci]); Sfx.select(); }
      if (t >= T_DRUM && !S.drum) { S.drum = true; Sfx.drumroll(); showCap(['...'], 'dots'); }
      if (t >= T_REVEAL) reveal();
    } else {
      const r = t - T_REVEAL;
      pose(M, 'cheer', t); face(M, 'shout'); if (r > 1.2) face(M, 'smile');
      profs.forEach((P, i) => profPose(P, 'clap', t, i));
      nursePose(N, 'stand', t); N.arms.forEach((a, i) => { a.sh.rotation.z = (i ? 1 : -1) * (-0.9 + Math.sin(t * 9 + i) * 0.4); });
      for (const h of hats) { const u = h.userData; u.v.y -= 9 * dt; h.position.addScaledVector(u.v, dt); h.rotation.x += u.w.x * dt; h.rotation.y += u.w.y * dt; h.rotation.z += u.w.z * dt; if (h.position.y < 0.6 && u.v.y < 0) { u.v.set(0, 0, 0); u.w.set(0, 0, 0); h.position.y = 0.6; } }
      if (fwT <= 0) { fwT = rnd(0.3, 0.7); const col = pick([[0xffe27a, 0xffffff], [0xff6b8a, 0xffd1dc], [0x7fd3ff, 0xffffff], [0x9bff9b, 0xffffff]]); fx.burst(rnd(-6, 6), rnd(6, 8.6), -9, col, 50, 5.5, 1.6, 2.5); Sfx.sparkle(); }
      for (let i = 0; i < 3; i++) fx.emit(rnd(-9, 9), 9.5, rnd(-10, 1), rnd(-0.4, 0.4), rnd(-1, 0), rnd(-0.4, 0.4), pick([0xe0344b, 0xf6c344, 0x3bb273, 0x3e7bd6, 0xffffff, 0xf08fb0]), 7, 1.6, 0.3);
      if (r > 4.2 && !shown) {                                         // dopo la proclamazione: titolo, punti e pulsanti
        shown = true;
        finEl = $(`<div id="fin"><div class="t">${[...CFG.FINALE.title].map((c, i) => `<span style="animation-delay:${i * 0.07}s">${esc(c)}</span>`).join('')}</div>${CFG.FINALE.subtitle ? `<div class="s">${esc(CFG.FINALE.subtitle)}</div>` : ''}<div class="sc">PUNTI ${opt.score}  ·  CFU ${opt.cfu}/${CFG.CFU_GOAL}</div><div class="b"><button class="btn" id="again">GIOCA ANCORA</button><button class="btn blue" id="home">MENU</button></div></div>`);
        finEl.querySelector('#again').onclick = () => { Sfx.select(); app.go('game', { outfit: opt.outfit }); };
        finEl.querySelector('#home').onclick = () => { Sfx.select(); app.go('menu'); };
        if (capEl) { capEl.remove(); capEl = null; }
        ui.appendChild(finEl);
        const say = $(`<div id="dlg"><div class="say" style="left:76%;top:55%;transform:translate(-50%,-100%)">${esc(CFG.FINALE.chaserLine)}</div></div>`); ui.appendChild(say);
      }
    }
    // camera: panoramica d'apertura, tamburi, poi stacco in primo piano su Martina
    let cp, cl;
    if (!revealed) {
      const k = clamp(t / T_REVEAL, 0, 1);
      cp = new THREE.Vector3(Math.sin(t * 0.25) * 0.8, lerp(2.6, 1.9, ease(k)), lerp(-0.4, -2.6, ease(k)));
      cl = new THREE.Vector3(0, lerp(1.7, 1.45, k), -5.4);
    } else {
      const r = t - T_REVEAL, k = ease(r / 2.2);
      cp = new THREE.Vector3(Math.sin(r * 0.5) * 0.9, lerp(1.9, 1.7, k), lerp(-2.6, -3.1, k));
      cl = new THREE.Vector3(0, lerp(1.45, 1.5, k), -5.2);
    }
    setCam(cp, cl, 3, dt);
  };
  return S;
};

// ---------------------------------------------------------------- ciclo principale
Input.init(canvas);
Input.on((a, d) => { if (app.scene && app.scene.input) app.scene.input(a, d); });
let last = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.1) dt = 0.1; if (dt <= 0) return;
  if (app.scene) app.scene.update(dt);
  fx.update(dt);
  // scossone e lampo
  const sh = shakeAmt * 0.12; shakeAmt = Math.max(0, shakeAmt - dt * 1.6);
  camera.position.set(camPos.x + (Math.random() - 0.5) * sh, camPos.y + (Math.random() - 0.5) * sh, camPos.z);
  camera.lookAt(camLook);
  if (flashT > 0) { flashT -= dt; flashEl.style.opacity = Math.max(0, flashT / flashDur); }
  renderer.render(scene, camera);
  // qualita' adattiva: se il telefono e' lento abbassiamo la risoluzione
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 2.5) { const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 38 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.5); resize(); } }
}
window.__nurse3d = { app, scene, camera, renderer, world, fx, SCENES, get game() { return app.scene && app.scene.g; }, S: () => app.scene };
app.go('menu');
requestAnimationFrame(frame);
