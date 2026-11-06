// Martina in 3D, costruita con forme semplici (stile cartoon): stessa faccia, stessi capelli castani raccolti,
// stesso orecchino d'argento, e le tre divise del gioco. Ha anche le tre trasformazioni dopo la puntura.
import { THREE, lam, std, mesh, box, rbox, cyl, sph, clamp, lerp, blobShadow } from './util.js';
import { faceTexture, applyFaceUV } from './face.js';
import { rot, pos, damp, getDT } from './anim.js';

const HEAD = 1.3;
const HAIR = 0x5a3a26, HAIR_SH = 0x3e281a, SKIN = 0xf2c9a5, GREEN = 0x62c24c;
const OUT = {
  casual:   { top: 0x1c1c23, topHi: 0x34343f, pants: 0x1c1c23, shoe: 0x7a1f35, sleeves: 'long',  wide: false,  belt: 0x7a1f35 },
  elegante: { top: 0x8f978c, topHi: 0xaab1a5, pants: 0x8f978c, shoe: 0x6b2230, sleeves: 'mid',   wide: false,  strap: 0xb33a3a },
  uniforme: { top: 0x2fb5a3, topHi: 0x58d3c1, pants: 0x2a9f8f, shoe: 0xffffff, sleeves: 'short', wide: false }
};

// --- capelli lisci con sfumatura (radici scure, punte caramello come nella foto) ---
const H_ROOT = new THREE.Color(0x45301f), H_MID = new THREE.Color(0x7b5535), H_TIP = new THREE.Color(0xb98d5c);
function hairGrad(geo, yTop, yBot) {
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const k = clamp((yTop - p.getY(i)) / (yTop - yBot), 0, 1);
    if (k < 0.45) c.copy(H_ROOT).lerp(H_MID, k / 0.45); else c.copy(H_MID).lerp(H_TIP, (k - 0.45) / 0.55);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
export const capsule = (r, len, mat, x = 0, y = 0, z = 0) => mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat, x, y, z);
// arto affusolato (profilo tornito): pts = [[raggio, y], ...] dall'attaccatura verso il basso; fold = pieghe del tessuto
export function limb(pts0, mat, fold = 0, x = 0, y = 0, z = 0) {
  const pts = pts0.map(([r, yy]) => [r * 1.18, yy]);       // arti piu' robusti, stile cartone
  const v = [new THREE.Vector2(0.001, pts[pts.length - 1][1] - 0.004)];
  for (let i = pts.length - 1; i >= 0; i--) v.push(new THREE.Vector2(pts[i][0], pts[i][1]));
  v.push(new THREE.Vector2(0.001, pts[0][1] + 0.004));
  const g = new THREE.LatheGeometry(v, 26);
  if (fold) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + fold * Math.sin(a * 5 + p.getY(i) * 9) * (1 - Math.abs(p.getY(i)) * 0.4); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
  g.computeVertexNormals();
  return mesh(g, mat, x, y, z);
}
export function torsoGeo(w, d, prof) {                                   // busto tornito (vita stretta, spalle larghe)
  const pts = prof.map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 28); g.scale(w, 1, d); return g;
}
export function headGeo() {                                              // sfera con mento piu' stretto e zigomi
  const g = new THREE.SphereGeometry(0.19, 36, 28), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < 0) { const k = Math.pow(-y / 0.19, 1.4); x *= 1 - 0.3 * k; z *= 1 - 0.14 * k; y *= 1 + 0.05 * k; }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals(); g.scale(0.93, 1.1, 0.98); return applyFaceUV(g);
}

