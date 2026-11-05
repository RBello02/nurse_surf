// L'infermiera inseguitrice in 3D: divisa bianca, cuffietta con croce rossa e siringa "PFIZER" gigante sopra la testa.
import { THREE, lam, std, mesh, box, rbox, cyl, sph, canvasTex, blobShadow } from './util.js';
import { capsule, torsoGeo, headGeo } from './martina.js';

let syrTex = null;
function syringeTex() {
  if (!syrTex) syrTex = canvasTex(256, 64, (c) => {
    c.fillStyle = '#eaf7ff'; c.fillRect(0, 0, 256, 64);
    c.fillStyle = '#7fd3ff'; c.fillRect(0, 22, 200, 42);
    c.fillStyle = '#10151f'; c.font = '900 34px Arial Black, Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PFIZER', 118, 38);
    c.fillStyle = '#10151f'; for (let x = 8; x < 250; x += 14) c.fillRect(x, 0, 2, x % 28 ? 7 : 12);
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

export function buildNurse() {
  const m = { white: lam(0xffffff), shade: lam(0xdfe7ec), skin: lam(0xf2c9a5), hair: lam(0x5a3a28), red: lam(0xe0344b), dark: lam(0x2a1810), metal: std(0xc4ccd3, 0.25, 0.8), shoe: lam(0xf4f8fa), pink: lam(0xf18c82), blue: lam(0x7fb7d9), sole: lam(0x9aa5af) };
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const P = { root, body };
  // gambe con calze bianche e scarpe infermieristiche
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.62, 0);
    hip.add(capsule(0.052, 0.46, m.white, 0, -0.28, 0));
    const foot = new THREE.Group(); foot.position.set(0, -0.54, -0.03); hip.add(foot);
    foot.add(rbox(0.11, 0.07, 0.25, 0.035, m.shoe, 0, 0, -0.03)); foot.add(sph(0.055, m.shoe, 0, 0.005, -0.13, 1, 0.75, 1)); foot.add(box(0.115, 0.018, 0.27, m.sole, 0, -0.03, -0.03));
    body.add(hip); legs.push(hip);
  }
  P.legs = legs;
  // divisa: gonna a campana tornita, busto, colletto blu, cintura con fiocco, grembiule con tasca
  const skirt = new THREE.Mesh(new THREE.LatheGeometry([[0.14, 0], [0.2, -0.04], [0.3, -0.2], [0.38, -0.36], [0.4, -0.4]].map(([r, y]) => new THREE.Vector2(r, y + 0.4)), 30), m.white); skirt.position.y = 0.62 + 0.03; body.add(skirt);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.012, 6, 32), m.blue); hem.rotation.x = Math.PI / 2; hem.position.y = 0.66 + 0.0; body.add(hem);
  const torso = new THREE.Group(); torso.position.y = 1.02; body.add(torso); P.torso = torso;
  const tg = torsoGeo(1.2, 0.72, [[0.001, 0], [0.12, 0], [0.145, 0.06], [0.16, 0.18], [0.175, 0.3], [0.17, 0.4], [0.15, 0.46], [0.08, 0.5], [0.001, 0.51]]);
  torso.add(mesh(tg, m.white, 0, 0.0, 0));
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.155, 0.05, 26), m.red); belt.scale.set(1.2, 1, 0.72); belt.position.y = 0.02; torso.add(belt);
  const bowL = sph(0.045, m.red, -0.07, 0.02, 0.12, 1.4, 0.8, 0.6); bowL.rotation.z = 0.4; torso.add(bowL); const bowR = bowL.clone(); bowR.position.x = 0.07; bowR.rotation.z = -0.4; torso.add(bowR);   // fiocco dietro
  const col = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 22), m.blue); col.rotation.x = Math.PI / 2 - 0.2; col.position.set(0, 0.5, 0); torso.add(col);
  torso.add(box(0.09, 0.08, 0.01, m.shade, 0.1, 0.3, -0.125)); torso.add(box(0.014, 0.05, 0.012, m.red, 0.1, 0.3, -0.13)); torso.add(box(0.05, 0.014, 0.012, m.red, 0.1, 0.3, -0.13));
  torso.add(capsule(0.042, 0.08, m.skin, 0, 0.55, 0));
  // braccia alzate che reggono la siringa
  P.arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.27, 0.46, 0); torso.add(sh);
    sh.add(sph(0.055, m.white, 0, 0, 0));
    sh.add(capsule(0.04, 0.18, m.skin, 0, 0.14, 0)); sh.add(cyl(0.056, 0.05, 0.16, m.white, 0, 0.08, 0, 16));
    sh.rotation.z = s * -0.25;
    const el = new THREE.Group(); el.position.y = 0.28; sh.add(el);
    el.add(sph(0.038, m.skin, 0, 0, 0)); el.add(capsule(0.033, 0.18, m.skin, 0, 0.13, 0));
    const hand = new THREE.Group(); hand.position.y = 0.28; el.add(hand); hand.add(rbox(0.07, 0.07, 0.035, 0.012, m.skin, 0, 0.01, 0));
    for (let i = 0; i < 4; i++) hand.add(capsule(0.0095, 0.04, m.skin, (i - 1.5) * 0.0165, 0.06, 0));
    el.rotation.z = s * 0.5;
    P.arms.push({ sh, el });
  }
  // testa (stessa forma di Martina): chignon con retina, cuffietta con croce, ciocche ai lati
  const head = new THREE.Group(); head.position.y = 0.56; torso.add(head); P.head = head;
  head.add(mesh(headGeo(), m.skin));
  const hc = new THREE.Mesh(new THREE.SphereGeometry(0.205, 30, 18, 0, Math.PI, 0, Math.PI * 0.82), m.hair); hc.scale.set(0.98, 1.1, 1.0); hc.position.set(0, -0.06, 0.02); head.add(hc);
  const hf = new THREE.Mesh(new THREE.SphereGeometry(0.205, 30, 12, 0, Math.PI, 0, Math.PI * 0.33), m.hair); hf.scale.set(0.98, 1.1, 1.0); hf.position.set(0, -0.06, 0.005); hf.rotation.order = 'YXZ'; hf.rotation.set(0.3, Math.PI, 0); head.add(hf);
  head.add(sph(0.095, m.hair, 0, 0.1, 0.17, 1, 1, 0.95)); 
  for (const s of [-1, 1]) head.add(mesh(new THREE.CapsuleGeometry(0.03, 0.2, 4, 8), m.hair, s * 0.178, -0.1, -0.03));
  personFace(head, m);
  const cap = cyl(0.17, 0.2, 0.09, m.white, 0, 0.2, -0.01, 28); head.add(cap);
  head.add(box(0.03, 0.07, 0.01, m.red, 0, 0.21, -0.2)); head.add(box(0.07, 0.03, 0.01, m.red, 0, 0.21, -0.2));
  // siringa gigante sopra la testa, tenuta con le mani
  const syr = new THREE.Group(); syr.position.set(0, 0.95, 0); torso.add(syr); P.syringe = syr;
  const tex = syringeTex();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 16), new THREE.MeshLambertMaterial({ map: tex })); barrel.rotation.z = Math.PI / 2; syr.add(barrel);
  syr.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), m.metal, -0.8, 0, 0).rotateZ(Math.PI / 2));        // ago
  syr.children[syr.children.length - 1].position.set(-0.85, 0, 0);
  syr.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), m.metal, 0.75, 0, 0)); syr.children[syr.children.length - 1].rotation.z = Math.PI / 2;
  syr.add(box(0.03, 0.18, 0.18, m.metal, 0.55, 0, 0)); syr.add(box(0.03, 0.18, 0.18, m.metal, -0.5, 0, 0));
  const drop = sph(0.03, lam(0x7fd3ff), -1.12, -0.04, 0, 0.8, 1.4, 0.8); syr.add(drop);
  P.shadow = blobShadow(1.3, 0.35); root.add(P.shadow);
  root.scale.setScalar(0.85);
  return P;
}

export function nursePose(P, name, t) {
  const s = Math.sin(t * 12);
  const run = name === 'run';
  P.legs[0].rotation.x = run ? s * 0.9 : 0; P.legs[1].rotation.x = run ? -s * 0.9 : 0;
  P.body.position.y = run ? Math.abs(Math.sin(t * 12)) * 0.07 : 0;
  P.torso.rotation.x = run ? -0.1 : 0;
  P.syringe.rotation.z = run ? Math.sin(t * 6) * 0.06 : 0;
  if (name === 'stab') { P.syringe.rotation.set(0, 0, 0.0); }
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
