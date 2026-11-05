// Ostacoli e medagliette in 3D. Stessi tre tipi del gioco 2D: 'jump' (bassi: si salta), 'slide' (appesi: si scivola),
// 'block' (alti: si cambia corsia). Misure in metri; ogni corsia e' larga ~2.4.
import { THREE, lam, std, basic, mesh, box, rbox, cyl, sph, canvasTex, labelTex, blobShadow, shade } from './util.js';

const M = {};
const mat = (c, o) => { const k = c + JSON.stringify(o || {}); return M[k] || (M[k] = lam(c, o)); };
const SKIN = 0xf2c9a5;

const SIGNS = {
  rx: ['RADIO', '#3e7bd6'], lab: ['LAB', '#3bb273'], cardio: ['CARDIO', '#e0344b'], pedia: ['PEDIA', '#8e5bd1'],
  u_aula: ['AULA 3', '#1f3a7a'], u_bib: ['BIBLIO', '#3bb273'], u_esami: ['ESAMI', '#e0344b'], u_lez: ['LEZIONE', '#8e5bd1']
};
const texCache = {};
const tex = (k, fn) => texCache[k] || (texCache[k] = fn());

function wheel(r = 0.1) { const g = new THREE.Group(); const t = mesh(new THREE.CylinderGeometry(r, r, 0.06, 14), mat(0x2c333d)); t.rotation.z = Math.PI / 2; g.add(t); const h = mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.07, 10), mat(0x9aa5af)); h.rotation.z = Math.PI / 2; g.add(h); return g; }
function person(skin, shirt, o = {}) {                       // busto + testa con faccina (pazienti, professore)
  const g = new THREE.Group();
  g.add(rbox(0.5, 0.55, 0.3, 0.12, mat(shirt), 0, 0.28, 0));
  g.add(sph(0.17, mat(skin), 0, 0.72, 0, 1, 1.05, 1));
  if (o.hair !== false) g.add(sph(0.18, mat(o.hair || 0x6b5a4a), 0, 0.78, 0.03, 1, 0.8, 1));
  for (const s of [-1, 1]) { g.add(sph(0.03, mat(0x111111), s * 0.06, 0.74, -0.15, 1, o.sleep ? 0.2 : 1, 0.5)); }
  g.add(box(0.08, 0.015, 0.01, mat(0xb9524f), 0, 0.65, -0.165));
  return g;
}