export function buildMartina(outfit = 'uniforme') {
  const O = OUT[outfit] || OUT.uniforme;
  const hairMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const mats = {
    skin: lam(SKIN), top: lam(O.top), topHi: lam(O.topHi), pants: lam(O.pants), shoe: lam(O.shoe),
    hair: hairMat, hairSh: lam(HAIR_SH), white: lam(0xffffff), dark: lam(0x3a2418), eye: lam(0x4a2a12),
    metal: std(0xeef2f5, 0.2, 0.8), gold: std(0xf6c344, 0.3, 0.6), red: lam(0xe0344b), bord: lam(0x7a1f35), orange: lam(0xf7a531), cream: lam(0xfdfdf7),
    lip: lam(0xc9777a), sole: lam(0x2a2a30)
  };
  const root = new THREE.Group();            // piedi a terra, davanti = -z
  const body = new THREE.Group(); root.add(body);
  const parts = { root, body, mats };

  // ---- gambe ----
  function leg(side) {
    const hip = new THREE.Group(); hip.position.set(side * 0.1, 0.92, 0);
    let thigh, shin;
    const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
    if (O.wide) {                                              // pantalone ampio a gamba larga, con pieghe e risvolto
      thigh = limb([[0.142, 0], [0.152, -0.1], [0.146, -0.3], [0.138, -0.46]], mats.pants, 0.025); hip.add(thigh);
      shin = limb([[0.138, 0], [0.142, -0.1], [0.136, -0.3], [0.124, -0.44]], mats.pants, 0.03); knee.add(shin);
      knee.add(cyl(0.126, 0.126, 0.03, mats.topHi, 0, -0.43, 0, 26));
    } else {                                                   // gamba con coscia affusolata e polpaccio
      thigh = limb([[0.082, 0], [0.084, -0.08], [0.07, -0.3], [0.058, -0.46]], mats.pants); hip.add(thigh);
      shin = limb([[0.058, 0], [0.058, -0.05], [0.054, -0.14], [0.04, -0.32], [0.032, -0.44]], mats.pants); knee.add(shin);
    }
    const foot = new THREE.Group(); foot.position.set(0, -0.43, -0.03); knee.add(foot);
    foot.add(rbox(0.125, 0.07, 0.27, 0.035, mats.shoe, 0, 0.005, -0.03));
    foot.add(sph(0.062, mats.shoe, 0, 0.01, -0.13, 1, 0.75, 1));                       // punta arrotondata
    foot.add(box(0.13, 0.02, 0.3, mats.sole, 0, -0.03, -0.04));                        // suola
    foot.add(rbox(0.1, 0.07, 0.09, 0.03, mats.shoe, 0, 0.05, 0.05));                   // tallone
    body.add(hip);
    return { hip, knee, thigh, shin, foot };
  }
  parts.legL = leg(-1); parts.legR = leg(1);

  // ---- busto ----
  const torso = new THREE.Group(); torso.position.y = 0.92; body.add(torso); parts.torso = torso;
  const prof = [[0.001, 0], [0.12, 0.0], [0.145, 0.06], [0.15, 0.15], [0.165, 0.27], [0.175, 0.36], [0.17, 0.44], [0.145, 0.51], [0.075, 0.55], [0.001, 0.56]];
  const torsoMesh = mesh(torsoGeo(1.25, 0.72, prof), mats.top); torso.add(torsoMesh); parts.torsoMesh = torsoMesh;
  const clothes = new THREE.Group(); torso.add(clothes); parts.clothes = clothes;
  // scollo a V (pelle) + collo
  const vShape = new THREE.Shape(); vShape.moveTo(-0.095, 0.545); vShape.lineTo(0.095, 0.545); vShape.lineTo(0, O.sleeves === 'long' ? 0.3 : 0.4); vShape.closePath();
  clothes.add(mesh(new THREE.ShapeGeometry(vShape), mats.skin, 0, 0, -0.124));
  // collana d'argento con ciondolo (come nella foto)
  const neck = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.004, 6, 24), mats.metal); neck.rotation.x = Math.PI / 2 + 0.25; neck.position.set(0, 0.54, -0.02); clothes.add(neck);
  clothes.add(sph(0.011, mats.metal, 0, 0.4, -0.122, 1, 1.4, 0.6));
  const chain = box(0.004, 0.14, 0.004, mats.metal, 0, 0.47, -0.123); clothes.add(chain);
  if (outfit === 'casual') {                                   // risvolti + cintura bordeaux con fibbia dorata
    for (const s of [-1, 1]) { const l = box(0.05, 0.28, 0.014, mats.topHi, s * 0.085, 0.4, -0.125); l.rotation.z = s * 0.3; clothes.add(l); }
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.156, 0.07, 28), mats.bord); belt.scale.set(1.25, 1, 0.72); belt.position.y = 0.07; clothes.add(belt);
    clothes.add(rbox(0.09, 0.075, 0.02, 0.01, mats.gold, 0, 0.07, -0.122));
  } else if (outfit === 'elegante') {                          // tracolla rossa e borsetta
    const strap = box(0.05, 0.66, 0.02, lam(O.strap), 0, 0.28, -0.13); strap.rotation.z = -0.55; clothes.add(strap);
    clothes.add(rbox(0.14, 0.11, 0.06, 0.02, lam(0x4a4650), 0.2, 0.05, -0.12));
  } else {                                                      // taschino con croce rossa e stetoscopio
    clothes.add(box(0.09, 0.09, 0.012, mats.white, 0.1, 0.32, -0.125));
    clothes.add(box(0.016, 0.06, 0.014, mats.red, 0.1, 0.32, -0.13)); clothes.add(box(0.06, 0.016, 0.014, mats.red, 0.1, 0.32, -0.13));
    const st = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20, Math.PI * 1.3), lam(0x2a2a30)); st.rotation.set(Math.PI / 2 + 0.2, 0, Math.PI * 0.85); st.position.set(0, 0.52, -0.01); clothes.add(st);
  }
  // altri pezzi usati dalle trasformazioni
  const bare = mesh(torsoGeo(1.45, 0.9, prof.map(([r, y]) => [r * 1.12, y])), mats.skin); bare.visible = false; torso.add(bare); parts.bare = bare;
  const muscles = new THREE.Group(); muscles.visible = false; torso.add(muscles); parts.muscles = muscles;
  for (const s of [-1, 1]) {
    muscles.add(sph(0.11, mats.skin, s * 0.12, 0.38, -0.11, 1.2, 0.9, 0.7));
    for (let i = 0; i < 3; i++) muscles.add(sph(0.045, mats.skin, s * 0.045, 0.28 - i * 0.075, -0.15, 1, 0.8, 0.5));
    muscles.add(sph(0.085, mats.skin, s * 0.26, 0.47, 0, 1, 0.9, 1));
  }
  const shreds = new THREE.Group(); shreds.visible = false; torso.add(shreds); parts.shreds = shreds;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const sh = box(0.06, 0.1 - i * 0.02, 0.02, mats.top, s * (0.24 - i * 0.04), 0.5 - i * 0.03, -0.12); sh.rotation.z = s * (0.5 + i * 0.3); shreds.add(sh); }
  const belly = sph(0.46, mats.skin, 0, 0.18, -0.06, 1, 0.9, 0.95); belly.visible = false; torso.add(belly); parts.belly = belly;
  const maw = new THREE.Group(); maw.visible = false; body.add(maw); parts.mawashi = maw;
  maw.add(cyl(0.5, 0.45, 0.1, mats.bord, 0, 0.88, -0.02, 28)); maw.add(box(0.14, 0.12, 0.03, mats.gold, 0, 0.88, -0.5));
  for (let i = -4; i <= 4; i++) maw.add(box(0.07, 0.34, 0.012, i % 2 ? mats.bord : lam(0x9a2b47), i * 0.075, 0.68, -0.5 + Math.abs(i) * 0.012));
  // collo
  torso.add(capsule(0.045, 0.1, mats.skin, 0, 0.6, 0.005));

  // ---- braccia ----
  function arm(side) {
    const sh = new THREE.Group(); sh.position.set(side * 0.255, 0.5, 0);
    sh.add(sph(0.058, mats.top, 0, 0, 0));                                              // spalla
    const upper = limb([[0.045, 0], [0.046, -0.05], [0.04, -0.14], [0.034, -0.28]], mats.skin); sh.add(upper);
    const sLen = O.sleeves === 'short' ? 0.15 : 0.28; const sleeveU = limb([[0.062, 0], [0.066, -sLen * 0.4], [0.06, -sLen]], mats.top, O.wide ? 0.04 : 0.01); sh.add(sleeveU);
    const el = new THREE.Group(); el.position.y = -0.28; sh.add(el);
    el.add(sph(0.04, mats.skin, 0, 0, 0));
    const fore = limb([[0.036, 0], [0.036, -0.03], [0.03, -0.14], [0.021, -0.28]], mats.skin); el.add(fore);
    let sleeveF = null;
    if (O.sleeves !== 'short') { const fl = O.sleeves === 'long' ? 0.23 : 0.09; sleeveF = limb([[0.054, 0], [0.056, -fl * 0.4], [O.sleeves === 'long' ? 0.05 : 0.046, -fl]], mats.top, O.wide ? 0.035 : 0.01); el.add(sleeveF); }
    // mano con dita e pollice
    const hand = new THREE.Group(); hand.position.y = -0.285; el.add(hand);
    hand.add(rbox(0.07, 0.07, 0.03, 0.012, mats.skin, 0, -0.01, 0));
    for (let i = 0; i < 4; i++) { const f = capsule(0.0095, 0.045 - Math.abs(i - 1.4) * 0.004, mats.skin, (i - 1.5) * 0.0165, -0.075, 0); hand.add(f); }
    const th = capsule(0.011, 0.04, mats.skin, side * -0.04, -0.03, -0.005); th.rotation.z = side * 0.7; hand.add(th);
    if (side === 1) {                                                                   // bracciali: azzurro e argento
      const b1 = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.007, 8, 18), lam(0x4a8fe0)); b1.rotation.x = Math.PI / 2; b1.position.y = -0.255; el.add(b1);
      const b2 = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.005, 8, 18), mats.metal); b2.rotation.x = Math.PI / 2; b2.position.y = -0.235; el.add(b2);
    }
    torso.add(sh);
    return { sh, el, upper, fore, sleeveU, sleeveF, hand };
  }
  parts.armL = arm(-1); parts.armR = arm(1);

  // ---- testa ----
  const head = new THREE.Group(); head.position.y = 0.8; head.scale.setScalar(HEAD); torso.add(head); parts.head = head;
  const faceMat = new THREE.MeshLambertMaterial({ map: faceTexture('smile', false, 'martina') }); mats.face = faceMat;
  head.add(mesh(headGeo(), faceMat));
  for (const s of [-1, 1]) {                                                              // orecchie e orecchini d'argento
    head.add(sph(0.03, mats.skin, s * 0.176, -0.015, 0.0, 0.5, 1.1, 0.8));
    head.add(sph(0.011, mats.metal, s * 0.182, -0.062, -0.005)); head.add(sph(0.016, mats.metal, s * 0.182, -0.085, -0.005, 0.7, 1.1, 0.7));
  }
  // capelli: calotta, riga in mezzo, due lunghe ciocche davanti e tenda dietro (tutto con sfumatura caramello)
  const swing = new THREE.Group(); swing.position.y = 0.06; head.add(swing); parts.hairSwing = swing;
  const mk = (geo, yT, yB) => new THREE.Mesh(hairGrad(geo, yT, yB), hairMat);
  // calotta di capelli con attaccatura alta (fronte libera, riga in mezzo) invece della frangetta
  const hairCap = (theta, yT, yB) => {
    const g = new THREE.SphereGeometry(0.208, 36, 22, 0, Math.PI * 2, 0, theta), pp = g.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      if (z + 0.02 < 0.02) { const u = Math.min(1, Math.max(0, (Math.abs(x) / 0.19 - 0.3) / 0.5)), hl = 0.125 - 0.17 * u * u * (3 - 2 * u); if (y * 1.1 < hl) pp.setY(i, hl / 1.1); }   // fronte libera al centro, tempie coperte dalla riga in mezzo
    }
    g.computeVertexNormals();
    return mk(g, yT, yB);
  };
  const capBack = hairCap(Math.PI * 0.82, 0.2, -0.6); capBack.scale.set(1.02, 1.13, 1.04); capBack.position.set(0, -0.065, 0.02); swing.add(capBack);
  const part = box(0.006, 0.004, 0.2, mats.hairSh, 0, 0.17, -0.02); part.rotation.x = 0.15;       // riga in mezzo
  if (outfit === 'casual') {
    // vestito di laurea: capelli RACCOLTI in uno chignon alto con elastico bordeaux, riga in mezzo e due ciocche libere sul viso
    capBack.geometry.dispose(); capBack.geometry = hairCap(Math.PI * 0.64, 0.2, -0.3).geometry;
    const bun = mk(new THREE.SphereGeometry(0.092, 24, 18), 0.1, -0.1); bun.scale.set(1.05, 0.9, 0.95); bun.position.set(0, 0.2, 0.15); swing.add(bun);
    for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 6, 24), hairMat); w.position.set(0, 0.2 + (i - 1) * 0.018, 0.15); w.rotation.set(Math.PI / 2 + (i - 1) * 0.35, 0, i * 0.5); w.scale.set(1.05, 1.05, 0.9); swing.add(w); }
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.011, 8, 26), mats.bord); tie.position.set(0, 0.145, 0.15); tie.rotation.x = Math.PI / 2 - 0.55; swing.add(tie);
    const nape = mk(new THREE.SphereGeometry(0.19, 22, 14, 0, Math.PI, 0, Math.PI * 0.5), 0.1, -0.2); nape.scale.set(0.95, 0.8, 0.9); nape.position.set(0, 0.03, 0.06); nape.rotation.x = -0.4; swing.add(nape);   // tirata dietro
    for (const s of [-1, 1]) {
      const strand = mk(new THREE.CapsuleGeometry(0.011, 0.17, 4, 8), 0.1, -0.14); strand.scale.set(0.8, 1, 0.7);
      strand.position.set(s * 0.178, -0.07, -0.05); strand.rotation.set(0.05, 0, s * 0.05); head.add(strand);
    }
    parts.hairUp = true;
  } else {
    const curtain = mk(new THREE.CylinderGeometry(0.205, 0.2, 0.62, 28, 10, true, -Math.PI * 0.64, Math.PI * 1.28), 0.31, -0.31); curtain.position.set(0, -0.32, 0.0); swing.add(curtain);
    for (const s of [-1, 1]) {
      const lock = mk(new THREE.CapsuleGeometry(0.045, 0.52, 4, 10), 0.28, -0.3); lock.scale.set(0.8, 1, 0.42);
      lock.position.set(s * 0.175, -0.2, -0.085); lock.rotation.set(0.03, 0, s * 0.1); head.add(lock);
    }
  }
  // volto
  // cresta e becco (solo gallina)
  const hen = new THREE.Group(); hen.visible = false; head.add(hen); parts.henHead = hen;
  for (let i = 0; i < 5; i++) hen.add(sph(0.045 - Math.abs(i - 2) * 0.006, mats.red, 0, 0.21 + (i === 2 ? 0.025 : 0) - Math.abs(i - 2) * 0.012, -0.1 + i * 0.05));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 12), mats.orange); beak.rotation.x = -Math.PI / 2; beak.position.set(0, -0.045, -0.255); hen.add(beak);
  hen.add(sph(0.032, mats.red, 0, -0.115, -0.2, 0.8, 1.5, 0.7));
  parts.face = { hen, mat: faceMat }; parts.expr = 'smile'; parts.skinKey = 'martina'; parts.clock = Math.random() * 3; parts.init = false;

  // ---- gallina ----
  const henBody = new THREE.Group(); henBody.visible = false; root.add(henBody); parts.henBody = henBody;
  henBody.add(sph(0.5, mats.cream, 0, 0.68, 0.02, 0.95, 0.85, 1.05, 24));
  for (const s of [-1, 1]) {
    const wing = sph(0.3, mats.cream, s * 0.5, 0.68, 0.05, 0.3, 0.9, 0.7); wing.rotation.z = s * 0.35; henBody.add(wing); parts.henWing = parts.henWing || []; parts.henWing.push(wing);
    const leg = cyl(0.028, 0.028, 0.3, mats.orange, s * 0.15, 0.2, 0.0); henBody.add(leg);
    for (const a of [-0.5, 0, 0.5]) { const toe = box(0.03, 0.02, 0.14, mats.orange, s * 0.15 + a * 0.08, 0.02, -0.07); toe.rotation.y = a; henBody.add(toe); }
  }
  for (let i = -2; i <= 2; i++) { const f = sph(0.16, i % 2 ? mats.white : mats.cream, i * 0.12, 0.86, 0.42, 0.5, 1.2, 0.4); f.rotation.z = -i * 0.3; henBody.add(f); }
  henBody.add(sph(0.2, mats.cream, 0, 1.0, -0.2, 1.1, 0.7, 0.7));
  henBody.add(sph(0.025, mats.bord, 0, 0.95, -0.52, 4.5, 0.6, 1)); // fascia/cintura rimasta
  parts.shadow = blobShadow(1.1, 0.35); root.add(parts.shadow);

  parts.outfit = outfit; parts.O = O; parts.form = 'normal';
  parts.base = { skin: SKIN, shoe: O.shoe, pants: O.pants };
  parts.hs = 0.95; root.scale.setScalar(parts.hs);
  return parts;
}

