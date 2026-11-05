// Martina in 3D, costruita con forme semplici (stile cartoon): stessa faccia, stessi capelli castani raccolti,
// stesso orecchino d'argento, e le tre divise del gioco. Ha anche le tre trasformazioni dopo la puntura.
import { THREE, lam, std, mesh, box, rbox, cyl, sph, clamp, lerp, blobShadow } from './util.js';

const HAIR = 0x5a3a26, HAIR_SH = 0x3e281a, SKIN = 0xf2c9a5, GREEN = 0x62c24c;
const OUT = {
  casual:   { top: 0x1c1c23, topHi: 0x34343f, pants: 0x1c1c23, shoe: 0x7a1f35, sleeves: 'long',  wide: true,  belt: 0x7a1f35 },
  elegante: { top: 0x8f978c, topHi: 0xaab1a5, pants: 0x8f978c, shoe: 0x6b2230, sleeves: 'mid',   wide: true,  strap: 0xb33a3a },
  uniforme: { top: 0x2fb5a3, topHi: 0x58d3c1, pants: 0x2a9f8f, shoe: 0xffffff, sleeves: 'short', wide: false }
};

export function buildMartina(outfit = 'uniforme') {
  const O = OUT[outfit] || OUT.uniforme;
  const mats = {
    skin: lam(SKIN), top: lam(O.top), topHi: lam(O.topHi), pants: lam(O.pants), shoe: lam(O.shoe),
    hair: lam(HAIR), hairSh: lam(HAIR_SH), white: lam(0xffffff), dark: lam(0x2a1810), eye: lam(0x5a3416),
    metal: std(0xeef2f5, 0.2, 0.8), gold: std(0xf6c344, 0.3, 0.6), red: lam(0xe0344b), bord: lam(0x7a1f35), orange: lam(0xf7a531), cream: lam(0xfdfdf7)
  };
  const root = new THREE.Group();            // piedi a terra, davanti = -z
  const body = new THREE.Group(); root.add(body);
  const parts = { root, body, mats };

  // ---- gambe ----
  function leg(side) {
    const hip = new THREE.Group(); hip.position.set(side * 0.1, 0.92, 0);
    const rT = O.wide ? 0.15 : 0.085, rK = O.wide ? 0.13 : 0.07, rA = O.wide ? 0.085 : 0.055;
    const thigh = cyl(rT, rK, 0.46, mats.pants, 0, -0.23, 0); hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
    const shin = cyl(rK, rA, 0.44, mats.pants, 0, -0.22, 0); knee.add(shin);
    const foot = rbox(0.12, 0.09, 0.26, 0.04, mats.shoe, 0, -0.43, -0.05); knee.add(foot);
    const cuff = cyl(rA + 0.012, rA + 0.012, 0.03, mats.pants, 0, -0.37, 0); if (O.wide) knee.add(cuff);
    body.add(hip);
    return { hip, knee, thigh, shin, foot };
  }
  parts.legL = leg(-1); parts.legR = leg(1);

  // ---- busto ----
  const torso = new THREE.Group(); torso.position.y = 0.92; body.add(torso); parts.torso = torso;
  const torsoMesh = rbox(0.4, 0.52, 0.24, 0.09, mats.top, 0, 0.27, 0); torso.add(torsoMesh); parts.torsoMesh = torsoMesh;
  const clothes = new THREE.Group(); torso.add(clothes); parts.clothes = clothes;
  // scollo a V (pelle) sul davanti
  const vShape = new THREE.Shape(); vShape.moveTo(-0.085, 0.53); vShape.lineTo(0.085, 0.53); vShape.lineTo(0, O.sleeves === 'long' ? 0.28 : 0.4); vShape.closePath();
  const vNeck = mesh(new THREE.ShapeGeometry(vShape), mats.skin, 0, 0, -0.1225); clothes.add(vNeck);
  if (outfit === 'casual') {                                   // risvolti + cintura bordeaux con fibbia dorata
    for (const s of [-1, 1]) { const l = box(0.04, 0.3, 0.012, mats.topHi, s * 0.075, 0.38, -0.125); l.rotation.z = s * 0.28; clothes.add(l); }
    clothes.add(rbox(0.43, 0.07, 0.27, 0.03, mats.bord, 0, 0.06, 0));
    clothes.add(box(0.09, 0.075, 0.02, mats.gold, 0, 0.06, -0.14));
  } else if (outfit === 'elegante') {                          // tracolla rossa e borsetta
    const strap = box(0.05, 0.66, 0.02, lam(O.strap), 0, 0.28, -0.125); strap.rotation.z = -0.55; clothes.add(strap);
    clothes.add(rbox(0.14, 0.11, 0.06, 0.02, lam(0x4a4650), 0.2, 0.05, -0.12));
  } else {                                                      // taschino con croce rossa
    clothes.add(box(0.09, 0.09, 0.012, mats.white, 0.1, 0.32, -0.125));
    clothes.add(box(0.016, 0.06, 0.014, mats.red, 0.1, 0.32, -0.13)); clothes.add(box(0.06, 0.016, 0.014, mats.red, 0.1, 0.32, -0.13));
  }
  // altri pezzi usati dalle trasformazioni
  const bare = rbox(0.5, 0.56, 0.3, 0.12, mats.skin, 0, 0.28, 0); bare.visible = false; torso.add(bare); parts.bare = bare;
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
  torso.add(cyl(0.05, 0.055, 0.1, mats.skin, 0, 0.58, 0));

  // ---- braccia ----
  function arm(side) {
    const sh = new THREE.Group(); sh.position.set(side * 0.255, 0.5, 0);
    const upper = cyl(0.043, 0.037, 0.28, mats.skin, 0, -0.14, 0); sh.add(upper);
    const sleeveU = cyl(0.06, 0.053, O.sleeves === 'short' ? 0.15 : 0.28, mats.top, 0, O.sleeves === 'short' ? -0.075 : -0.14, 0); sh.add(sleeveU);
    const el = new THREE.Group(); el.position.y = -0.28; sh.add(el);
    const fore = cyl(0.037, 0.032, 0.26, mats.skin, 0, -0.13, 0); el.add(fore);
    let sleeveF = null;
    if (O.sleeves !== 'short') { sleeveF = cyl(0.053, 0.046, O.sleeves === 'long' ? 0.23 : 0.09, mats.top, 0, O.sleeves === 'long' ? -0.115 : -0.045, 0); el.add(sleeveF); }
    const hand = sph(0.05, mats.skin, 0, -0.28, 0); el.add(hand);
    torso.add(sh);
    return { sh, el, upper, fore, sleeveU, sleeveF, hand };
  }
  parts.armL = arm(-1); parts.armR = arm(1);

  // ---- testa ----
  const head = new THREE.Group(); head.position.y = 0.75; torso.add(head); parts.head = head;
  head.add(sph(0.19, mats.skin, 0, 0, 0, 0.95, 1.05, 0.97, 28));
  // capelli: calotta sul dietro e sopra, frangia davanti, chignon e ciocche ai lati
  const back = new THREE.Mesh(new THREE.SphereGeometry(0.205, 30, 18, 0, Math.PI, 0, Math.PI * 0.78), mats.hair); back.scale.set(0.97, 1.07, 1.0); back.position.set(0, 0.012, 0.02); head.add(back);
  const front = new THREE.Mesh(new THREE.SphereGeometry(0.205, 30, 12, Math.PI, Math.PI, 0, Math.PI * 0.37), mats.hair); front.scale.set(0.97, 1.07, 1.0); front.position.set(0, 0.012, 0.01); front.rotation.x = -0.22; head.add(front);
  const fringe = sph(0.1, mats.hair, -0.09, 0.115, -0.15, 1.5, 0.6, 0.7); fringe.rotation.z = 0.35; head.add(fringe);
  head.add(sph(0.095, mats.hair, 0, 0.235, 0.03, 1, 0.9, 1));                       // chignon
  head.add(sph(0.025, mats.hairSh, 0, 0.215, -0.04, 1.8, 0.7, 1));
  for (const s of [-1, 1]) { const lock = cyl(0.03, 0.02, 0.22, mats.hair, s * 0.185, -0.07, 0.01); lock.rotation.z = s * 0.06; head.add(lock); head.add(sph(0.012, mats.metal, s * 0.19, -0.19, -0.02)); }
  // volto
  const eyes = [];
  for (const s of [-1, 1]) {
    head.add(sph(0.032, mats.white, s * 0.066, 0.02, -0.168, 1, 1.15, 0.45));
    const iris = sph(0.021, mats.eye, s * 0.066, 0.016, -0.182, 1, 1.15, 0.4); head.add(iris); eyes.push(iris);
    head.add(sph(0.011, lam(0x120a05), s * 0.066, 0.014, -0.19, 1, 1.15, 0.4));
    head.add(sph(0.006, mats.white, s * 0.058, 0.03, -0.194));
    head.add(sph(0.03, lam(0xf18c82), s * 0.095, -0.05, -0.15, 1.2, 0.7, 0.4));    // guance
  }
  const brows = [];
  for (const s of [-1, 1]) { const b = box(0.07, 0.012, 0.012, mats.dark, s * 0.07, 0.075, -0.17); b.rotation.z = s * -0.1; head.add(b); brows.push(b); }
  head.add(sph(0.014, lam(0xe0b08e), 0, -0.02, -0.19, 1, 1.2, 0.8));                 // naso
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 14, Math.PI), lam(0xb4504f)); smile.rotation.z = Math.PI; smile.position.set(0, -0.075, -0.172); head.add(smile);
  const mouthOpen = new THREE.Group(); mouthOpen.position.set(0, -0.09, -0.172); mouthOpen.visible = false; head.add(mouthOpen);
  mouthOpen.add(sph(0.04, lam(0x4a0d12), 0, 0, 0, 1, 0.9, 0.4)); mouthOpen.add(box(0.06, 0.012, 0.01, mats.white, 0, 0.022, -0.012)); mouthOpen.add(sph(0.016, lam(0xb3263e), 0, -0.02, -0.005, 1.5, 0.6, 0.5));
  // cresta e becco (solo gallina)
  const hen = new THREE.Group(); hen.visible = false; head.add(hen); parts.henHead = hen;
  for (let i = 0; i < 5; i++) hen.add(sph(0.045 - Math.abs(i - 2) * 0.006, mats.red, 0, 0.21 + (i === 2 ? 0.025 : 0) - Math.abs(i - 2) * 0.012, -0.1 + i * 0.05));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 12), mats.orange); beak.rotation.x = -Math.PI / 2; beak.position.set(0, -0.045, -0.255); hen.add(beak);
  hen.add(sph(0.032, mats.red, 0, -0.115, -0.2, 0.8, 1.5, 0.7));
  parts.face = { brows, smile, mouthOpen, hen, eyes };

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
  parts.hs = 0.9; root.scale.setScalar(parts.hs);
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
  M.henBody.visible = hen; M.face.hen.visible = hen;
  M.torso.position.y = hen ? 0.3 : 0.92;
  M.head.scale.setScalar(big ? 0.85 : 1);
  M.root.scale.set(sc * (big ? 1.5 : sumo ? 1.45 : hen ? 1.25 : 1), sc * (big ? 1.38 : sumo ? 0.98 : hen ? 1.25 : 1), sc * (big ? 1.42 : sumo ? 1.45 : hen ? 1.25 : 1));
  face(M, big || sumo ? 'angry' : hen ? 'hen' : 'smile');
  M.shadow.scale.setScalar(big || sumo ? 1.6 : hen ? 1.4 : 1);
}