const BUILD = {
  wetsign() { const g = new THREE.Group(), m = mat(0xffd23f);
    for (const s of [-1, 1]) { const p = box(0.7, 0.95, 0.05, m, 0, 0.47, s * 0.2); p.rotation.x = s * 0.28; g.add(p); }
    const t = tex('wet', () => canvasTex(128, 128, (c) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#10151f'; c.font = '900 90px Arial Black'; c.textAlign = 'center'; c.fillText('!', 64, 100); c.beginPath(); c.moveTo(64, 14); c.lineTo(116, 112); c.lineTo(12, 112); c.closePath(); c.lineWidth = 6; c.strokeStyle = '#10151f'; c.stroke(); }));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshLambertMaterial({ map: t })); f.position.set(0, 0.55, -0.24); f.rotation.x = -0.28; g.add(f);
    g.add(cyl(0.7, 0.7, 0.01, mat(0x6ec6ff, { transparent: true, opacity: 0.55 }), 0, 0.01, 0, 20)); return g; },
  bucket() { const g = new THREE.Group();
    g.add(cyl(0.34, 0.27, 0.55, mat(0x3e7bd6), 0, 0.28, 0)); g.add(cyl(0.355, 0.355, 0.05, mat(0x27559c), 0, 0.56, 0));
    const st = cyl(0.03, 0.03, 1.4, mat(0xc9962a), 0.12, 0.8, 0); st.rotation.z = -0.22; g.add(st);
    g.add(sph(0.2, mat(0xf4f8fa), 0.4, 1.35, 0, 1, 0.8, 1)); g.add(sph(0.16, mat(0xe8eef2), -0.0, 0.62, 0, 1.4, 0.35, 1.4)); return g; },
  boxes() { const g = new THREE.Group(), c = [0xc79a63, 0xb98850, 0xd2a870];
    [[-0.3, 0, 0.8, 0.5, 0.6], [0.35, 0, 0.7, 0.5, 0.55], [0, 0.55, 0.7, 0.5, 0.5]].forEach(([x, y, w, h, d], i) => {
      g.add(rbox(w, h, d, 0.03, mat(c[i % 3]), x, y + h / 2, 0)); g.add(box(w * 0.18, 0.01, d + 0.01, mat(0xe8d9b5), x, y + h + 0.005, 0)); });
    g.add(box(0.5, 0.18, 0.02, mat(0xffffff), 0.35, 0.28, -0.29)); return g; },
  barrier() { const g = new THREE.Group();
    const t = tex('stripe', () => canvasTex(128, 32, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 32); c.fillStyle = '#e0344b'; for (let i = -2; i < 8; i++) { c.beginPath(); c.moveTo(i * 22, 32); c.lineTo(i * 22 + 12, 32); c.lineTo(i * 22 + 28, 0); c.lineTo(i * 22 + 16, 0); c.fill(); } }));
    const m = new THREE.MeshLambertMaterial({ map: t });
    for (const y of [0.55, 0.85]) g.add(box(1.7, 0.22, 0.06, m, 0, y, 0));
    for (const x of [-0.75, 0.75]) { g.add(box(0.08, 1.0, 0.08, mat(0x8c97a1), x, 0.5, 0)); g.add(box(0.08, 0.06, 0.5, mat(0x5b6670), x, 0.03, 0)); }
    g.add(sph(0.07, mat(0xffd23f), -0.75, 1.03, 0)); return g; },
  gurney(variant) { const g = new THREE.Group();
    g.add(box(0.95, 0.07, 2.0, std(0x9aa5af, 0.4, 0.5), 0, 0.55, 0));
    g.add(rbox(0.86, 0.14, 1.9, 0.06, mat(0xf4f8fa), 0, 0.66, 0));
    for (const [x, z] of [[-0.35, -0.8], [0.35, -0.8], [-0.35, 0.8], [0.35, 0.8]]) { g.add(box(0.05, 0.4, 0.05, mat(0x8c97a1), x, 0.32, z)); const w = wheel(0.1); w.position.set(x, 0.1, z); g.add(w); }
    const pa = person(SKIN, variant ? 0x6ec6ff : 0xf08fb0, { sleep: true, hair: variant ? 0x3a2a1a : 0xc9a86a }); pa.rotation.x = -1.45; pa.position.set(0, 0.88, 0.55); g.add(pa);
    g.add(rbox(0.8, 0.2, 1.1, 0.08, mat(variant ? 0x3bb273 : 0xe0344b), 0, 0.86, 0.45));                   // coperta
    g.add(rbox(0.5, 0.12, 0.35, 0.05, mat(0xffffff), 0, 0.78, -0.2));                                          // cuscino
    g.add(box(0.9, 0.8, 0.07, mat(0xcfd8de), 0, 1.0, -1.0));                                                   // testiera alta
    const ivx = 0.5; g.add(cyl(0.025, 0.025, 2.1, std(0xc4ccd3, 0.3, 0.7), ivx, 1.05, -0.7));
    g.add(box(0.3, 0.03, 0.03, std(0xc4ccd3, 0.3, 0.7), ivx - 0.1, 2.08, -0.7)); g.add(sph(0.13, mat(0xcfeaff, { transparent: true, opacity: 0.85 }), ivx - 0.22, 1.9, -0.7, 0.8, 1.3, 0.8));
    return g; },
  wheelchair() { const g = new THREE.Group();
    g.add(rbox(0.6, 0.08, 0.6, 0.03, mat(0x2c333d), 0, 0.55, 0)); g.add(rbox(0.6, 0.75, 0.07, 0.03, mat(0x2c333d), 0, 0.95, 0.3));
    for (const s of [-1, 1]) { const w = wheel(0.38); w.position.set(s * 0.38, 0.38, 0.15); g.add(w); const sw = wheel(0.1); sw.position.set(s * 0.26, 0.1, -0.35); g.add(sw); g.add(box(0.04, 0.04, 0.5, mat(0x8c97a1), s * 0.3, 0.7, 0.0)); }
    const p = person(SKIN, 0x8e5bd1, { hair: 0xcfcfcf }); p.position.set(0, 0.6, 0.1); g.add(p);
    g.add(cyl(0.025, 0.025, 2.1, std(0xc4ccd3, 0.3, 0.7), -0.4, 1.05, 0.35)); g.add(sph(0.12, mat(0xcfeaff, { transparent: true, opacity: 0.85 }), -0.52, 1.9, 0.35, 0.8, 1.3, 0.8));
    return g; },
  cart() { const g = new THREE.Group(), steel = std(0xc4ccd3, 0.35, 0.6);
    for (const [x, z] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) { g.add(box(0.05, 1.9, 0.05, steel, x, 0.95, z)); const w = wheel(0.08); w.position.set(x, 0.08, z); g.add(w); }
    [0.3, 0.9, 1.5].forEach((y, i) => { g.add(box(1.05, 0.05, 0.85, steel, 0, y, 0)); });
    g.add(rbox(0.8, 0.28, 0.6, 0.05, mat(0xf4f8fa), 0, 0.47, 0)); g.add(rbox(0.8, 0.28, 0.6, 0.05, mat(0x6ec6ff), 0, 0.77 - 0.02, 0));
    g.add(rbox(0.5, 0.32, 0.5, 0.05, mat(0xe0344b), -0.2, 1.1, 0)); g.add(rbox(0.4, 0.3, 0.5, 0.05, mat(0x3bb273), 0.28, 1.08, 0));
    g.add(rbox(0.9, 0.3, 0.6, 0.05, mat(0xf0e6d0), 0, 1.68, 0)); g.add(box(0.85, 0.02, 0.02, mat(0xe0344b), 0, 1.68, -0.31)); return g; },
  vending() { const g = new THREE.Group();
    g.add(rbox(1.15, 2.15, 0.85, 0.06, mat(0xc32b44), 0, 1.07, 0));
    const t = tex('vend', () => canvasTex(256, 512, (c) => { c.fillStyle = '#c32b44'; c.fillRect(0, 0, 256, 512); c.fillStyle = '#ffd23f'; c.fillRect(14, 12, 228, 58); c.fillStyle = '#10151f'; c.font = '900 44px Arial Black'; c.textAlign = 'center'; c.fillText('SNACK', 128, 56); c.fillStyle = '#cfeaff'; c.fillRect(20, 90, 170, 330);
      const cols = ['#e0344b', '#ffd23f', '#3bb273', '#3e7bd6', '#f28c28']; for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) { c.fillStyle = cols[(r + i) % 5]; c.fillRect(30 + i * 40, 104 + r * 62, 28, 44); } c.fillStyle = '#2c333d'; c.fillRect(200, 100, 40, 200); c.fillStyle = '#10151f'; c.fillRect(30, 440, 190, 44); }));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.0), new THREE.MeshLambertMaterial({ map: t })); f.position.set(0, 1.07, -0.431); g.add(f); return g; },
  // ---- universita' ----
  books() { const g = new THREE.Group(), cols = [0xe0344b, 0x3e7bd6, 0x3bb273, 0xffd23f, 0x8e5bd1, 0xf28c28];
    for (let i = 0; i < 6; i++) { const w = 0.9 - (i % 2) * 0.1, y = 0.13 + i * 0.15; const b = rbox(w, 0.14, 0.6, 0.03, mat(cols[i]), (i % 3 - 1) * 0.08, y, 0); b.rotation.y = (i - 2.5) * 0.09; g.add(b); g.add(box(w - 0.04, 0.1, 0.01, mat(0xf4efe0), (i % 3 - 1) * 0.08, y, -0.29)); } return g; },
  backpacks() { const g = new THREE.Group();
    [[-0.38, 0x3e7bd6], [0.38, 0xe0344b]].forEach(([x, c], i) => { g.add(rbox(0.65, 0.85, 0.4, 0.14, mat(c), x, 0.43, 0)); g.add(rbox(0.5, 0.4, 0.12, 0.05, mat(shadeHex(c)), x, 0.3, -0.24)); g.add(box(0.06, 0.6, 0.02, mat(0x222222), x - 0.2, 0.5, -0.21)); g.add(box(0.06, 0.6, 0.02, mat(0x222222), x + 0.2, 0.5, -0.21)); g.add(box(0.2, 0.02, 0.02, mat(0xffd23f), x, 0.88, 0)); }); return g; },
  papers() { const g = new THREE.Group();
    for (let i = 0; i < 4; i++) { const b = rbox(0.9, 0.2, 0.62, 0.02, mat(0xffffff), (i % 2 - 0.5) * 0.12, 0.1 + i * 0.21, 0); b.rotation.y = (i - 1.5) * 0.12; g.add(b); g.add(box(0.7, 0.01, 0.5, mat(0xe4e8ec), 0, 0.1 + i * 0.21, 0).rotateY((i - 1.5) * 0.12)); }
    g.add(box(0.28, 0.02, 0.2, mat(0xe0344b), 0.15, 0.9, 0)); return g; },
  prof() { const g = new THREE.Group();
    g.add(cyl(0.12, 0.1, 0.9, mat(0x39414d), -0.14, 0.45, 0)); g.add(cyl(0.12, 0.1, 0.9, mat(0x39414d), 0.14, 0.45, 0));
    const p = person(0xe8c4a0, 0x4b5563, { hair: 0xcfcfcf }); p.position.y = 0.88; p.scale.setScalar(1.35); g.add(p);
    g.add(box(0.08, 0.5, 0.02, mat(0xe0344b), 0, 1.5, -0.2));
    const t = tex('grade', () => canvasTex(256, 192, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 256, 192); c.strokeStyle = '#1f3a7a'; c.lineWidth = 8; c.strokeRect(4, 4, 248, 184); c.fillStyle = '#e0344b'; c.font = '900 130px Arial Black'; c.textAlign = 'center'; c.fillText('18', 128, 140); }));
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshLambertMaterial({ map: t })); b.position.set(0.55, 1.45, -0.2); g.add(b); g.add(box(0.03, 0.03, 0.5, mat(SKIN), 0.45, 1.3, -0.1));
    return g; },
  bookshelf() { const g = new THREE.Group(), cols = [0xe0344b, 0x3e7bd6, 0x3bb273, 0xffd23f, 0x8e5bd1, 0xf28c28, 0x6b4a2e];
    g.add(rbox(1.2, 2.3, 0.5, 0.03, mat(0x6b4a2e), 0, 1.15, 0.05));
    for (let r = 0; r < 5; r++) { const y = 0.25 + r * 0.45; g.add(box(1.1, 0.04, 0.46, mat(0x4a3220), 0, y - 0.2, -0.02)); let x = -0.5; for (let i = 0; i < 12 && x < 0.5; i++) { const w = 0.05 + ((i * 7 + r * 3) % 5) * 0.012, h = 0.28 + ((i * 5 + r) % 4) * 0.04; g.add(box(w, h, 0.34, mat(cols[(i + r) % 7]), x + w / 2, y - 0.17 + h / 2, -0.07)); x += w + 0.01; } }
    return g; },
  whiteboard() { const g = new THREE.Group();
    const t = tex('wb', () => canvasTex(512, 320, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 512, 320); c.strokeStyle = '#c4ccd3'; c.lineWidth = 10; c.strokeRect(5, 5, 502, 310); c.fillStyle = '#1f3a7a'; c.font = '700 52px Arial'; c.fillText('E = mc²', 40, 90); c.fillStyle = '#e0344b'; c.fillText('ESAME', 40, 170); c.strokeStyle = '#3bb273'; c.lineWidth = 8; c.beginPath(); c.moveTo(250, 250); c.bezierCurveTo(300, 150, 360, 300, 470, 190); c.stroke(); }));
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.2), new THREE.MeshLambertMaterial({ map: t })); b.position.set(0, 1.45, -0.04); g.add(b);
    g.add(box(2.0, 1.3, 0.06, mat(0x8c97a1), 0, 1.45, 0.0)); for (const x of [-0.8, 0.8]) { g.add(box(0.06, 0.9, 0.06, mat(0x6b747d), x, 0.45, 0.02)); g.add(box(0.1, 0.05, 0.6, mat(0x5b6670), x, 0.03, 0)); } return g; },
  sign(key) { const g = new THREE.Group(); const [text, col] = SIGNS[key];
    const lt = tex('sg' + key, () => labelTex(text, col, '#ffffff', 512, 160));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.69), new THREE.MeshLambertMaterial({ map: lt })); f.position.set(0, 1.5, 0.06); g.add(f);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.69), new THREE.MeshLambertMaterial({ map: lt })); b.position.set(0, 1.5, -0.06); b.rotation.y = Math.PI; g.add(b);
    g.add(box(2.2, 0.69, 0.1, mat(0x1d2b3a), 0, 1.5, 0));
    const ar = tex('arrows', () => canvasTex(512, 96, (c) => { c.fillStyle = '#1d2b3a'; c.fillRect(0, 0, 512, 96); c.fillStyle = '#ffd23f'; for (const x of [90, 256, 422]) { c.beginPath(); c.moveTo(x - 50, 20); c.lineTo(x + 50, 20); c.lineTo(x, 80); c.closePath(); c.fill(); } }));
    const a = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.4), new THREE.MeshLambertMaterial({ map: ar })); a.position.set(0, 1.0, 0.06); g.add(a);
    const a2 = a.clone(); a2.position.z = -0.06; a2.rotation.y = Math.PI; g.add(a2); g.add(box(2.2, 0.4, 0.1, mat(0x1d2b3a), 0, 1.0, 0));
    for (const x of [-0.95, 0.95]) g.add(cyl(0.02, 0.02, 3.4, std(0x9aa5af, 0.3, 0.8), x, 3.55, 0));
    return g; }
};
function shadeHex(c) { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return ((r * 0.75) << 16) | ((g * 0.75) << 8) | (b * 0.75) | 0; }

