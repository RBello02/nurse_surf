// Il corridoio 3D: tronchi di 11 m riciclati all'infinito (ospedale e universita'), cancello dell'universita',
// parete con le tre porte per gli indovinelli e porta dell'Aula Magna per il finale.
import { THREE, lam, basic, std, mesh, box, rbox, cyl, sph, canvasTex, labelTex, clamp } from './util.js';

export const U = 11;            // metri per unita' di profondita' (come CFG: la corsa e' misurata in "profondita'")
export const SEG = U;           // un tronco = 1 unita'
export const HALF_W = 4.5;      // meta' larghezza del corridoio
export const H_CEIL = 5.2;
export const NSEG = 12;
export const LANES = [-2.4, 0, 2.4];

// ---------- texture ----------
function wallHospital() {
  return canvasTex(1024, 512, (c, W, H) => {
    const px = W / SEG, py = H / H_CEIL;               // pixel per metro
    const y = (m) => H - m * py;                         // quota in metri -> y canvas
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f4fafc'); g.addColorStop(1, '#d6eaf0');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#7fc4d0'; c.fillRect(0, y(1.25), W, 1.25 * py);                       // zoccolo azzurro
    c.fillStyle = '#5fb0c0'; c.fillRect(0, y(1.25), W, 6); c.fillStyle = '#3bb273'; c.fillRect(0, y(1.5), W, 10); c.fillStyle = '#3e7bd6'; c.fillRect(0, y(1.7), W, 7);
    c.fillStyle = '#c4ccd3'; c.fillRect(0, y(1.05), W, 12); c.fillStyle = '#eef2f4'; c.fillRect(0, y(1.05), W, 4);        // corrimano
    c.fillStyle = '#4a8f9c'; c.fillRect(0, y(0.18), W, 0.18 * py);
    const win = (x0) => { const w = 2.4 * px, x = x0 * px; c.fillStyle = '#ffffff'; c.fillRect(x - 8, y(3.9) - 8, w + 16, 2.1 * py + 16); const gg = c.createLinearGradient(0, y(3.9), 0, y(1.8)); gg.addColorStop(0, '#bfe6f7'); gg.addColorStop(1, '#8fd0ee'); c.fillStyle = gg; c.fillRect(x, y(3.9), w, 2.1 * py); c.fillStyle = '#ffffff'; c.fillRect(x + w / 2 - 4, y(3.9), 8, 2.1 * py); c.fillRect(x, y(2.85) - 4, w, 8); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(x + 10, y(1.85)); c.lineTo(x + 60, y(1.85)); c.lineTo(x + 130, y(3.85)); c.lineTo(x + 80, y(3.85)); c.fill(); };
    win(0.7); win(7.2);
    // porta
    const dx = 4.4 * px, dw = 1.9 * px; c.fillStyle = '#cfd8de'; c.fillRect(dx - 8, y(2.7), dw + 16, 2.7 * py); c.fillStyle = '#f4f8fa'; c.fillRect(dx, y(2.62), dw, 2.62 * py);
    c.fillStyle = '#8fd0ee'; c.fillRect(dx + dw * 0.3, y(2.2), dw * 0.4, 0.8 * py); c.fillStyle = '#c4ccd3'; c.fillRect(dx + dw * 0.82, y(1.2), 8, 0.22 * py);
    c.fillStyle = '#3e7bd6'; c.fillRect(dx, y(3.25), dw, 0.45 * py); c.fillStyle = '#fff'; c.font = '700 26px Arial'; c.textAlign = 'center'; c.fillText('REPARTO', dx + dw / 2, y(2.93));
    // croce rossa e cartelli
    c.fillStyle = '#fff'; c.fillRect(2.7 * px, y(3.5), 70, 70); c.fillStyle = '#e0344b'; c.fillRect(2.7 * px + 27, y(3.5) + 10, 16, 50); c.fillRect(2.7 * px + 10, y(3.5) + 27, 50, 16);
    c.fillStyle = '#fff'; c.fillRect(9.5 * px, y(3.6), 80, 100); c.fillStyle = '#3bb273'; c.fillRect(9.5 * px + 8, y(3.6) + 10, 64, 14); c.fillStyle = '#c4ccd3'; for (let i = 0; i < 5; i++) c.fillRect(9.5 * px + 8, y(3.6) + 34 + i * 12, 64, 6);
  });
}
function wallUni() {
  return canvasTex(1024, 512, (c, W, H) => {
    const px = W / SEG, py = H / H_CEIL, y = (m) => H - m * py;
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6ecd6'); g.addColorStop(1, '#e8d8b6'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#8a5a2b'; c.fillRect(0, y(1.5), W, 1.5 * py);                                       // boiserie in legno
    c.fillStyle = '#a06c36'; for (let i = 0; i < 8; i++) c.fillRect(i * (W / 8) + 6, y(1.4), W / 8 - 12, 1.2 * py);
    c.fillStyle = '#c9962a'; c.fillRect(0, y(1.55), W, 10);
    // librerie
    const shelf = (x0) => { const x = x0 * px, w = 2.6 * px; c.fillStyle = '#6b4a2e'; c.fillRect(x, y(4.3), w, 2.8 * py); c.fillStyle = '#3d2a18'; c.fillRect(x + 8, y(4.2), w - 16, 2.6 * py);
      for (let r = 0; r < 5; r++) { const yy = y(4.15) + r * 0.5 * py; c.fillStyle = '#6b4a2e'; c.fillRect(x + 8, yy + 0.46 * py, w - 16, 6); let xx = x + 12; const cols = ['#e0344b', '#3e7bd6', '#3bb273', '#ffd23f', '#8e5bd1', '#f28c28', '#f4efe0']; let i = r * 3; while (xx < x + w - 24) { const bw = 8 + ((i * 7) % 9), bh = 0.3 * py + ((i * 5) % 4) * 6; c.fillStyle = cols[i % 7]; c.fillRect(xx, yy + 0.46 * py - bh, bw, bh); xx += bw + 2; i++; } } };
    shelf(0.5); shelf(7.8);
    // bacheca con foglietti e finestra ad arco
    c.fillStyle = '#8a5a2b'; c.fillRect(4.3 * px - 8, y(3.7) - 8, 2.2 * px + 16, 1.6 * py + 16); c.fillStyle = '#c98f5a'; c.fillRect(4.3 * px, y(3.7), 2.2 * px, 1.6 * py);
    const pc = ['#fff', '#ffd23f', '#9bd8ee', '#f08fb0']; for (let i = 0; i < 6; i++) { c.fillStyle = pc[i % 4]; c.fillRect(4.3 * px + 12 + (i % 3) * 58, y(3.6) + 12 + ((i / 3) | 0) * 62, 46, 52); }
    c.fillStyle = '#fff'; c.fillRect(7.2 * px - 4, y(4.6) - 4, 0, 0);
  });
}
function floorTex(uni) {
  return canvasTex(512, 640, (c, W, H) => {                         // x: larghezza 9 m, y: lunghezza 11 m
    if (uni) { for (let i = 0; i < 14; i++) for (let j = 0; j < 24; j++) { const b = (i + j) % 2; c.fillStyle = b ? '#c79f62' : '#b98f52'; c.fillRect(i * (W / 14), j * (H / 24), W / 14, H / 24); c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(i * (W / 14), j * (H / 24), 1.5, H / 24); } }
    else { for (let i = 0; i < 9; i++) for (let j = 0; j < 11; j++) { c.fillStyle = (i + j) % 2 ? '#e9f1f3' : '#dce7ea'; c.fillRect(i * (W / 9), j * (H / 11), W / 9, H / 11); c.strokeStyle = '#c3d0d6'; c.lineWidth = 2; c.strokeRect(i * (W / 9), j * (H / 11), W / 9, H / 11); } }
    // corsie: due strisce tratteggiate
    c.fillStyle = uni ? 'rgba(160,32,54,0.5)' : 'rgba(62,123,214,0.35)';
    for (const m of [-1.2, 1.2]) for (let j = 0; j < 11; j++) c.fillRect((4.5 + m) / 9 * W - 3, j * (H / 11) + 10, 6, H / 11 * 0.55);
    if (uni) { c.fillStyle = 'rgba(176,36,58,0.35)'; c.fillRect(W * 0.2, 0, W * 0.6, H); }
    // pozze di luce sotto le lampade del soffitto
    for (const m of [2.75, 8.25]) { const gg = c.createRadialGradient(W / 2, m / 11 * H, 4, W / 2, m / 11 * H, 160); gg.addColorStop(0, 'rgba(255,250,225,0.55)'); gg.addColorStop(1, 'rgba(255,250,225,0)'); c.save(); c.translate(W / 2, m / 11 * H); c.scale(1, 0.8); c.translate(-W / 2, -m / 11 * H); c.fillStyle = gg; c.fillRect(0, m / 11 * H - 200, W, 400); c.restore(); }
  });
}
function ceilTex(uni) {
  return canvasTex(512, 640, (c, W, H) => {
    c.fillStyle = uni ? '#efe3c8' : '#f2f8fa'; c.fillRect(0, 0, W, H);
    c.strokeStyle = uni ? '#d9c9a4' : '#d6e2e6'; c.lineWidth = 3; for (let i = 0; i <= 9; i++) { c.beginPath(); c.moveTo(i * W / 9, 0); c.lineTo(i * W / 9, H); c.stroke(); }
    for (const m of [2.75, 8.25]) { const y = m / 11 * H; c.fillStyle = uni ? '#ffe4a8' : '#ffffff'; c.fillRect(W * 0.3, y - 38, W * 0.4, 76); c.fillStyle = uni ? '#fff3cf' : '#fffbe0'; c.fillRect(W * 0.33, y - 30, W * 0.34, 60); const gg = c.createRadialGradient(W / 2, y, 5, W / 2, y, 140); gg.addColorStop(0, 'rgba(255,255,230,0.5)'); gg.addColorStop(1, 'rgba(255,255,230,0)'); c.fillStyle = gg; c.fillRect(0, y - 150, W, 300); }
  });
}