// ---- trasformazioni ----
export function setForm(M, form) {
  const { mats, O } = M;
  M.form = form;
  const sc = M.hs;
  mats.skin.color.setHex(form === 'hulk' ? GREEN : SKIN);
  mats.shoe.color.setHex(form === 'hulk' ? GREEN : O.shoe);
  mats.pants.color.setHex(form === 'sumo' ? SKIN : O.pants);
  const big = form === 'hulk', sumo = form === 'sumo', hen = form === 'hen';
  M.bare.visible = big || sumo; M.muscles.visible = big; M.shreds.visible = big; M.belly.visible = sumo; M.mawashi.visible = sumo;
  M.torsoMesh.visible = !(big || sumo || hen); M.clothes.visible = !(big || sumo || hen);
  for (const a of [M.armL, M.armR]) {
    a.sleeveU.visible = !(big || sumo); if (a.sleeveF) a.sleeveF.visible = !(big || sumo);
    a.upper.scale.set(big ? 1.9 : sumo ? 1.7 : 1, 1, big ? 1.9 : sumo ? 1.7 : 1); a.fore.scale.copy(a.upper.scale); a.hand.scale.setScalar(big ? 1.7 : sumo ? 1.4 : 1);
    a.sh.visible = !hen;
  }
  for (const l of [M.legL, M.legR]) { l.hip.visible = !hen; l.thigh.scale.set(sumo ? 1.5 : big ? 1.3 : 1, 1, sumo ? 1.5 : big ? 1.3 : 1); l.shin.scale.copy(l.thigh.scale); }
  M.henBody.visible = hen; M.face.hen.visible = hen; M.skinKey = big ? 'hulk' : 'martina'; M.init = false;
  M.torso.position.y = hen ? 0.3 : 0.92;
  M.head.scale.setScalar(HEAD * (big ? 0.85 : 1));
  M.root.scale.set(sc * (big ? 1.5 : sumo ? 1.45 : hen ? 1.25 : 1), sc * (big ? 1.38 : sumo ? 0.98 : hen ? 1.25 : 1), sc * (big ? 1.42 : sumo ? 1.45 : hen ? 1.25 : 1));
  face(M, big || sumo ? 'angry' : hen ? 'hen' : 'smile');
  M.shadow.scale.setScalar(big || sumo ? 1.6 : hen ? 1.4 : 1);
}

