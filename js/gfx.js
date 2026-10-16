// Effetti "moderni" con un tocco di 3D, tutti in 2D canvas: ombre morbide, riflessi sul pavimento lucido,
// bagliori delle luci, linee di velocita', estrusione degli ostacoli verso il punto di fuga.
// Gfx.level adatta la qualita' al telefono: 2 = tutto, 1 = senza estrusione, 0 = solo l'essenziale.
const Gfx = (() => {
  const W = CFG.W, H = CFG.H;
  let level = 2, acc = 0, frames = 0, calm = 0;

  // misura la durata media dei fotogrammi e abbassa la qualita' se il telefono fa fatica
  function track(dt) {
    acc += dt; frames++;
    if (frames >= 60) {
      const avg = acc / frames;
      if (avg > 0.034 && level > 0) { level--; calm = 0; }
      acc = 0; frames = 0;
    }
  }

  // ombra morbida ellittica (gradiente radiale)
  function softShadow(ctx, x, y, rx, ry, a) {
    if (a <= 0.01) return;
    ctx.save();
    ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(10,16,30,${a})`); g.addColorStop(0.6, `rgba(10,16,30,${a * 0.55})`); g.addColorStop(1, 'rgba(10,16,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // riflesso sul pavimento lucido: sprite capovolto, schiacciato e tenue
  function reflect(ctx, img, x, yBase, w, h, a) {
    if (level < 1 || a <= 0.01) return;
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * a;
    ctx.save();
    ctx.translate(x, yBase); ctx.scale(1, -0.42);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
    ctx.globalAlpha = prev;
  }

  // bagliori additivi sulle luci a soffitto + pozze di luce sul pavimento
  function lights(ctx, T, warm) {
    if (level < 1) return;
    const LP = World.LIGHT_P, HZ = CFG.HORIZON_Y;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const col = warm ? '255,214,150' : '255,246,214';
    for (let k = Math.floor((T - 0.3) / LP); k <= Math.ceil((T + 3.4) / LP); k++) {
      const z = k * LP + LP * 0.175 - T;
      if (z < -0.2 || z > 3.4) continue;
      const s = World.proj(Math.max(z, -0.05));
      const fade = Px.clamp((3.4 - z) / 1.4, 0, 1);
      const cy = HZ - World.CEIL * s;
      const r = 46 * s + 4;
      const g1 = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, r);
      g1.addColorStop(0, `rgba(${col},${0.55 * fade})`); g1.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g1; ctx.fillRect(W / 2 - r, cy - r, r * 2, r * 2);
      const fy = World.scrY(s), rx = 66 * s, ry = 11 * s + 1;
      ctx.save(); ctx.translate(W / 2, fy); ctx.scale(1, ry / rx);
      const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g2.addColorStop(0, `rgba(${col},${0.17 * fade})`); g2.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // linee di velocita' che partono dal punto di fuga (solo quando si corre veloci)
  function speedLines(ctx, t, speed) {
    if (level < 1) return;
    const k = Px.clamp((speed - 1.15) / 0.9, 0, 1);
    if (k <= 0.02) return;
    const cx = W / 2, cy = CFG.HORIZON_Y + 10, n = level >= 2 ? 16 : 9;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const seed = Px.hash(i * 17 + 3);
      const a = (seed * 2 - 1) * Math.PI * 0.95 + Math.PI / 2;           // verso il basso e ai lati
      const ph = (t * (0.9 + speed * 0.5) + Px.hash(i * 31 + 7)) % 1;
      const r0 = 30 + ph * ph * 330, r1 = r0 + 14 + ph * 40;
      ctx.strokeStyle = `rgba(235,246,255,${0.22 * k * Math.sin(ph * Math.PI)})`;
      ctx.lineWidth = 0.4 + ph * 1.2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 1.2); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 1.2); ctx.stroke();
    }
    ctx.restore();
  }

  // copia scura della sagoma (per lo spessore 3D), in cache
  const darkCache = new WeakMap();
  function dark(img) {
    let d = darkCache.get(img);
    if (!d) {
      d = document.createElement('canvas'); d.width = img.width; d.height = img.height;
      const c = d.getContext('2d'); c.drawImage(img, 0, 0);
      c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(14,22,48,0.55)'; c.fillRect(0, 0, d.width, d.height);
      darkCache.set(img, d);
    }
    return d;
  }

  // sprite con spessore: copie scure spostate verso il punto di fuga, poi la faccia frontale
  function extrude(ctx, img, x, y, w, h, s) {
    if (level >= 2 && s > 0.25) {
      const d = dark(img), vx = W / 2, vy = CFG.HORIZON_Y;
      const dx = (vx - x), dy = (vy - (y - h / 2));
      const n = 4, depth = 0.07 * s;
      for (let i = n; i >= 1; i--) {
        const k = depth * i / n;
        ctx.drawImage(d, x - w / 2 + dx * k * 0.5, y - h + dy * k * 0.5 - 0 , w, h);
      }
    }
    ctx.drawImage(img, x - w / 2, y - h, w, h);
  }

  // ease morbido per il cambio corsia
  const smooth = (f) => { const b = Math.floor(f), t = f - b; return b + t * t * (3 - 2 * t); };

  return { dark, extrude, smooth, get level() { return level; }, set level(v) { level = v; }, track, softShadow, reflect, lights, speedLines };
})();