export function buildWorld(scene) {
  const themes = {
    hospital: { wall: new THREE.MeshLambertMaterial({ map: wallHospital() }), floor: new THREE.MeshLambertMaterial({ map: floorTex(false) }), ceil: new THREE.MeshBasicMaterial({ map: ceilTex(false) }), fog: 0xdff2f6 },
    uni: { wall: new THREE.MeshLambertMaterial({ map: wallUni() }), floor: new THREE.MeshLambertMaterial({ map: floorTex(true) }), ceil: new THREE.MeshBasicMaterial({ map: ceilTex(true) }), fog: 0xf2e6cc }
  };
  const root = new THREE.Group(); scene.add(root);
  const segs = [];
  const planeGeo = new THREE.PlaneGeometry(HALF_W * 2, SEG), wallGeo = new THREE.PlaneGeometry(SEG, H_CEIL);
  for (let i = 0; i < NSEG; i++) {
    const g = new THREE.Group();
    const floor = mesh(planeGeo, themes.hospital.floor); floor.rotation.x = -Math.PI / 2; g.add(floor);
    const ceil = mesh(planeGeo, themes.hospital.ceil, 0, H_CEIL, 0); ceil.rotation.x = Math.PI / 2; g.add(ceil);
    const wl = mesh(wallGeo, themes.hospital.wall, -HALF_W, H_CEIL / 2, 0); wl.rotation.y = Math.PI / 2; g.add(wl);
    const wr = mesh(wallGeo, themes.hospital.wall, HALF_W, H_CEIL / 2, 0); wr.rotation.y = -Math.PI / 2; g.add(wr);
    root.add(g); segs.push({ g, floor, ceil, wl, wr, theme: 'hospital', idx: -999 });
  }
  const W = { root, segs, themes, gateIdx: Infinity, objects: [] };
  W.themeAt = (k) => (k >= W.gateIdx ? 'uni' : 'hospital');
  W.update = (T) => {
    const k0 = Math.floor(T) - 1;
    for (let k = k0; k < k0 + NSEG; k++) {
      const s = segs[((k % NSEG) + NSEG) % NSEG], th = W.themeAt(k);
      if (s.idx !== k) { s.idx = k; if (s.theme !== th) { s.theme = th; s.floor.material = themes[th].floor; s.ceil.material = themes[th].ceil; s.wl.material = s.wr.material = themes[th].wall; } }
      s.g.position.z = -(k + 0.5 - T) * U;
    }
    for (const o of W.objects) o.update && o.update(T);
  };
  // oggetti ancorati alla profondita' (cancello, parete delle porte, porta del finale): vengono posti a depth*U davanti
  W.anchor = (obj, depth) => { obj.userData.depth = depth; root.add(obj); W.objects.push({ obj, update: (T) => { obj.position.z = -(depth - T) * U; } }); return obj; };
  W.remove = (obj) => { root.remove(obj); W.objects = W.objects.filter((o) => o.obj !== obj); };

  W.makeGate = (text) => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) { g.add(box(0.5, H_CEIL, 0.5, lam(0x1f3a7a), s * (HALF_W - 0.25), H_CEIL / 2, 0)); g.add(box(0.2, H_CEIL, 0.52, lam(0xf6c344), s * (HALF_W - 0.5), H_CEIL / 2, 0)); }
    g.add(box(HALF_W * 2, 1.4, 0.6, lam(0x1f3a7a), 0, H_CEIL - 0.7, 0));
    const t = labelTex(text, '#1f3a7a', '#fff3b0', 1024, 200);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 1.7, 1.15), new THREE.MeshBasicMaterial({ map: t })); f.position.set(0, H_CEIL - 0.7, 0.31); g.add(f);
    const f2 = f.clone(); f2.position.z = -0.31; f2.rotation.y = Math.PI; g.add(f2);
    return g;
  };
  // parete con tre porte: posizioni x = -2.9, 0, 2.9
  W.makeDoorWall = (doors, labels) => {
    const g = new THREE.Group(); g.userData.doors = [];
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xf0e4c8 });
    g.add(box(HALF_W * 2, H_CEIL, 0.3, wallMat, 0, H_CEIL / 2, 0));
    g.add(box(HALF_W * 2, 0.9, 0.34, lam(0x8a5a2b), 0, 0.45, 0));
    const cols = { A: 0x2fb5a3, B: 0x8e5bd1, C: 0xe0a82a };
    doors.forEach((d, i) => {
      const x = [-2.9, 0, 2.9][i];
      const frame = box(2.1, 3.3, 0.36, lam(0x4a2f1a), x, 1.65, 0); g.add(frame);
      const hinge = new THREE.Group(); hinge.position.set(x - 0.95, 0, 0.2); g.add(hinge);
      const col = cols[d.kind] || 0x3e7bd6;
      const leaf = box(1.9, 3.1, 0.12, lam(col), 0.95, 1.55, 0); hinge.add(leaf);
      const lt = canvasTex(256, 384, (c) => { const gr = c.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, shade(col)); gr.addColorStop(1, '#' + col.toString(16).padStart(6, '0')); c.fillStyle = gr; c.fillRect(0, 0, 256, 384); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 6; c.strokeRect(14, 14, 228, 356); c.fillStyle = '#10151f'; c.font = '900 250px Arial Black'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.kind.length === 1 ? d.kind : '?', 128, 200); });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.55), new THREE.MeshBasicMaterial({ map: lt })); face.position.set(0.95, 1.55, 0.07); hinge.add(face);
      g.add(box(0.12, 0.12, 0.1, std(0xf6c344, 0.3, 0.8), x + 0.65, 1.5, 0.4));
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.62), new THREE.MeshBasicMaterial({ map: labelTex(labels[i], '#fff3b0', '#10151f', 512, 150, 'rgba(255,255,255,0.0)') })); sign.position.set(x, 3.85, 0.2); g.add(sign);
      g.userData.doors.push({ hinge, x, leaf, face, frame });
    });
    return g;
  };
  W.makeFinaleDoor = (text) => {
    const g = new THREE.Group(); g.userData.leaves = [];
    g.add(box(HALF_W * 2, H_CEIL, 0.4, lam(0x7d1527), 0, H_CEIL / 2, 0.15));
    g.add(box(5.4, 4.2, 0.3, lam(0xc9962a), 0, 2.1, 0));
    for (const s of [-1, 1]) { const hinge = new THREE.Group(); hinge.position.set(s * 2.5, 0, 0.1); g.add(hinge); const leaf = box(2.5, 4.0, 0.14, lam(0x8a5a2b), -s * 1.25, 2.0, 0); hinge.add(leaf); hinge.add(box(0.15, 0.15, 0.1, std(0xf6c344, 0.3, 0.8), -s * 2.3, 2.0, -0.1)); g.userData.leaves.push({ hinge, s }); }
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), new THREE.MeshBasicMaterial({ color: 0xfff7d6 })); glow.position.set(0, 2, -0.2); g.add(glow);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.9), new THREE.MeshBasicMaterial({ map: labelTex(text, '#1f3a7a', '#fff3b0', 1024, 160) })); f.position.set(0, 4.7, 0.36); g.add(f);
    return g;
  };
  W.setFog = (scene, uni, k) => { const a = new THREE.Color(themes.hospital.fog), b = new THREE.Color(themes.uni.fog); a.lerp(b, k); scene.fog.color.copy(a); scene.background.copy(a); };
  return W;
}

function shade(col) { const r = Math.min(255, ((col >> 16) & 255) + 50), g = Math.min(255, ((col >> 8) & 255) + 50), b = Math.min(255, (col & 255) + 50); return `rgb(${r},${g},${b})`; }
