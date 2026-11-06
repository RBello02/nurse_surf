// L'infermiera inseguitrice in 3D: divisa bianca, cuffietta con croce rossa e siringa "PFIZER" gigante sopra la testa.
import { THREE, lam, std, mesh, box, rbox, cyl, sph, canvasTex, blobShadow } from './util.js';
import { capsule, torsoGeo, headGeo, limb, hairCapGeo } from './martina.js';
import { faceTexture } from './face.js';
import { rot, pos, getDT } from './anim.js';

let syrTex = null;
function syringeTex() {                                           // etichetta "PFIZER" verticale sul fronte (u=0.5), tacche di graduazione e liquido azzurro
  if (!syrTex) syrTex = canvasTex(256, 256, (c) => {
    c.fillStyle = '#eef8ff'; c.fillRect(0, 0, 256, 256);
    c.fillStyle = '#7fd3ff'; c.fillRect(0, 96, 256, 160);
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(0, 96, 256, 8);
    c.fillStyle = '#10151f'; for (let y = 14; y < 256; y += 16) c.fillRect(100, y, y % 32 === 14 ? 34 : 20, 2.5);
    c.save(); c.translate(160, 140); c.rotate(-Math.PI / 2); c.font = '900 40px Arial Black, Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#10151f'; c.fillText('PFIZER', 0, 0); c.restore();
  });
  return syrTex;
}

function personFace(head, m, opt = {}) {
  const sk = opt.skin || m.skin;
  for (const s of [-1, 1]) {
    head.add(sph(0.034, lam(0xffffff), s * 0.07, 0.02, -0.168, 1.05, 1.0, 0.45));
    head.add(sph(0.022, lam(opt.eye || 0x3b2a1c), s * 0.07, 0.019, -0.182, 1, 1.05, 0.4));
    head.add(sph(0.011, lam(0x120a05), s * 0.07, 0.019, -0.19, 1, 1.05, 0.4)); head.add(sph(0.005, lam(0xffffff), s * 0.063, 0.029, -0.195));
    const lid = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 6, 14, Math.PI * 0.85), m.dark); lid.position.set(s * 0.07, 0.022, -0.176); lid.rotation.z = Math.PI * 0.075; lid.scale.set(1.05, 0.7, 0.6); head.add(lid);
    const br = mesh(new THREE.CapsuleGeometry(0.008, 0.05, 4, 8), opt.brow || m.dark, s * 0.072, 0.075, -0.172); br.rotation.z = Math.PI / 2 + s * -0.08; head.add(br);
    head.add(sph(0.03, m.pink, s * 0.095, -0.05, -0.15, 1.2, 0.7, 0.4));
    head.add(sph(0.03, sk, s * 0.176, -0.015, 0, 0.5, 1.1, 0.8));
  }
  head.add(sph(0.016, lam(0xe6ba96), 0, -0.027, -0.193, 1, 1.4, 0.9));
  head.add(sph(0.026, lam(0xc9777a), 0, -0.088, -0.178, 1.5, 0.42, 0.55));
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 6, 14, Math.PI), lam(0x9a4a4c)); sm.rotation.z = Math.PI; sm.position.set(0, -0.072, -0.178); head.add(sm);
}