const DEFS = {
  wetsign: ['jump', 0.6], bucket: ['jump', 0.7], boxes: ['jump', 0.8], barrier: ['jump', 0.5], books: ['jump', 0.7], backpacks: ['jump', 0.6], papers: ['jump', 0.7],
  gurney1: ['block', 2.0], gurney2: ['block', 2.0], wheelchair: ['block', 1.0], cart: ['block', 1.0], vending: ['block', 0.9], prof: ['block', 0.8], bookshelf: ['block', 0.6], whiteboard: ['block', 0.3],
  rx: ['slide', 0.4], lab: ['slide', 0.4], cardio: ['slide', 0.4], pedia: ['slide', 0.4], u_aula: ['slide', 0.4], u_bib: ['slide', 0.4], u_esami: ['slide', 0.4], u_lez: ['slide', 0.4]
};

export function makeProp(type) {
  const [kind, len] = DEFS[type];
  let g;
  if (type === 'gurney1') g = BUILD.gurney(0); else if (type === 'gurney2') g = BUILD.gurney(1);
  else if (kind === 'slide') g = BUILD.sign(type); else g = BUILD[type]();
  const root = new THREE.Group(); root.add(g);
  if (kind !== 'slide') { const sh = blobShadow(2.0, 0.3); root.add(sh); }
  if (kind === 'slide') g.position.y = 0;
  return { root, kind, len, type, clear: 1.2 };
}

