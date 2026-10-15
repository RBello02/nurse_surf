// Schermata iniziale: titolo, anteprima di Martina, scelta della divisa e pulsante INIZIA.
function MenuScene(app) {
  const W = CFG.W, H = CFG.H;
  const saved = Save.get();
  let outfit = CFG.OUTFITS.includes(saved.outfit) ? saved.outfit : 'uniforme';
  let t = 0;
  const fx = Fx.create();
  const st = { T: 0, specialStart: Infinity, endW: null, doorOpen: 0 };

  const BOXES = CFG.OUTFITS.map((name, i) => ({ name, x: 8 + i * 56, y: 222, w: 52, h: 44 }));
  const START = { x: 24, y: 282, w: 132, h: 32 };
  const MUTE = { x: W - 21, y: 4, w: 17, h: 17 };

  function drawTitle(ctx) {
    const bob = Math.sin(t * 2.5) * 1.5;
    Px.text(ctx, 'NURSE', W / 2, 8 + bob, PAL.white, 8, 'center', PAL.ink);
    Px.text(ctx, 'SURF', W / 2 - 8, 40 + bob, PAL.gold, 8, 'center', PAL.ink);
    // croce rossa accanto al titolo
    const cx = W / 2 + 48, cy = 42 + bob;
    Px.rect(ctx, cx - 1, cy - 1, 20, 20, PAL.ink);
    Px.rect(ctx, cx, cy, 18, 18, '#ffffff');
    Px.rect(ctx, cx + 6, cy + 2, 6, 14, PAL.red);
    Px.rect(ctx, cx + 2, cy + 6, 14, 6, PAL.red);
    Px.text(ctx, 'LE AVVENTURE DI ' + CFG.NAME, W / 2, 74, '#ffffff', 2, 'center', PAL.ink);
  }

  function drawMute(ctx) {
    Px.button(ctx, MUTE.x, MUTE.y, MUTE.w, MUTE.h, '', { color: '#3e7bd6', dark: '#27559c', light: '#6ea0ec' });
    Px.rect(ctx, MUTE.x + 4, MUTE.y + 7, 3.5, 4, '#fff');
    Px.rect(ctx, MUTE.x + 7.5, MUTE.y + 5, 2.5, 8, '#fff');
    if (Sfx.isMuted()) {
      for (let i = 0; i < 5; i++) { Px.rect(ctx, MUTE.x + 10 + i, MUTE.y + 5 + i * 1.2, 1.5, 1.5, PAL.red); Px.rect(ctx, MUTE.x + 10 + i, MUTE.y + 11 - i * 1.2, 1.5, 1.5, PAL.red); }
    } else {
      Px.rect(ctx, MUTE.x + 12, MUTE.y + 7, 1.5, 4, '#fff');
      Px.rect(ctx, MUTE.x + 14.5, MUTE.y + 5.5, 1.5, 7, '#fff');
    }
  }

  function render(ctx) {
    World.render(ctx, st);
    ctx.fillStyle = 'rgba(16,21,31,0.30)';
    ctx.fillRect(0, 0, W, H);
    drawTitle(ctx);

    // piedistallo + Martina (anteprima animata, scala 3 = pixel netti)
    const px = W / 2, py = 204;
    ctx.fillStyle = 'rgba(16,21,31,0.35)';
    ctx.fillRect(px - 32, py - 2, 64, 5);
    Px.rect(ctx, px - 30, py - 3, 60, 4, PAL.gold);
    Px.rect(ctx, px - 30, py - 3, 60, 1.5, '#fff3b0');
    const rn = Hero.run(t, 10);
    Hero.draw(ctx, outfit, rn.pose, px, py - 3 - rn.bob, 3);
    Px.text(ctx, CFG.OUTFIT_TITLES[outfit], px, 210, '#ffffff', 2, 'center', PAL.ink);
    const rec = Save.get().best;
    if (rec) { Px.text(ctx, 'RECORD', W - 6, 100, '#b7c6cc', 2, 'right', PAL.ink); Px.text(ctx, String(rec), W - 6, 112, PAL.gold, 3, 'right', PAL.ink); }
    fx.draw(ctx);

    // scelta divisa
    for (const b of BOXES) {
      const sel = b.name === outfit;
      Px.rect(ctx, b.x, b.y, b.w, b.h, PAL.ink);
      Px.rect(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, sel ? PAL.gold : '#5b6670');
      Px.rect(ctx, b.x + 3, b.y + 3, b.w - 6, b.h - 6, sel ? '#fff3b0' : '#cfe7ee');
      Px.blit(ctx, Hero.get(b.name, 'stand'), b.x + b.w / 2, b.y + b.h - 3 - (sel ? Math.abs(Math.sin(t * 8)) * 2 : 0), 0.8);
      Px.text(ctx, CFG.OUTFIT_LABELS[b.name], b.x + b.w / 2, b.y + b.h + 4, sel ? PAL.gold : '#ffffff', 2, 'center', PAL.ink);
    }

    // pulsante INIZIA
    const pulse = Math.round(Math.sin(t * 5) * 1.2);
    Px.button(ctx, START.x, START.y, START.w, START.h + pulse, 'INIZIA', { f: 4, color: '#e0344b', dark: '#a82036', light: '#f06277' });
    drawMute(ctx);
  }

  function update(dt) {
    t += dt;
    st.T += dt * 0.55;
    fx.update(dt);
    if (Math.random() < dt * 6) fx.burst(W / 2 + (Math.random() - 0.5) * 60, 100 + Math.random() * 90, ['#fff', PAL.gold], 1, 6, 0.8, -4);
  }

  function choose(name) {
    if (outfit !== name) { outfit = name; Save.set({ outfit }); }
    Sfx.select();
    fx.burst(W / 2, 140, ['#fff', PAL.gold, PAL.pink], 16, 55, 0.6, 30);
  }

  function input(action, p) {
    if (action === 'left' || action === 'right') {
      const i = CFG.OUTFITS.indexOf(outfit);
      choose(CFG.OUTFITS[(i + (action === 'right' ? 1 : CFG.OUTFITS.length - 1)) % CFG.OUTFITS.length]);
      return;
    }
    if (action === 'confirm' || action === 'up') return startGame();
    if (action !== 'tap') return;
    if (Px.hit(MUTE, p, 4)) { Sfx.toggleMute(); if (!Sfx.isMuted()) Sfx.select(); return; }
    for (const b of BOXES) if (Px.hit(b, p, 2)) return choose(b.name);
    // toccando Martina si cambia divisa
    if (p.x > W / 2 - 36 && p.x < W / 2 + 36 && p.y > 80 && p.y < 206) {
      choose(CFG.OUTFITS[(CFG.OUTFITS.indexOf(outfit) + 1) % CFG.OUTFITS.length]);
      return;
    }
    if (Px.hit(START, p, 4)) startGame();
  }

  function startGame() {
    Save.set({ outfit });
    Sfx.select();
    app.go('intro', { outfit });
  }

  return { enter() {}, leave() {}, update, render, input };
}