// siringa gigante tenuta come un'arma: l'asse e' lungo y, ago verso il basso (-y); l'impugnatura e' attorno a y = -0.1
function buildSyringe(m) {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.52, 22), new THREE.MeshLambertMaterial({ map: syringeTex() })); barrel.position.y = -0.16; g.add(barrel);
  g.add(cyl(0.062, 0.062, 0.02, m.metal, 0, 0.11, 0, 22));                                       // fondo del cilindro
  g.add(box(0.21, 0.014, 0.075, m.metal, 0, 0.1, 0));                                            // alette per le dita
  g.add(cyl(0.011, 0.011, 0.3, m.metal, 0, 0.26, 0, 10)); g.add(cyl(0.05, 0.05, 0.012, m.metal, 0, 0.41, 0, 18)); // stantuffo
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 18), m.metal); ring.position.y = 0.45; ring.rotation.y = Math.PI / 2; g.add(ring);
  g.add(cyl(0.062, 0.026, 0.07, m.metal, 0, -0.455, 0, 18));                                      // attacco dell'ago
  g.add(cyl(0.004, 0.017, 0.42, m.metal, 0, -0.7, 0, 10));                                       // ago
  g.add(sph(0.014, lam(0x7fd3ff), 0, -0.92, 0, 0.8, 1.5, 0.8));                                  // goccia
  return g;
}
function buildHand(m, side, grip) {
  const hand = new THREE.Group();
  if (grip) {                                                                                  // pugno chiuso attorno al cilindro
    hand.add(rbox(0.078, 0.1, 0.05, 0.018, m.skin, 0, 0, 0.055));
    const fingers = new THREE.Group(); fingers.rotation.y = Math.PI; hand.add(fingers);
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.071, 0.0115 - i * 0.0006, 8, 14, Math.PI * 0.95), m.skin); t.rotation.x = Math.PI / 2; t.position.y = 0.036 - i * 0.024; t.rotation.z = -0.2; fingers.add(t); }
    const th = capsule(0.0125, 0.05, m.skin, side * -0.052, 0.045, -0.045); th.rotation.set(0.5, 0, side * 0.3); hand.add(th);
  } else {
    hand.add(rbox(0.07, 0.075, 0.032, 0.014, m.skin, 0, -0.01, 0));
    for (let i = 0; i < 4; i++) { const f = capsule(0.0095, 0.04 - Math.abs(i - 1.4) * 0.004, m.skin, (i - 1.5) * 0.0165, -0.075, 0); f.rotation.x = 0.25; hand.add(f); }
    const th = capsule(0.011, 0.04, m.skin, side * 0.04, -0.03, -0.004); th.rotation.z = side * -0.7; hand.add(th);
  }
  return hand;
}

