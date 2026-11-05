// Utilita' comuni per la versione 3D: materiali, forme e texture disegnate al volo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export { THREE, RoundedBoxGeometry };

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[(Math.random() * a.length) | 0];

export const lam = (color, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color }, o));
export const std = (color, rough = 0.5, metal = 0, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, o));
export const basic = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, o));

export function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}
export const box = (w, h, d, mat, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
export const rbox = (w, h, d, r, mat, x = 0, y = 0, z = 0) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), mat, x, y, z);
export const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 16) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
export function sph(r, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 20) {
  const m = mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg >> 1)), mat, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}

export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// pannello con testo (cartelli, etichette): fondo colorato, bordo chiaro, scritta con contorno
export function labelTex(text, bg, fg = '#ffffff', w = 512, h = 160, dark = 'rgba(0,0,0,0.4)') {
  return canvasTex(w, h, (c) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, shade(bg, 0.25)); g.addColorStop(0.5, bg); g.addColorStop(1, shade(bg, -0.25));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12);
    let fs = h * 0.56;
    c.font = `900 ${fs}px "Arial Black", Impact, system-ui, sans-serif`;
    while (c.measureText(text).width > w - 50 && fs > 14) { fs -= 4; c.font = `900 ${fs}px "Arial Black", Impact, system-ui, sans-serif`; }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = fs * 0.14; c.strokeStyle = dark; c.lineJoin = 'round';
    c.strokeText(text, w / 2, h / 2 + 3); c.fillStyle = fg; c.fillText(text, w / 2, h / 2 + 3);
  });
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => clamp(Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)), 0, 255);
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// ombra morbida a terra (disco sfumato)
let shadowTex = null;
export function blobShadow(size = 1.2, opacity = 0.35) {
  if (!shadowTex) shadowTex = canvasTex(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.6, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1;
  return m;
}
