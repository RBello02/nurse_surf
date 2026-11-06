// Volto di Martina "dipinto" su una texture (occhi a mandorla castani, sopracciglia ad arco, naso, labbra rosate,
// guance): molto piu' fedele di un insieme di sfere. Ogni espressione e' una texture, con la versione a occhi chiusi.
import { THREE, canvasTex } from './util.js';

const STYLES = {
  martina: { skin: '#f2c9a5', skinDk: '#d9a27c', brow: '#4b3020', iris: ['#2e1a0c', '#8a5a2c'], lip: '#c9807f', lipLo: '#d9928e', liner: '#24140c', blush: '235,125,115', shadow: '150,100,80' },
  hulk:    { skin: '#62c24c', skinDk: '#3f8f33', brow: '#1f3a1a', iris: ['#1a2a10', '#7fb040'], lip: '#3f8f3a', lipLo: '#4aa044', liner: '#10200c', blush: '120,200,90', shadow: '30,90,30' },
  nurse:   { skin: '#f0c6a3', skinDk: '#d49f7a', brow: '#3a2418', iris: ['#1c2c3a', '#5a8fb0'], lip: '#d8737a', lipLo: '#e68a8c', liner: '#20140c', blush: '240,130,125', shadow: '160,100,90' }
};
const cx = (x) => 256 + x * 1280, cy = (y) => 256 - y * 1113;