export function buildNurse() {
  const m = { white: lam(0xffffff), shade: lam(0xdfe7ec), skin: lam(0xf2c9a5), hair: lam(0x5a3a28), red: lam(0xe0344b), dark: lam(0x2a1810), metal: std(0xc4ccd3, 0.25, 0.8), shoe: lam(0xf4f8fa), pink: lam(0xf18c82), blue: lam(0x7fb7d9), sole: lam(0x9aa5af), stock: lam(0xf7f7fa) };
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const P = { root, body, init: false, ph: 0 };
  // gambe con calze bianche, ginocchio e scarpe infermieristiche
  const legs = [], knees = [], feet = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.62, 0);
    hip.add(limb([[0.07, 0], [0.068, -0.12], [0.056, -0.3]], m.stock));
    const knee = new THREE.Group(); knee.position.y = -0.3; hip.add(knee);
    knee.add(limb([[0.056, 0], [0.056, -0.04], [0.05, -0.12], [0.036, -0.24], [0.03, -0.3]], m.stock));
    const foot = new THREE.Group(); foot.position.set(0, -0.3, -0.02); knee.add(foot);
    foot.add(rbox(0.11, 0.07, 0.25, 0.035, m.shoe, 0, -0.01, -0.03)); foot.add(sph(0.055, m.shoe, 0, -0.005, -0.13, 1, 0.75, 1)); foot.add(box(0.115, 0.018, 0.27, m.sole, 0, -0.045, -0.03));
    body.add(hip); legs.push(hip); knees.push(knee); feet.push(foot);
  }
  P.legs = legs; P.knees = knees; P.feet = feet;
  // divisa: gonna a campana tornita, busto, colletto blu, cintura con fiocco, tasca
  const skirt = new THREE.Mesh(new THREE.LatheGeometry([[0.14, 0], [0.2, -0.04], [0.3, -0.2], [0.38, -0.36], [0.4, -0.4]].reverse().map(([r, y]) => new THREE.Vector2(r, y + 0.4)), 30), m.white); skirt.position.y = 0.62 + 0.03; body.add(skirt);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.012, 6, 32), m.blue); hem.rotation.x = Math.PI / 2; hem.position.y = 0.66 + 0.0; body.add(hem);
  const torso = new THREE.Group(); torso.position.y = 1.02; body.add(torso); P.torso = torso;
  const tg = torsoGeo(1.2, 0.72, [[0.001, 0], [0.12, 0], [0.145, 0.06], [0.16, 0.18], [0.175, 0.3], [0.17, 0.4], [0.15, 0.46], [0.08, 0.5], [0.001, 0.51]]);
  torso.add(mesh(tg, m.white, 0, 0.0, 0));
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.155, 0.05, 26), m.red); belt.scale.set(1.2, 1, 0.72); belt.position.y = 0.02; torso.add(belt);
  const bowL = sph(0.045, m.red, -0.07, 0.02, 0.12, 1.4, 0.8, 0.6); bowL.rotation.z = 0.4; torso.add(bowL); const bowR = bowL.clone(); bowR.position.x = 0.07; bowR.rotation.z = -0.4; torso.add(bowR);
  const col = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 22), m.blue); col.rotation.x = Math.PI / 2 - 0.2; col.position.set(0, 0.5, 0); torso.add(col);
  torso.add(box(0.09, 0.08, 0.01, m.shade, 0.1, 0.3, -0.125)); torso.add(box(0.014, 0.05, 0.012, m.red, 0.1, 0.3, -0.13)); torso.add(box(0.05, 0.014, 0.012, m.red, 0.1, 0.3, -0.13));
  torso.add(capsule(0.042, 0.08, m.skin, 0, 0.55, 0));
  // braccia che pendono (-y) con gomito e mano; la destra impugna la siringa
  P.arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.265, 0.47, 0); torso.add(sh);
    sh.add(sph(0.058, m.white, 0, 0, 0));
    sh.add(limb([[0.043, 0], [0.044, -0.05], [0.038, -0.14], [0.033, -0.27]], m.skin));
    sh.add(limb([[0.062, 0], [0.066, -0.06], [0.056, -0.15]], m.white));                       // manica corta
    const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
    el.add(sph(0.037, m.skin, 0, 0, 0)); el.add(limb([[0.035, 0], [0.034, -0.03], [0.029, -0.13], [0.021, -0.27]], m.skin));
    const grip = s === 1, hand = buildHand(m, s, grip); hand.position.y = -0.29; el.add(hand);
    P.arms.push({ sh, el, hand });
  }
  P.handR = P.arms[1].hand;
  const syr = buildSyringe(m); syr.position.set(0, 0.1, 0); P.handR.add(syr); P.syringe = syr;
  // testa con volto dipinto: chignon con retina, cuffietta con croce, ciocche ai lati
  const head = new THREE.Group(); head.position.y = 0.6; head.scale.setScalar(1.25); torso.add(head); P.head = head;
  head.add(mesh(headGeo(), new THREE.MeshLambertMaterial({ map: faceTexture('smile', false, 'nurse') })));
  for (const s of [-1, 1]) head.add(sph(0.03, m.skin, s * 0.176, -0.015, 0, 0.5, 1.1, 0.8));
  // capelli castani raccolti: calotta con attaccatura e riga laterale, chignon basso con retina, ciocche ai lati, cuffietta inclinata con croce
  const hairM = std(0x6b4630, 0.55, 0);
  const hcap = new THREE.Mesh(hairCapGeo(Math.PI * 0.56), hairM); hcap.scale.set(1.02, 1.13, 1.04); hcap.position.set(0, -0.065, 0.02); head.add(hcap);
  const bun = sph(0.105, hairM, 0, 0.02, 0.2, 1.05, 0.95, 0.9); head.add(bun);
  const nape = mesh(new THREE.SphereGeometry(0.19, 22, 14, 0, Math.PI, 0, Math.PI * 0.5), hairM, 0, 0.0, 0.06); nape.scale.set(0.98, 0.85, 0.9); nape.rotation.x = -0.5; head.add(nape);
  const net = new THREE.Mesh(new THREE.SphereGeometry(0.112, 16, 10), new THREE.MeshBasicMaterial({ color: 0x2a1810, wireframe: true, transparent: true, opacity: 0.35 })); net.position.copy(bun.position); net.scale.copy(bun.scale); head.add(net);
  for (const s of [-1, 1]) { const st = mesh(new THREE.CapsuleGeometry(0.01, 0.15, 4, 8), hairM, s * 0.172, -0.04, -0.06); st.scale.set(0.8, 1, 0.6); head.add(st); }
  const capG = new THREE.Group(); capG.position.set(0, 0.2, 0.05); capG.rotation.x = -0.22; head.add(capG);
  capG.add(cyl(0.15, 0.175, 0.075, m.white, 0, 0, 0, 28));
  capG.add(box(0.03, 0.06, 0.01, m.red, 0, 0.0, -0.172)); capG.add(box(0.06, 0.03, 0.01, m.red, 0, 0.0, -0.172));
  P.shadow = blobShadow(1.3, 0.35); root.add(P.shadow);
  // corporatura robusta (come l'infermiera cattiva del 2D): busto, gonna, braccia e gambe piu' larghi, testa grande
  skirt.scale.set(1.3, 1, 1.3); hem.scale.set(1.3, 1.3, 1);
  torso.children[0].scale.set(1.35, 1, 1.3); belt.scale.set(1.62, 1, 0.95);
  for (const a of P.arms) { a.sh.position.x *= 1.32; a.sh.scale.set(1.3, 1, 1.3); }
  for (const l of P.legs) { l.position.x *= 1.35; l.scale.set(1.3, 1, 1.3); }
  head.scale.setScalar(1.35); head.position.y = 0.62;
  root.scale.setScalar(1.0);
  return P;
}

