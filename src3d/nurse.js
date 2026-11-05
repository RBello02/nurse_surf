// L'infermiera inseguitrice in 3D: divisa bianca, cuffietta con croce rossa e siringa "PFIZER" gigante sopra la testa.
import { THREE, lam, std, mesh, box, rbox, cyl, sph, canvasTex, blobShadow } from './util.js';

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

export function buildNurse() {
  const m = { white: lam(0xffffff), shade: lam(0xdfe7ec), skin: lam(0xf2c9a5), hair: lam(0x5a3a28), red: lam(0xe0344b), dark: lam(0x2a1810), metal: std(0xc4ccd3, 0.25, 0.8), shoe: lam(0xf4f8fa), pink: lam(0xf18c82) };
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const P = { root, body };
  // gambe e scarpe
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.62, 0);
    hip.add(cyl(0.065, 0.055, 0.5, m.white, 0, -0.25, 0)); hip.add(rbox(0.12, 0.09, 0.26, 0.04, m.shoe, 0, -0.52, -0.04));
    body.add(hip); legs.push(hip);
  }
  P.legs = legs;
  // vestito a campana + busto + cintura rossa
  body.add(cyl(0.2, 0.42, 0.5, m.white, 0, 0.82, 0, 24));
  const torso = new THREE.Group(); torso.position.y = 1.02; body.add(torso); P.torso = torso;
  torso.add(rbox(0.44, 0.4, 0.28, 0.1, m.white, 0, 0.18, 0));
  torso.add(box(0.46, 0.05, 0.3, m.red, 0, -0.02, 0));
  torso.add(sph(0.05, m.pink, -0.2, 0.0, 0)); // gonna piu' piena
  // braccia alzate che reggono la siringa
  P.arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.27, 0.32, 0); torso.add(sh);
    sh.add(cyl(0.05, 0.045, 0.3, m.white, 0, 0.15, 0)); sh.rotation.z = s * -0.25; sh.rotation.x = 0;
    const el = new THREE.Group(); el.position.y = 0.3; sh.add(el);
    el.add(cyl(0.042, 0.038, 0.26, m.skin, 0, 0.13, 0)); el.add(sph(0.05, m.skin, 0, 0.27, 0)); el.rotation.z = s * 0.5;
    P.arms.push({ sh, el });
  }
  // testa
  const head = new THREE.Group(); head.position.y = 0.56; torso.add(head); P.head = head;
  head.add(sph(0.18, m.skin, 0, 0, 0, 1, 1.05, 0.97, 24));
  head.add(sph(0.2, m.hair, 0, 0.02, 0.05, 1, 1.02, 0.95));                // capelli visti da dietro
  head.add(sph(0.08, m.hair, 0, 0.14, 0.15, 1, 0.9, 1));
  for (const s of [-1, 1]) {
    head.add(sph(0.028, lam(0xffffff), s * 0.06, 0.02, -0.15, 1, 1.1, 0.5)); head.add(sph(0.016, m.dark, s * 0.06, 0.018, -0.17, 1, 1.1, 0.5));
    head.add(sph(0.03, m.pink, s * 0.09, -0.04, -0.13, 1.2, 0.7, 0.4));
  }
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14, Math.PI), lam(0xb4504f)); sm.rotation.z = Math.PI; sm.position.set(0, -0.06, -0.155); head.add(sm);
  // cuffietta con croce
  const cap = cyl(0.17, 0.2, 0.09, m.white, 0, 0.2, -0.01, 24); head.add(cap);
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
