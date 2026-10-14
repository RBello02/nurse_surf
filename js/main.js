// Avvio, ciclo principale, gestione scene con dissolvenza e ridimensionamento per smartphone.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Risoluzione reale 360x640; si disegna in unita' di progetto 180x320 (1 unita' = 2 pixel reali).
  const RES = 2;
  canvas.width = CFG.W * RES; canvas.height = CFG.H * RES;
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.__q = 1 / RES;

  let scene = null;
  let trans = null;   // { phase: 'out'|'in', t, time, color, next }
  let last = 0;

  const app = {
    // Cambia scena con dissolvenza. opts: { color, time }
    go(name, params = {}, opts = {}) {
      if (trans && trans.phase === 'out') return;
      trans = { phase: 'out', t: 0, time: opts.time || 0.25, color: opts.color || '#10151f', next: { name, params } };
    }
  };

  function make(name, params) {
    if (name === 'menu') return MenuScene(app);
    if (name === 'intro') return IntroScene(app, params);
    if (name === 'game') return GameScene(app, params.outfit || 'uniforme');
    if (name === 'finale') return FinaleScene(app, params);
    throw new Error('Scena sconosciuta: ' + name);
  }

  function setScene(name, params) {
    if (scene && scene.leave) scene.leave();
    scene = make(name, params);
    if (scene.enter) scene.enter();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (scene) {
      if (!trans || trans.phase === 'in') scene.update(dt);
      else scene.update(dt * 0.5);
      scene.render(ctx);
    }
    if (trans) {
      trans.t += dt;
      const p = Math.min(1, trans.t / trans.time);
      if (trans.phase === 'out') {
        ctx.globalAlpha = p; ctx.fillStyle = trans.color; ctx.fillRect(0, 0, CFG.W, CFG.H); ctx.globalAlpha = 1;
        if (p >= 1) { setScene(trans.next.name, trans.next.params); trans.phase = 'in'; trans.t = 0; }
      } else {
        ctx.globalAlpha = 1 - p; ctx.fillStyle = trans.color; ctx.fillRect(0, 0, CFG.W, CFG.H); ctx.globalAlpha = 1;
        if (p >= 1) trans = null;
      }
    }
    requestAnimationFrame(frame);
  }

  // Ridimensiona il canvas mantenendo il rapporto 9:16, scala intera quando possibile (pixel nitidi)
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    let scale = Math.min(vw / CFG.W, vh / CFG.H);
    const phys = scale * dpr;
    if (phys > 2) scale = Math.floor(phys) / dpr;   // multipli interi di pixel fisici
    canvas.style.width = Math.floor(CFG.W * scale) + 'px';
    canvas.style.height = Math.floor(CFG.H * scale) + 'px';
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  Input.init(canvas);
  Input.on((action, data) => { if (scene && !(trans && trans.phase === 'out')) scene.input(action, data); });

  // Pausa automatica se l'app va in background
  document.addEventListener('visibilitychange', () => { if (document.hidden && scene && scene.pause) scene.pause(); });

  // Service worker per l'uso offline / installazione come app (solo su http/https)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Esposto per i test automatici
  window.__nurse = { app, get scene() { return scene; }, setScene };

  setScene('menu', {});
  requestAnimationFrame((t) => { last = t; frame(t); });
})();