export function face(M, expr) { M.expr = expr; applyFace(M, false); }
function applyFace(M, blink) {
  const key = M.expr + (blink ? 'b' : '') + M.skinKey;
  if (M.faceKey === key) return;
  M.faceKey = key; M.face.mat.map = faceTexture(M.expr === 'hen' ? 'hen' : M.expr, blink, M.skinKey); M.face.mat.needsUpdate = true;
}

// ---- pose / animazione (fluida: ogni giunto insegue la posa richiesta con smorzamento) ----
export function pose(M, name, t, k = {}) {
  const f = M.form, sn = !M.init; M.init = true;
  const dtc = getDT(); M.clock += dtc;
  const run = name === 'run', ph = t * 11, s = Math.sin(ph), c = Math.cos(ph);
  const { legL, legR, armL, armR, torso } = M;
  const sumo = f === 'sumo', hen = f === 'hen';
  const R = (o, x, y = 0, z = 0, rate = 18) => rot(o, x, y, z, rate, sn);
  let by = 0, bx = 0, bz = 0, bry = 0, brx = 0, brz = 0, hx = 0, hy = 0, hz = 0, hair = 0;
  M.root.rotation.set(0, M.yaw || 0, 0);
  if (run) {
    const fl = (v) => 0.2 + 1.15 * Math.pow(Math.max(0, v), 1.1);          // il ginocchio si piega quando la gamba torna avanti
    R(legL.hip, s * 0.85 + 0.06, 0, 0.03, 26); R(legR.hip, -s * 0.85 + 0.06, 0, -0.03, 26);
    R(legL.knee, -fl(c), 0, 0, 26); R(legR.knee, -fl(-c), 0, 0, 26);
    R(legL.foot, 0.12 - 0.25 * Math.max(0, -s), 0, 0, 20); R(legR.foot, 0.12 - 0.25 * Math.max(0, s), 0, 0, 20);
    R(armL.sh, -s * 0.75 + 0.1, 0, 0.1, 22); R(armR.sh, s * 0.75 + 0.1, 0, -0.1, 22);
    R(armL.el, 1.15 + Math.max(0, s) * 0.3, 0, 0, 22); R(armR.el, 1.15 + Math.max(0, -s) * 0.3, 0, 0, 22);
    R(torso, -0.13, s * 0.15, c * 0.03, 16);
    by = Math.abs(Math.sin(ph)) * 0.06; brz = c * 0.025; hx = 0.12; hy = -s * 0.1; hair = 0.14 + Math.sin(ph + 1.3) * 0.12;
  } else if (name === 'jump') {
    R(legL.hip, 0.75, 0, 0.04, 14); R(legR.hip, -0.3, 0, -0.04, 14); R(legL.knee, -1.05, 0, 0, 14); R(legR.knee, -1.25, 0, 0, 14);
    R(legL.foot, 0.3, 0, 0, 14); R(legR.foot, 0.4, 0, 0, 14);
    R(armL.sh, 2.5, 0, 0.35, 14); R(armR.sh, 2.5, 0, -0.35, 14); R(armL.el, 0.3, 0, 0, 14); R(armR.el, 0.3, 0, 0, 14);
    R(torso, -0.12, 0, 0, 12); hx = -0.1; hair = 0.45;
  } else if (name === 'slide') {
    brx = 1.15; by = 0.5; bz = 0.25;
    R(legL.hip, 0.15, 0, 0.05, 14); R(legR.hip, 0.15, 0, -0.05, 14); R(legL.knee, -0.1, 0, 0, 14); R(legR.knee, -0.1, 0, 0, 14); R(legL.foot, 0, 0, 0, 14); R(legR.foot, 0, 0, 0, 14);
    R(armL.sh, 1.4, 0, 0.3, 14); R(armR.sh, 1.4, 0, -0.3, 14); R(armL.el, 0.2, 0, 0, 14); R(armR.el, 0.2, 0, 0, 14);
    R(torso, 0, 0, 0, 12); hx = -1.0; hair = 0.5;
  } else if (name === 'cheer') {
    const w = Math.sin(t * 9) * 0.25;
    R(legL.hip, 0, 0, 0.05, 14); R(legR.hip, 0, 0, -0.05, 14); R(legL.knee, 0); R(legR.knee, 0); R(legL.foot, 0); R(legR.foot, 0);
    R(armL.sh, 2.9 + w, 0, 0.45, 14); R(armR.sh, 2.9 - w, 0, -0.45, 14); R(armL.el, 0.2); R(armR.el, 0.2);
    R(torso, 0, Math.sin(t * 4) * 0.08, 0, 12); by = Math.abs(Math.sin(t * 7)) * 0.08; hair = Math.sin(t * 7) * 0.08;
  } else if (name === 'roar') {
    const q = Math.sin(t * 22) * 0.04;
    R(legL.hip, 0, 0, -0.18, 14); R(legR.hip, 0, 0, 0.18, 14); R(legL.knee, 0); R(legR.knee, 0); R(legL.foot, 0); R(legR.foot, 0);
    R(armL.sh, 0.2, 0, 0.9 + q, 14); R(armR.sh, 0.2, 0, -0.9 - q, 14); R(armL.el, 1.0); R(armR.el, 1.0);
    R(torso, 0.18 + q, 0, 0, 14); hx = -0.35;
  } else if (name === 'scared') {
    const sh = Math.sin(t * 40) * 0.05;
    R(legL.hip, 0.05, 0, 0.06, 14); R(legR.hip, -0.05, 0, -0.06, 14); R(legL.knee, -0.12); R(legR.knee, -0.12); R(legL.foot, 0); R(legR.foot, 0);
    R(armL.sh, 1.2 + sh, 0, 0.5, 16); R(armR.sh, 1.2 - sh, 0, -0.5, 16); R(armL.el, 1.4, 0, 0, 16); R(armR.el, 1.4, 0, 0, 16);
    R(torso, 0.1 + sh, 0, 0, 16); hy = sh * 2; by = -0.02;
  } else {                                                  // stand: respiro e leggero spostamento del peso
    const br = Math.sin(t * 2.2) * 0.02, sw = Math.sin(t * 0.9) * 0.03;
    R(legL.hip, 0, 0, 0.04 + sw, 8); R(legR.hip, 0, 0, -0.04 + sw, 8); R(legL.knee, 0, 0, 0, 8); R(legR.knee, 0, 0, 0, 8); R(legL.foot, 0, 0, 0, 8); R(legR.foot, 0, 0, 0, 8);
    R(armL.sh, br, 0, 0.1, 8); R(armR.sh, -br, 0, -0.1, 8); R(armL.el, 0.15 + br, 0, 0, 8); R(armR.el, 0.15 - br, 0, 0, 8);
    R(torso, 0, sw * 0.6, sw * 0.5, 8); by = br; hy = Math.sin(t * 0.7) * 0.05; hair = Math.sin(t * 2) * 0.03;
  }
  if (sumo && name !== 'slide' && name !== 'jump') {          // posa del sumo: gambe larghe e piegate, braccia larghe
    R(legL.hip, -0.1, 0, -0.45); R(legR.hip, -0.1, 0, 0.45); R(legL.knee, -0.35); R(legR.knee, -0.35);
    R(armL.sh, 0.2, 0, 0.7); R(armR.sh, 0.2, 0, -0.7);
    by = -0.08 + Math.abs(Math.sin(t * 5)) * 0.03;
  }
  rot(M.body, brx, bry, brz, 14, sn); pos(M.body, bx, by, bz, 22, sn);
  rot(M.head, hx, hy, hz, 14, sn);
  if (M.hairSwing) rot(M.hairSwing, hair, 0, 0, M.hairUp ? 9 : 7, sn);
  if (hen) { M.henBody.rotation.set(0, 0, Math.sin(t * 14) * 0.05); M.body.position.y = Math.abs(Math.sin(t * 12)) * 0.05; if (M.henWing) M.henWing.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (0.35 + Math.abs(Math.sin(t * 16)) * 0.6); }); }
  if (k.lean) { M.root.rotation.z = -k.lean * 0.22; M.root.rotation.y = (M.yaw || 0) - k.lean * 0.38; }
  applyFace(M, (M.clock % 3.6) > 3.47 && M.expr !== 'angry' && M.expr !== 'shout');
}