// pose dell'infermiera: 'run', 'stand', 'attack' (o.k: 0 = braccio carico indietro, 1 = affondo), 'scared', 'clap'
export function nursePose(P, name, t, o = {}) {
  const sn = !P.init; P.init = true;
  const R = (ob, x, y = 0, z = 0, rate = 18) => rot(ob, x, y, z, rate, sn);
  const dt = getDT();
  if (name === 'run') P.ph += dt * (o.rate || 11);
  const ph = P.ph, s = Math.sin(ph), c = Math.cos(ph);
  const [aL, aR] = P.arms, [hL, hR] = P.legs, [kL, kR] = P.knees;
  let by = 0, tx = 0, ty = 0, tz = 0, hx = 0, hy = 0;
  const fl = (v) => 0.15 + 1.1 * Math.pow(Math.max(0, v), 1.1);
  if (name === 'run') {
    R(hL, s * 0.85, 0, 0, 26); R(hR, -s * 0.85, 0, 0, 26); R(kL, -fl(c), 0, 0, 26); R(kR, -fl(-c), 0, 0, 26);
    R(P.feet[0], 0.1 - 0.2 * Math.max(0, -s), 0, 0, 20); R(P.feet[1], 0.1 - 0.2 * Math.max(0, s), 0, 0, 20);
    R(aL.sh, -s * 0.7 + 0.1, 0, 0.12, 22); R(aL.el, 1.1 + Math.max(0, s) * 0.3, 0, 0, 22);
    R(aR.sh, 0.95 + s * 0.06, 0, -0.1, 22); R(aR.el, 0.95 + c * 0.08, 0, 0, 22);               // siringa tenuta in avanti, quasi ferma
    by = Math.abs(Math.sin(ph)) * 0.06; tx = -0.12; ty = s * 0.12; hx = 0.1;
  } else if (name === 'attack') {
    const k = o.k || 0, e = k * k * (3 - 2 * k);
    R(hL, 0.55 - e * 0.1, 0, 0.05, 16); R(hR, -0.35 + e * 0.1, 0, -0.05, 16); R(kL, -0.55 + e * 0.35, 0, 0, 16); R(kR, -0.35, 0, 0, 16);
    R(P.feet[0], 0, 0, 0, 16); R(P.feet[1], 0, 0, 0, 16);
    R(aR.sh, -0.25 + e * 1.5, 0, -0.1, 30); R(aR.el, 1.5 - e * 1.2, 0, 0, 30);                  // dal braccio carico indietro all'affondo
    R(aL.sh, 0.9, 0, 0.25, 14); R(aL.el, 0.9, 0, 0, 14);
    tx = e * 0.3; ty = -0.4 + e * 0.65; by = -0.05; hx = 0.05;
  } else if (name === 'scared') {
    const sh = Math.sin(t * 38) * 0.06;
    R(hL, 0.15, 0, 0.1, 14); R(hR, -0.2, 0, -0.1, 14); R(kL, -0.2, 0, 0, 14); R(kR, -0.1, 0, 0, 14); R(P.feet[0], 0); R(P.feet[1], 0);
    R(aR.sh, 1.35 + sh, 0, -0.35, 16); R(aR.el, 1.3, 0, 0, 16); R(aL.sh, 1.4 - sh, 0, 0.35, 16); R(aL.el, 1.7, 0, 0, 16);
    tx = -0.1; hx = -0.15; hy = sh * 2;
  } else if (name === 'clap') {
    const w = Math.abs(Math.sin(t * 9));
    R(hL, 0); R(hR, 0); R(kL, 0); R(kR, 0); R(P.feet[0], 0); R(P.feet[1], 0);
    R(aR.sh, 1.0, 0, -0.45 + w * 0.35, 26); R(aR.el, 1.5, 0, 0, 26); R(aL.sh, 1.0, 0, 0.45 - w * 0.35, 26); R(aL.el, 1.5, 0, 0, 26);
    by = w * 0.02; hy = Math.sin(t * 2) * 0.1;
  } else {                                                    // stand: siringa in mano, appoggiata in avanti
    const br = Math.sin(t * 2.2) * 0.015;
    R(hL, 0, 0, 0.03, 8); R(hR, 0, 0, -0.03, 8); R(kL, 0, 0, 0, 8); R(kR, 0, 0, 0, 8); R(P.feet[0], 0); R(P.feet[1], 0);
    R(aR.sh, 0.6 + br, 0, -0.1, 8); R(aR.el, 1.0 - br, 0, 0, 8); R(aL.sh, 0.12, 0, 0.35, 8); R(aL.el, 0.55, 0, 0, 8);
    by = br; hy = Math.sin(t * 0.8) * 0.06;
  }
  rot(P.torso, tx, ty, tz, 14, sn); rot(P.head, hx, hy, 0, 12, sn); pos(P.body, 0, by, 0, 22, sn);
}

