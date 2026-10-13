// Schermata iniziale: titolo, anteprima della protagonista, scelta della divisa e pulsante INIZIA.
function MenuScene(app) {
  const W = CFG.W, H = CFG.H;
  const saved = Save.get();
  let outfit = CFG.OUTFITS.includes(saved.outfit) ? saved.outfit : 'uniforme';
  let t = 0;
  let pressed = null;
  const fx = Fx.create();
  const st = { T: 0, specialStart: Infinity, endW: null, doorOpen: 0 };

  const BOXES = CFG.OUTFITS.map((name, i) => ({ name, x: 8 + i * 56, y: 206, w: 52, h: 40 }));
  const START = { x: 30, y: 266, w: 120, h: 34 };
  const MUTE = { x: W - 19, y: 3, w: 16, h: 16 };

  function drawTitle(ctx) {
    const bob = Math.round(Math.sin(t * 2.5) * 1.5);
    Px.text(ctx, 'NURSE', W / 2, 12 + bob, PAL.white, 4, 'center', PAL.ink);
    Px.text(ctx, 'SURF', W / 2, 36 + bob, PAL.gold, 4, 'center', PAL.ink);
    // croce rossa accanto al titolo
    const cx = W / 2 + 36, cy = 41 + bob;
    Px.rect(ctx, cx - 5, cy - 1, 13, 13, PAL.ink);
    Px.rect(ctx, cx - 4, cy, 11, 11, '#ffffff');
    Px.rect(ctx, cx, cy + 1, 3, 9, PAL.red);
    Px.rect(ctx, cx - 3, cy + 4, 9, 3, PAL.red);
  }

  function drawMute(ctx) {
    Px.button(ctx, MUTE.x, MUTE.y, MUTE.w, MUTE.h, '', { color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
    Px.rect(ctx, MUTE.x + 4, MUTE.y + 6, 3, 4, '#fff');
    Px.rect(ctx, MUTE.x + 7, MUTE.y + 4, 2, 8, '#fff');
    if (Sfx.isMuted()) {
      for (let i = 0; i < 5; i++) { Px.rect(ctx, MUTE.x + 9 + i, MUTE.y + 4 + i, 1, 1, PAL.red); Px.rect(ctx, MUTE.x + 9 + i, MUTE.y + 8 - i, 1, 1, PAL.red); }
    } else {
      Px.rect(ctx, MUTE.x + 11, MUTE.y + 6, 1, 4, '#fff');
      Px.rect(ctx, MUTE.x + 13, MUTE.y + 5, 1, 6, '#fff');
    }
  }

  function render(ctx) {
    World.render(ctx, st);
    // velo per far risaltare l'interfaccia
    ctx.fillStyle = 'rgba(16,21,31,0.28)';
    ctx.fillRect(0, 0, W, H);
    drawTitle(ctx);

    // piedistallo + protagonista (anteprima animata, scala 3)
    const px = W / 2, py = 188;
    ctx.fillStyle = 'rgba(16,21,31,0.35)';
    ctx.fillRect(px - 26, py - 2, 52, 4);
    Px.rect(ctx, px - 24, py - 3, 48, 3, PAL.gold);
    Px.rect(ctx, px - 24, py - 3, 48, 1, '#fff3b0');
    const pose = (Math.floor(t * 6) % 2) ? 'run1' : 'run0';
    Hero.draw(ctx, outfit, pose, px, py - 3 + (Math.floor(t * 6) % 2 ? -1 : 0), 3);
    Px.text(ctx, CFG.OUTFIT_LABELS[outfit], px, 196, '#ffffff', 1, 'center', PAL.ink);
    fx.draw(ctx);

    // scelta divisa
    for (const b of BOXES) {
      const sel = b.name === outfit;
      Px.rect(ctx, b.x, b.y, b.w, b.h, PAL.ink);
      Px.rect(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, sel ? PAL.gold : '#5b6670');
      Px.rect(ctx, b.x + 3, b.y + 3, b.w - 6, b.h - 6, sel ? '#fff3b0' : '#cfe7ee');
      const spr = Hero.get(b.name, 'stand');
      ctx.drawImage(spr, Math.round(b.x + b.w / 2 - spr.width / 2), b.y + 5 + (sel ? Math.round(Math.sin(t * 8)) : 0));
    }
    BOXES.forEach((b) => Px.text(ctx, CFG.OUTFIT_LABELS[b.name], b.x + b.w / 2, b.y + b.h + 4, b.name === outfit ? PAL.gold : '#ffffff', 1, 'center', PAL.ink));

    // pulsante INIZIA
    const pulse = Math.round(Math.sin(t * 5));
    Px.button(ctx, START.x, START.y + (pressed === 'start' ? 1 : 0), START.w, START.h + pulse, 'INIZIA', { scale: 2, color: '#e0344b', dark: '#a82036', light: '#f06277' });
    drawMute(ctx);
    Px.text(ctx, 'SCEGLI COME VESTIRTI', W / 2, 58, '#fff', 1, 'center', PAL.ink);
    const rec = Save.get().best;
    if (rec) Px.text(ctx, 'RECORD ' + rec, W / 2, 308, '#b7c6cc', 1, 'center', PAL.ink);
  }

  function update(dt) {
    t += dt;
    st.T += dt * 0.55;
    fx.update(dt);
    if (Math.random() < dt * 6) fx.burst(W / 2 + (Math.random() - 0.5) * 50, 118 + Math.random() * 60, ['#fff', PAL.gold], 1, 6, 0.8, -4);
  }

  function input(action, p) {
    if (action === 'left' || action === 'right') {
      const i = CFG.OUTFITS.indexOf(outfit);
      outfit = CFG.OUTFITS[(i + (action === 'right' ? 1 : CFG.OUTFITS.length - 1)) % CFG.OUTFITS.length];
      Save.set({ outfit }); Sfx.select();
      return;
    }
    if (action === 'confirm' || action === 'up') return startGame();
    if (action !== 'tap') return;
    if (Px.hit(MUTE, p, 4)) { Sfx.toggleMute(); if (!Sfx.isMuted()) Sfx.select(); return; }
    for (const b of BOXES) {
      if (Px.hit(b, p, 2)) {
        if (outfit !== b.name) { outfit = b.name; Save.set({ outfit }); }
        Sfx.select();
        fx.burst(W / 2, 140, ['#fff', PAL.gold, PAL.pink], 14, 50, 0.6, 30);
        return;
      }
    }
    // toccando la protagonista si cambia divisa
    if (p.x > W / 2 - 30 && p.x < W / 2 + 30 && p.y > 80 && p.y < 190) {
      const i = CFG.OUTFITS.indexOf(outfit);
      outfit = CFG.OUTFITS[(i + 1) % CFG.OUTFITS.length];
      Save.set({ outfit }); Sfx.select();
      fx.burst(W / 2, 140, ['#fff', PAL.gold, PAL.pink], 14, 50, 0.6, 30);
      return;
    }
    if (Px.hit(START, p, 4)) startGame();
  }

  function startGame() {
    Save.set({ outfit });
    Sfx.select();
    app.go('game', { outfit });
  }

  return { enter() {}, leave() {}, update, render, input };
}
