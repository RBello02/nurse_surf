// Strumenti di base per la pixel art.
// Il canvas principale e' 360x640 ma si disegna in "unita' di progetto" 180x320 (ctx.scale(2,2)):
// 1 unita' = 2 pixel reali, la risoluzione minima e' quindi di mezza unita' (ctx.__q = 0.5).
// Gli sprite sono invece disegnati in pixel reali (canvas offscreen, ctx.__q = 1) e poi riportati
// alla scala di progetto con Px.blit (1 pixel sprite = mezza unita').
const Px = (() => {
  // Sprite: disegnati in "pixel sprite" logici, ma su un canvas supersampled (SS x) con curve antialiasate,
  // cosi' restano nitidi e morbidi a qualsiasi scala. raw = canvas 1:1 senza supersampling (effetti, sagome).
  const SS = 2;
  function make(w, h, drawFn, raw = false, ss = SS) {
    const S = raw ? 1 : ss;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
    c.__lw = w; c.__lh = h; c.__S = S;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    if (!raw) { x.scale(S, S); x.__q = 1; x.__smooth = true; } else x.__q = 1;
    if (drawFn) drawFn(x, w, h);
    return c;
  }
  const lw = (img) => img.__lw || img.width;
  const lh = (img) => img.__lh || img.height;

  const qOf = (ctx) => ctx.__q || 1;
  // per il testo il canvas principale (q = 1/RES) conta come q = 0.5: la dimensione di f resta quella di sempre
  const tq = (ctx) => (ctx.__smooth && qOf(ctx) < 0.5 ? 0.5 : qOf(ctx));
  const snap = (v, q) => Math.round(v / q) * q;

  function rect(ctx, x, y, w, h, color) {
    const q = qOf(ctx);
    const x0 = snap(x, q), y0 = snap(y, q);
    const x1 = snap(x + w, q), y1 = snap(y + h, q);
    ctx.fillStyle = color;
    ctx.fillRect(x0, y0, Math.max(q, x1 - x0), Math.max(q, y1 - y0));
  }

  // Ellisse piena (a scanline, bordi netti)
  function ell(ctx, cx, cy, rx, ry, color) {
    if (ctx.__smooth) {
      const o = ctx.__q === 1 ? 0.5 : 0;
      ctx.fillStyle = color; ctx.beginPath();
      ctx.ellipse(cx, cy + o, Math.max(0.5, rx), Math.max(0.5, ry + o), 0, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.fillStyle = color;
    for (let y = -Math.floor(ry); y <= Math.floor(ry); y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + y), Math.max(1, half * 2), 1);
    }
  }

  // Segmento spesso th pixel (per braccia e gambe)
  function line(ctx, x0, y0, x1, y1, th, color) {
    if (ctx.__smooth) {
      ctx.strokeStyle = color; ctx.lineWidth = th; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      return;
    }
    ctx.fillStyle = color;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      ctx.fillRect(Math.round(x - th / 2), Math.round(y - th / 2), th, th);
    }
  }

  // Rettangolo con luce in alto/sinistra e ombra in basso/destra (volume)
  function bev(ctx, x, y, w, h, base, hi, lo) {
    ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
    if (hi) { ctx.fillStyle = hi; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h); }
    if (lo) { ctx.fillStyle = lo; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h); }
  }

  // ---- testo: font arrotondato e morbido (antialiasato), tutto maiuscolo senza accenti ----
  const FONT_STACK = '"Arial Rounded MT Bold","Trebuchet MS","Verdana","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  const measureCtx = document.createElement('canvas').getContext('2d');
  const widthCache = {};
  function norm(str) {
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }
  // dimensione del carattere (unita' del contesto) per il parametro f: f=2 sul canvas principale ~ 7 unita' di altezza
  const CONDENSE = 0.76;     // il font e' compresso in larghezza (come un 'condensed')
  const fontPx = (f, q) => 11 * f * q;
  function measure(s) {
    if (widthCache[s] == null) { measureCtx.font = `900 100px ${FONT_STACK}`; widthCache[s] = measureCtx.measureText(s).width / 100 + 0.035 * s.length; }
    return widthCache[s];
  }
  // f = grandezza del testo (come prima). Larghezza in unita' del contesto.
  function textWidth(str, f = 2, ctx = null) {
    const s = norm(str);
    return s.length ? measure(s) * CONDENSE * fontPx(f, ctx ? tq(ctx) : 0.5) : 0;
  }

  // x,y = angolo in alto a sinistra del testo; align: left|center|right
  function text(ctx, str, x, y, color = '#fff', f = 2, align = 'left', outline = null) {
    const s = norm(str);
    if (!s.length) return 0;
    const q = tq(ctx), size = fontPx(f, q), w = measure(s) * size * CONDENSE;
    ctx.save();
    ctx.font = `900 ${size}px ${FONT_STACK}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (0.03 * size) + 'px';
    const px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const base = y + 7.5 * f * q;                 // la linea di base cade dove stava il fondo del vecchio font
    if (outline) {
      ctx.lineJoin = 'round'; ctx.miterLimit = 2;
      ctx.lineWidth = Math.max(q, f * q) * 1.5; ctx.strokeStyle = outline;
      ctx.save(); ctx.translate(px, base); ctx.scale(CONDENSE, 1); ctx.strokeText(s, 0, 0); ctx.restore();
    }
    ctx.fillStyle = color;
    ctx.translate(px, base); ctx.scale(CONDENSE, 1);
    ctx.fillText(s, 0, 0);
    ctx.restore();
    return w;
  }

  // rettangolo arrotondato (path)
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // pannello "vetro": traslucido con riflesso in alto e bordo luminoso
  function panel(ctx, x, y, w, h, o = {}) {
    const r = o.r != null ? o.r : 4;
    ctx.save();
    if (o.shadow !== false) { rr(ctx, x, y + 1.2, w, h, r); ctx.fillStyle = 'rgba(5,10,24,0.32)'; ctx.fill(); }
    rr(ctx, x, y, w, h, r);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, o.top || 'rgba(40,58,96,0.78)'); g.addColorStop(1, o.bottom || 'rgba(14,22,44,0.78)');
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    const sh = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
    sh.addColorStop(0, 'rgba(255,255,255,0.20)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h * 0.5);
    ctx.restore();
    ctx.save(); rr(ctx, x, y, w, h, r); ctx.strokeStyle = o.stroke || 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.45; ctx.stroke(); ctx.restore();
  }

  // Pulsante moderno: rilievo 3D (bordo inferiore), sfumatura, riflesso e ombra morbida.
  function button(ctx, x, y, w, h, label, o = {}) {
    const base = o.color || '#3bb273', dark = o.dark || '#26875a', light = o.light || '#6fd9a2';
    const lip = Math.min(3, h * 0.16), r = Math.min(6, h * 0.34), dy = o.pressed ? lip * 0.7 : 0;
    ctx.save();
    rr(ctx, x - 0.5, y + lip + 1.8, w + 1, h, r + 0.5); ctx.fillStyle = 'rgba(5,10,24,0.34)'; ctx.fill();   // ombra
    rr(ctx, x, y + lip, w, h, r); ctx.fillStyle = dark; ctx.fill();                                      // spessore
    const fy = y + dy;
    rr(ctx, x, fy, w, h, r);
    const g = ctx.createLinearGradient(0, fy, 0, fy + h);
    g.addColorStop(0, light); g.addColorStop(0.55, base); g.addColorStop(1, dark);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); rr(ctx, x, fy, w, h, r); ctx.clip();
    const sh = ctx.createLinearGradient(0, fy, 0, fy + h * 0.5);
    sh.addColorStop(0, 'rgba(255,255,255,0.42)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(x, fy, w, h * 0.5);
    ctx.restore();
    rr(ctx, x, fy, w, h, r); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.4; ctx.stroke();
    ctx.restore();
    if (label) {
      const f = o.f || 2;
      text(ctx, label, x + w / 2, fy + (h - 7 * f * 0.5) / 2 - 0.5, o.text || '#fff', f, 'center', dark);
    }
    return { x, y, w, h };
  }

  // Volume: luce a sinistra/in alto, ombra a destra/in basso, applicata alla sagoma dello sprite (prima del contorno)
  function shade(src) {
    const c = make(src.width, src.height, (g) => {
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      const gx = g.createLinearGradient(0, 0, src.width, 0);
      gx.addColorStop(0, 'rgba(255,255,255,0.22)'); gx.addColorStop(0.42, 'rgba(255,255,255,0.02)'); gx.addColorStop(1, 'rgba(8,16,56,0.30)');
      g.fillStyle = gx; g.fillRect(0, 0, src.width, src.height);
      const gy = g.createLinearGradient(0, 0, 0, src.height);
      gy.addColorStop(0, 'rgba(255,255,255,0.12)'); gy.addColorStop(0.6, 'rgba(255,255,255,0)'); gy.addColorStop(1, 'rgba(8,16,56,0.20)');
      g.fillStyle = gy; g.fillRect(0, 0, src.width, src.height);
    }, true);
    c.__lw = lw(src); c.__lh = lh(src); c.__S = src.__S || 1;
    return c;
  }

  function hit(r, p, pad = 0) {
    return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
  }

  // Pseudo-casuale deterministico (per decorazioni stabili)
  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = n + (n << 3);
    n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d);
    n = n ^ (n >>> 15);
    return (n >>> 0) / 4294967295;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // Sagoma monocolore dello sprite (serve per i contorni)
  function tint(src, color) {
    const c = make(src.width, src.height, (g) => {
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = color;
      g.fillRect(0, 0, src.width, src.height);
    }, true);
    c.__lw = lw(src); c.__lh = lh(src); c.__S = src.__S || 1;
    return c;
  }

  // Contorno scuro sottile attorno allo sprite (+1 pixel logico di margine per lato)
  function outlined(src, color = '#10151f') {
    const S = src.__S || 1, T = 0.8 * S, M = Math.ceil(S);
    const sil = tint(src, color);
    const c = make(src.width + 2 * M, src.height + 2 * M, (g) => {
      const n = 12;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.drawImage(sil, M + Math.cos(a) * T, M + Math.sin(a) * T); }
      g.drawImage(src, M, M);
    }, true);
    c.__lw = lw(src) + 2 * M / S; c.__lh = lh(src) + 2 * M / S; c.__S = S;
    return c;
  }

  // Disegna uno sprite sul canvas principale. (x, yBottom) = centro-base in unita' di progetto,
  // k = scala (1 = 1 pixel sprite -> mezza unita'). Dimensioni in unita': w = larghezza logica * k / 2.
  function blit(ctx, img, x, yBottom, k = 1) {
    const w = lw(img) * k * 0.5, h = lh(img) * k * 0.5;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, Math.round((x - w / 2) * 4) / 4, Math.round((yBottom - h) * 4) / 4, Math.max(0.25, w), Math.max(0.25, h));
  }

  return { make, lw, lh, rect, rr, panel, shade, ell, line, bev, text, textWidth, button, hit, hash, lerp, clamp, ease, tint, outlined, blit };
})();
