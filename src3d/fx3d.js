// Particelle semplici (coriandoli, scintille, polvere, piume) disegnate con un unico THREE.Points.
import { THREE, glowTexSafe } from './fx_tex.js';

export function createParticles(scene, max = 1400) {
  const pos = new Float32Array(max * 3), col = new Float32Array(max * 3);
  const vel = new Float32Array(max * 3), life = new Float32Array(max), age = new Float32Array(max).fill(99), grav = new Float32Array(max), drag = new Float32Array(max);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true, map: glowTexSafe(), alphaTest: 0.01 });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
  let head = 0;
  const c = new THREE.Color();
  const P = {
    pts,
    emit(x, y, z, vx, vy, vz, color, lifeS = 1, g = 6, d = 0.4) {
      const i = head; head = (head + 1) % max;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
      c.set(color); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; life[i] = lifeS; age[i] = 0; grav[i] = g; drag[i] = d;
    },
    burst(x, y, z, colors, n = 30, speed = 4, lifeS = 1, g = 6, up = 0) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), s = speed * (0.4 + Math.random() * 0.8);
        P.emit(x, y, z, Math.cos(a) * Math.sin(b) * s, Math.cos(b) * s + up, Math.sin(a) * Math.sin(b) * s, colors[(Math.random() * colors.length) | 0], lifeS * (0.6 + Math.random() * 0.6), g);
      }
    },
    update(dt) {
      for (let i = 0; i < max; i++) {
        if (age[i] >= life[i]) { pos[i * 3 + 1] = -50; continue; }
        age[i] += dt; const k = 1 - drag[i] * dt;
        vel[i * 3] *= k; vel[i * 3 + 2] *= k; vel[i * 3 + 1] = vel[i * 3 + 1] * k - grav[i] * dt;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (age[i] > life[i] * 0.7) { const f = 1 - (age[i] - life[i] * 0.7) / (life[i] * 0.3); col[i * 3] *= 0.97; col[i * 3 + 1] *= 0.97; col[i * 3 + 2] *= 0.97; if (f < 0.2) pos[i * 3 + 1] = -50; }
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
    clear() { age.fill(99); pos.fill(-50); }
  };
  P.clear();
  return P;
}