// ---- medaglietta CFU ----
let medalMats = null;
export function makeMedal() {
  if (!medalMats) {
    const face = canvasTex(128, 128, (c) => { const g = c.createRadialGradient(50, 46, 6, 64, 64, 62); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.5, '#f6c344'); g.addColorStop(1, '#b57d12'); c.fillStyle = g; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.strokeStyle = '#c9962a'; c.lineWidth = 8; c.beginPath(); c.arc(64, 64, 50, 0, 7); c.stroke(); c.fillStyle = '#7a4a0a'; c.font = '900 40px Arial Black'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CFU', 64, 68); });
    medalMats = { face: new THREE.MeshStandardMaterial({ map: face, roughness: 0.3, metalness: 0.6, emissive: 0x553300, emissiveIntensity: 0.4 }), edge: std(0xc9962a, 0.3, 0.7), red: lam(0xe0344b), blue: lam(0x3e7bd6) };
  }
  const g = new THREE.Group();
  const d = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 28), [medalMats.edge, medalMats.face, medalMats.face]); d.rotation.x = Math.PI / 2; g.add(d);
  const r1 = box(0.12, 0.34, 0.03, medalMats.red, -0.09, 0.45, 0); r1.rotation.z = 0.35; const r2 = box(0.12, 0.34, 0.03, medalMats.blue, 0.09, 0.45, 0); r2.rotation.z = -0.35; g.add(r1, r2);
  const holder = new THREE.Group(); holder.add(g); g.position.y = 0;
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe27a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(1.3); holder.add(gl);
  return { root: holder, spin: g };
}
let glowT = null;
export function glowTex() { return glowT || (glowT = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); })); }

