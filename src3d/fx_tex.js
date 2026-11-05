import { THREE, canvasTex } from './util.js';
export { THREE };
let t = null;
export function glowTexSafe() { return t || (t = canvasTex(32, 32, (c) => { const g = c.createRadialGradient(16, 16, 1, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); })); }
