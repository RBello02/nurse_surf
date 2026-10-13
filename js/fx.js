// Particelle semplici (scintille, coriandoli, fuochi d'artificio) in pixel art.
const Fx = {
  create() {
    const list = [];
    const api = {
      count: () => list.length,
      clear() { list.length = 0; },
      // Esplosione di scintille
      burst(x, y, colors, n = 12, speed = 50, life = 0.5, grav = 80, size = 1) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = speed * (0.35 + Math.random() * 0.65);
          list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: grav, life: life * (0.6 + Math.random() * 0.5), max: life, c: colors[(Math.random() * colors.length) | 0], s: size });
        }
      },
      // Singolo coriandolo che cade dall'alto
      confetti(w, colors) {
        list.push({
          x: Math.random() * w, y: -4, vx: (Math.random() - 0.5) * 14, vy: 25 + Math.random() * 35, g: 0,
          life: 6, max: 6, c: colors[(Math.random() * colors.length) | 0], s: Math.random() < 0.5 ? 1 : 2,
          sway: Math.random() * 6.28, conf: true
        });
      },
      update(dt) {
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.life -= dt;
          if (p.life <= 0) { list.splice(i, 1); continue; }
          p.vy += p.g * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.conf) {
            p.sway += dt * 5;
            p.x += Math.sin(p.sway) * 12 * dt;
            if (p.y > CFG.H + 6) list.splice(i, 1);
          }
        }
      },
      draw(ctx) {
        for (const p of list) {
          ctx.globalAlpha = p.conf ? 1 : Math.min(1, (p.life / p.max) * 1.6);
          ctx.fillStyle = p.c;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
        }
        ctx.globalAlpha = 1;
      }
    };
    return api;
  }
};