function paint(c, expr, blink, S) {
  c.fillStyle = S.skin; c.fillRect(0, 0, 512, 512);
  // modellato: centro luminoso, bordi piu' scuri (zigomi e mascella)
  let g = c.createRadialGradient(256, 262, 30, 256, 256, 230); g.addColorStop(0, 'rgba(255,240,225,0.18)'); g.addColorStop(0.7, 'rgba(255,240,225,0)'); g.addColorStop(1, 'rgba(120,60,30,0.1)');
  c.fillStyle = g; c.fillRect(0, 0, 512, 512);
  c.save(); c.translate(256, 256); c.scale(1.2, 1.2); c.translate(-256, -256 + 14);       // tratti piu' grandi e un po' piu' in basso: viso da cartone
  const angry = expr === 'angry' || expr === 'hen', scared = expr === 'scared', worried = expr === 'worried', shout = expr === 'shout';
  // guance
  for (const s of [-1, 1]) { g = c.createRadialGradient(cx(s * 0.095), cy(-0.045), 2, cx(s * 0.095), cy(-0.045), 46); g.addColorStop(0, `rgba(${S.blush},0.42)`); g.addColorStop(1, `rgba(${S.blush},0)`); c.fillStyle = g; c.fillRect(cx(s * 0.095) - 50, cy(-0.045) - 50, 100, 100); }
  // naso: ombre laterali, narici, punta luminosa
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    c.fillStyle = 'rgba(100,50,40,0.55)'; c.beginPath(); c.ellipse(cx(s * 0.0105), cy(-0.044), 8, 4.2, s * 0.35, 0, 7); c.fill();
    c.fillStyle = `rgba(${S.shadow},0.14)`; c.beginPath(); c.ellipse(cx(s * 0.017), cy(-0.04), 9, 6, 0, 0, 7); c.fill();
  }
  g = c.createRadialGradient(cx(0), cy(-0.032), 1, cx(0), cy(-0.032), 18); g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(cx(0) - 20, cy(-0.032) - 20, 40, 40);
  
  // occhi a mandorla: angolo esterno leggermente piu' alto
  const open = blink ? 0.04 : scared ? 1.3 : angry ? 0.82 : worried ? 0.95 : shout ? 1.1 : 1;
  for (const s of [-1, 1]) {
    const ex = s * 0.07, ey = 0.02, H = 0.0125 * open;
    const ix = cx(s * 0.037), iy = cy(ey - 0.001), ox = cx(s * 0.103), oy = cy(ey + 0.005);
    const top = (px, py) => [px, py];
    const path = () => {
      c.beginPath(); c.moveTo(ix, iy);
      c.bezierCurveTo(cx(s * 0.05), cy(ey + 0.0015 + H * 2.1), cx(s * 0.088), cy(ey + 0.005 + H * 2.0), ox, oy);
      c.bezierCurveTo(cx(s * 0.09), cy(ey + 0.003 - H * 1.2), cx(s * 0.052), cy(ey - 0.0025 - H * 1.3), ix, iy); c.closePath();
    };
    // ombretto morbido e piega della palpebra
    g = c.createRadialGradient(cx(ex), cy(ey + 0.016), 2, cx(ex), cy(ey + 0.016), 52); g.addColorStop(0, `rgba(${S.shadow},0.26)`); g.addColorStop(1, `rgba(${S.shadow},0)`); c.fillStyle = g; c.fillRect(cx(ex) - 60, cy(ey + 0.016) - 60, 120, 120);
    if (!blink) {
      c.save(); path(); c.clip();
      c.fillStyle = '#f7f2ee'; c.fillRect(0, 0, 512, 512);
      const irx = cx(ex + s * -0.001), iry = cy(ey + 0.0015), R = 0.021 * 1280;
      g = c.createRadialGradient(irx, iry, 2, irx, iry, R); g.addColorStop(0, S.iris[1]); g.addColorStop(0.65, S.iris[1]); g.addColorStop(1, S.iris[0]);
      c.fillStyle = g; c.beginPath(); c.arc(irx, iry, R, 0, 7); c.fill();
      c.fillStyle = '#0a0604'; c.beginPath(); c.arc(irx, iry, R * 0.45, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); c.arc(irx - 7, iry - 8, 6.5, 0, 7); c.fill(); c.beginPath(); c.arc(irx + 7, iry + 5, 2.2, 0, 7); c.fill();
      g = c.createLinearGradient(0, cy(ey + H * 2), 0, cy(ey)); g.addColorStop(0, 'rgba(40,20,10,0.55)'); g.addColorStop(1, 'rgba(40,20,10,0)'); c.fillStyle = g; c.fillRect(0, cy(ey + H * 2.2), 512, 34);
      c.restore();
    }
    // linea dell'occhio + codina e ciglia
    c.strokeStyle = S.liner; c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = blink ? 5 : 6.5; c.beginPath(); c.moveTo(ix, iy);
    if (blink) c.quadraticCurveTo(cx(s * 0.07), cy(ey - 0.004), ox, oy);
    else c.bezierCurveTo(cx(s * 0.05), cy(ey + 0.0015 + H * 2.1), cx(s * 0.088), cy(ey + 0.005 + H * 2.0), ox, oy);
    c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(ox - s * 2, oy); c.quadraticCurveTo(ox + s * 12, oy - 4, ox + s * 18, oy - 11); c.stroke();     // codina
    if (!blink) {
      c.lineWidth = 2.4; for (let i = 0; i < 6; i++) { const u = 0.35 + i * 0.12, px = ix + (ox - ix) * u, py = iy + (oy - iy) * u - Math.sin(u * Math.PI) * H * 2.0 * 1113 * 0.8; c.beginPath(); c.moveTo(px, py); c.lineTo(px + s * (3 + u * 5), py - 7 - u * 2); c.stroke(); }
    }
  }
  // sopracciglia folte e ad arco
  for (const s of [-1, 1]) {
    let by = 0.066, inner = 0, outer = 0, lift = 0;
    if (angry) { inner = -0.013; outer = 0.007; } else if (scared) { lift = 0.014; inner = 0.007; } else if (worried) { inner = 0.009; outer = -0.003; }
    const p0 = [s * 0.03, by + lift + inner], p1 = [s * 0.07, by + 0.017 + lift + (inner + outer) / 2], p2 = [s * 0.113, by + 0.0 + lift + outer];
    c.fillStyle = S.brow; c.beginPath(); c.moveTo(cx(p0[0]), cy(p0[1]));
    c.quadraticCurveTo(cx(p1[0]), cy(p1[1] + 0.003), cx(p2[0]), cy(p2[1]));
    c.quadraticCurveTo(cx(p1[0] + s * 0.004), cy(p1[1] - 0.0095), cx(p0[0]), cy(p0[1] - 0.011)); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,18,10,0.35)'; c.lineWidth = 1.6;
    for (let i = 0; i < 12; i++) { const u = i / 11, px = cx(p0[0] + (p2[0] - p0[0]) * u), py = cy(p0[1] + (p1[1] - p0[1]) * Math.sin(u * Math.PI) + (p2[1] - p0[1]) * u - 0.004); c.beginPath(); c.moveTo(px, py + 6); c.lineTo(px + s * 5, py - 4); c.stroke(); }
  }
  // bocca
  const my = -0.083, hw = 0.036;
  const lipEdge = 'rgba(120,55,60,0.9)';
  if (angry || shout || scared) {
    const w = scared ? 0.026 : shout ? 0.034 : 0.04, h = scared ? 0.026 : shout ? 0.034 : 0.03;
    c.fillStyle = '#4a0d12'; c.beginPath(); c.ellipse(cx(0), cy(my - 0.006), w * 1280, h * 1113 * 0.7 + 4, 0, 0, 7); c.fill();
    c.save(); c.beginPath(); c.ellipse(cx(0), cy(my - 0.006), w * 1280, h * 1113 * 0.7 + 4, 0, 0, 7); c.clip();
    c.fillStyle = '#f7f2ee'; c.fillRect(cx(-w), cy(my - 0.006 + h * 0.7), w * 2560, 11);
    c.fillStyle = '#b3263e'; c.beginPath(); c.ellipse(cx(0), cy(my - 0.006 - h * 0.65), w * 700, 12, 0, 0, 7); c.fill(); c.restore();
    c.strokeStyle = S.lip; c.lineWidth = 7; c.beginPath(); c.ellipse(cx(0), cy(my - 0.006), w * 1280, h * 1113 * 0.7 + 4, 0, 0, 7); c.stroke();
  } else if (expr === 'hen') {
    c.strokeStyle = lipEdge; c.lineWidth = 4; c.beginPath(); c.moveTo(cx(-0.02), cy(my)); c.lineTo(cx(0.02), cy(my)); c.stroke();
  } else {
    const k = expr === 'smile' ? 1 : -0.35, lw = hw * (expr === 'smile' ? 1.05 : 0.9), cl = my + 0.0045 * k;       // angoli: su se sorride
    // labbro superiore con arco di cupido
    c.fillStyle = S.lip; c.beginPath(); c.moveTo(cx(-lw), cy(cl));
    c.bezierCurveTo(cx(-lw * 0.6), cy(my + 0.008), cx(-0.016), cy(my + 0.012), cx(-0.0055), cy(my + 0.0105));
    c.quadraticCurveTo(cx(0), cy(my + 0.0065), cx(0.0055), cy(my + 0.0105));
    c.bezierCurveTo(cx(0.016), cy(my + 0.012), cx(lw * 0.6), cy(my + 0.008), cx(lw), cy(cl));
    c.bezierCurveTo(cx(lw * 0.5), cy(my - 0.0035 - 0.002 * k), cx(-lw * 0.5), cy(my - 0.0035 - 0.002 * k), cx(-lw), cy(cl)); c.fill();
    // labbro inferiore piu' pieno, con luce
    g = c.createLinearGradient(0, cy(my - 0.003), 0, cy(my - 0.021)); g.addColorStop(0, S.lip); g.addColorStop(0.6, S.lipLo); g.addColorStop(1, S.lip);
    c.fillStyle = g; c.beginPath(); c.moveTo(cx(-lw * 0.97), cy(cl - 0.0005));
    c.bezierCurveTo(cx(-lw * 0.6), cy(my - 0.02), cx(lw * 0.6), cy(my - 0.02), cx(lw * 0.97), cy(cl - 0.0005));
    c.bezierCurveTo(cx(lw * 0.5), cy(my - 0.0035 - 0.002 * k), cx(-lw * 0.5), cy(my - 0.0035 - 0.002 * k), cx(-lw * 0.97), cy(cl - 0.0005)); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.ellipse(cx(0), cy(my - 0.0115), 11, 4, 0, 0, 7); c.fill();
    c.strokeStyle = lipEdge; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx(-lw), cy(cl)); c.bezierCurveTo(cx(-lw * 0.5), cy(my - 0.0035 - 0.002 * k), cx(lw * 0.5), cy(my - 0.0035 - 0.002 * k), cx(lw), cy(cl)); c.stroke();
    if (expr === 'smile') { c.strokeStyle = `rgba(${S.shadow},0.35)`; c.lineWidth = 2.5; for (const s of [-1, 1]) { c.beginPath(); c.arc(cx(s * (lw + 0.004)), cy(cl + 0.0015), 5, s > 0 ? -1.2 : 4.4, s > 0 ? 1.2 : 1.9 + Math.PI * 0.3); c.stroke(); } }
  }
  c.restore();
  // ombra sotto il labbro e mento
  g = c.createRadialGradient(cx(0), cy(-0.118), 2, cx(0), cy(-0.118), 36); g.addColorStop(0, `rgba(${S.shadow},0.16)`); g.addColorStop(1, `rgba(${S.shadow},0)`); c.fillStyle = g; c.fillRect(cx(0) - 40, cy(-0.118) - 40, 80, 80);
}

const cache = {};
export function faceTexture(expr = 'smile', blink = false, style = 'martina') {
  const key = style + '|' + expr + (blink ? '|b' : '');
  return cache[key] || (cache[key] = canvasTex(512, 512, (c) => paint(c, expr, blink, STYLES[style] || STYLES.martina)));
}
// mappa la texture del volto sulla testa guardando da davanti; il retro riceve un angolo di pelle liscia
export function applyFaceUV(geo) {
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (z > 0.02) { uv[i * 2] = 0.01; uv[i * 2 + 1] = 0.99; }
    else { uv[i * 2] = Math.min(0.97, Math.max(0.03, 0.5 + x / 0.4)); uv[i * 2 + 1] = 0.5 + y / 0.446; }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}