// ---- professori della commissione di laurea: toga nera con stola bordeaux, occhiali, capelli diversi ----
export function buildProf(variant = 0) {
  const skinC = [0xe8b896, 0xd9a982, 0xf0c8a6][variant % 3];
  const m = { gown: lam(0x1c1c23), gownHi: lam(0x2c2c36), skin: lam(skinC), dark: lam(0x2a1810), pink: lam(0xe39a8f), stole: lam(0x7a1f35), gold: std(0xf6c344, 0.3, 0.6), white: lam(0xffffff), hair: lam([0xb9b9bf, 0x8a8a90, 0xf2f2f2][variant % 3]), glass: std(0x20242c, 0.3, 0.6) };
  const root = new THREE.Group(), P = { root };
  const torso = new THREE.Group(); P.torso = torso; root.add(torso);
  const gown = new THREE.Mesh(new THREE.LatheGeometry([[0.3, 0], [0.28, 0.4], [0.24, 0.8], [0.22, 1.1], [0.23, 1.28], [0.2, 1.42], [0.1, 1.5], [0.001, 1.52]].map(([r, y]) => new THREE.Vector2(r, y)), 28), m.gown); gown.scale.set(1.2, 1, 0.78); root.add(gown);
  for (const s of [-1, 1]) { const st = box(0.09, 1.0, 0.02, m.stole, s * 0.1, 0.95, -0.2); st.rotation.z = s * 0.05; root.add(st); root.add(box(0.12, 0.03, 0.02, m.gold, s * 0.1, 0.45, -0.205)); }
  root.add(box(0.5, 0.05, 0.3, m.gownHi, 0, 1.43, -0.01));
  P.arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.3, 1.38, 0); root.add(sh); sh.add(sph(0.07, m.gown, 0, 0, 0));
    sh.add(cyl(0.085, 0.07, 0.32, m.gown, 0, -0.16, 0, 16));
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el); el.add(cyl(0.075, 0.095, 0.3, m.gown, 0, -0.14, 0, 16));
    const hand = new THREE.Group(); hand.position.y = -0.31; el.add(hand); hand.add(rbox(0.08, 0.08, 0.04, 0.015, m.skin, 0, 0, 0));
    sh.rotation.z = s * 0.1; P.arms.push({ sh, el });
  }
  const head = new THREE.Group(); head.position.y = 1.72; root.add(head); P.head = head;
  head.add(mesh(headGeo(), m.skin)); head.add(capsule(0.05, 0.1, m.skin, 0, -0.2, 0.01));
  personFace(head, m, { brow: m.hair });
  if (variant === 0) { const hc = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), m.hair); hc.scale.set(0.97, 1.0, 1.0); hc.position.set(0, 0.03, 0.01); head.add(hc); head.add(sph(0.12, m.hair, 0, -0.1, -0.1, 1.0, 0.7, 0.6)); }
  else if (variant === 1) { for (const s of [-1, 1]) head.add(sph(0.06, m.hair, s * 0.17, 0.0, 0.03, 0.7, 1.4, 1)); head.add(sph(0.15, m.hair, 0, 0.1, 0.1, 1, 0.5, 0.9)); }
  else { const bob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 18, 0, Math.PI, 0, Math.PI * 0.8), m.hair); bob.scale.set(1.02, 1.0, 1.02); bob.position.set(0, -0.06, 0.02); head.add(bob); const fr = new THREE.Mesh(new THREE.SphereGeometry(0.21, 28, 12, 0, Math.PI, 0, Math.PI * 0.34), m.hair); fr.scale.set(0.98, 1.1, 1.0); fr.position.set(0, -0.06, 0.005); fr.rotation.order = 'YXZ'; fr.rotation.set(0.3, Math.PI, 0); head.add(fr); for (const s of [-1, 1]) head.add(mesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 8), m.hair, s * 0.185, -0.08, -0.03)); }
  if (variant !== 2) for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 18), m.glass); g.position.set(s * 0.07, 0.02, -0.19); head.add(g); }
  if (variant !== 2) head.add(box(0.04, 0.006, 0.006, m.glass, 0, 0.025, -0.19));
  P.shadow = blobShadow(1.0, 0.3); root.add(P.shadow); P.baseY = 0;
  return P;
}
export function profPose(P, mode, t, k = 0) {            // 'idle' (ascolta), 'clap' (applaude)
  const clap = mode === 'clap', s = Math.sin(t * 14 + k);
  P.arms.forEach((a, i) => {
    const d = i ? 1 : -1;
    if (clap) { a.sh.rotation.set(-0.9, d * -0.3, d * 0.1); a.el.rotation.set(-1.3, 0, d * (0.55 + s * 0.2)); }
    else { a.sh.rotation.set(-0.4, d * -0.25, d * 0.1); a.el.rotation.set(-1.5, 0, d * 0.9); }
  });
  P.head.rotation.set(Math.sin(t * 1.3 + k) * 0.05, Math.sin(t * 0.9 + k) * 0.1, 0);
  P.root.position.y = P.baseY + (clap ? Math.abs(s) * 0.02 : 0);
}