export function face(M, expr) {
  const f = M.face;
  const angry = expr === 'angry' || expr === 'hen';
  f.smile.visible = expr === 'smile' || expr === 'worried';
  f.mouthOpen.visible = expr === 'angry' || expr === 'shout' || expr === 'scared';
  f.brows[0].rotation.z = angry ? -0.5 : expr === 'scared' ? 0.35 : 0.1; f.brows[1].rotation.z = angry ? 0.5 : expr === 'scared' ? -0.35 : -0.1;
  f.brows.forEach((b) => { b.position.y = angry ? 0.062 : 0.075; });
  f.mouthOpen.scale.set(expr === 'scared' ? 0.8 : 1, expr === 'shout' || expr === 'scared' ? 1.3 : 1, 1);
}

// ---- pose / animazione ----
const set = (o, x, y = 0, z = 0) => { o.rotation.set(x, y, z); };
export function pose(M, name, t, k = {}) {
  const f = M.form;
  const run = name === 'run', s = Math.sin(t * 11), s2 = Math.sin(t * 11 + Math.PI);
  M.body.position.set(0, 0, 0); M.body.rotation.set(0, 0, 0);
  M.root.rotation.set(0, M.yaw || 0, 0);
  const { legL, legR, armL, armR, torso } = M;
  const sumo = f === 'sumo', hen = f === 'hen';
  if (run) {
    set(legL.hip, s * 0.95); set(legR.hip, s2 * 0.95);
    set(legL.knee, -(Math.max(0, -s) * 1.25 + 0.1)); set(legR.knee, -(Math.max(0, -s2) * 1.25 + 0.1));
    set(armL.sh, s2 * 0.85, 0, 0.08); set(armR.sh, s * 0.85, 0, -0.08);
    set(armL.el, 0.8 + Math.max(0, s2) * 0.4); set(armR.el, 0.8 + Math.max(0, s) * 0.4);
    set(torso, -0.14, s * 0.12);
    M.body.position.y = Math.abs(Math.sin(t * 11)) * 0.07;
    M.head.rotation.set(0.1, -s * 0.06, 0);
  } else if (name === 'jump') {
    set(legL.hip, 0.7); set(legR.hip, -0.25); set(legL.knee, -1.0); set(legR.knee, -1.2);
    set(armL.sh, 2.5, 0, 0.35); set(armR.sh, 2.5, 0, -0.35); set(armL.el, 0.3); set(armR.el, 0.3);
    set(torso, -0.12); M.head.rotation.set(-0.1, 0, 0);
  } else if (name === 'slide') {
    M.body.rotation.x = 1.15; M.body.position.set(0, 0.5, 0.25);
    set(legL.hip, 0.15); set(legR.hip, 0.15); set(legL.knee, -0.1); set(legR.knee, -0.1);
    set(armL.sh, 1.4, 0, 0.3); set(armR.sh, 1.4, 0, -0.3); set(armL.el, 0.2); set(armR.el, 0.2);
    set(torso, 0); M.head.rotation.set(-1.0, 0, 0);
  } else if (name === 'cheer') {
    const w = Math.sin(t * 9) * 0.25;
    set(legL.hip, 0); set(legR.hip, 0); set(legL.knee, 0); set(legR.knee, 0);
    set(armL.sh, 2.9 + w, 0, 0.45); set(armR.sh, 2.9 - w, 0, -0.45); set(armL.el, 0.2); set(armR.el, 0.2);
    set(torso, 0); M.body.position.y = Math.abs(Math.sin(t * 7)) * 0.08; M.head.rotation.set(0, 0, 0);
  } else if (name === 'roar') {
    const q = Math.sin(t * 22) * 0.04;
    set(legL.hip, 0, 0, -0.18); set(legR.hip, 0, 0, 0.18); set(legL.knee, 0); set(legR.knee, 0);
    set(armL.sh, 0.2, 0, 0.9 + q); set(armR.sh, 0.2, 0, -0.9 - q); set(armL.el, 1.0); set(armR.el, 1.0);
    set(torso, 0.18 + q); M.head.rotation.set(-0.35, 0, 0);
  } else if (name === 'scared') {
    set(legL.hip, 0.05); set(legR.hip, -0.05); set(legL.knee, -0.1); set(legR.knee, -0.1);
    const sh = Math.sin(t * 40) * 0.05;
    set(armL.sh, 1.2 + sh, 0, 0.5); set(armR.sh, 1.2 - sh, 0, -0.5); set(armL.el, 1.4); set(armR.el, 1.4);
    set(torso, 0.1); M.head.rotation.set(0, 0, 0);
  } else {                                                  // stand
    const br = Math.sin(t * 2.2) * 0.02;
    set(legL.hip, 0); set(legR.hip, 0); set(legL.knee, 0); set(legR.knee, 0);
    set(armL.sh, br, 0, 0.1); set(armR.sh, -br, 0, -0.1); set(armL.el, 0.12); set(armR.el, 0.12);
    set(torso, 0); M.head.rotation.set(0, 0, 0);
    M.body.position.y = br;
  }
  if (sumo && name !== 'slide' && name !== 'jump') {          // posa del sumo: gambe larghe e piegate, braccia larghe
    set(legL.hip, -0.1, 0, -0.45); set(legR.hip, -0.1, 0, 0.45); set(legL.knee, -0.35); set(legR.knee, -0.35);
    set(armL.sh, 0.2, 0, 0.7); set(armR.sh, 0.2, 0, -0.7);
    M.body.position.y = -0.08 + Math.abs(Math.sin(t * 5)) * 0.03;
  }
  if (hen) { M.henBody.rotation.set(0, 0, Math.sin(t * 14) * 0.05); M.body.position.y = Math.abs(Math.sin(t * 12)) * 0.05; if (M.henWing) M.henWing.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (0.35 + Math.abs(Math.sin(t * 16)) * 0.6); }); }
  if (k.lean) { M.root.rotation.z = -k.lean * 0.22; M.root.rotation.y = (M.yaw || 0) - k.lean * 0.38; }
}