// ---- icona "cosa devo fare" sopra l'ostacolo ----
const hintTex = {};
export function makeHint(kind) {
  const col = { jump: '#ffd23f', slide: '#5ad1ff', block: '#ff5470' }[kind];
  const t = hintTex[kind] || (hintTex[kind] = canvasTex(128, 128, (c) => {
    c.fillStyle = 'rgba(16,21,31,0.55)'; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = col; c.stroke();
    c.fillStyle = col; c.translate(64, 64);
    if (kind === 'jump') { c.beginPath(); c.moveTo(0, -34); c.lineTo(32, 0); c.lineTo(12, 0); c.lineTo(12, 32); c.lineTo(-12, 32); c.lineTo(-12, 0); c.lineTo(-32, 0); c.closePath(); c.fill(); }
    else if (kind === 'slide') { c.beginPath(); c.moveTo(0, 34); c.lineTo(32, 0); c.lineTo(12, 0); c.lineTo(12, -32); c.lineTo(-12, -32); c.lineTo(-12, 0); c.lineTo(-32, 0); c.closePath(); c.fill(); }
    else { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 38, 0); c.lineTo(s * 8, -26); c.lineTo(s * 8, -10); c.lineTo(s * -2, -10); c.lineTo(s * -2, 10); c.lineTo(s * 8, 10); c.lineTo(s * 8, 26); c.closePath(); c.fill(); } }
  }));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  s.scale.setScalar(0.8); s.renderOrder = 10;
  return s;
}
