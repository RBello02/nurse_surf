// Le tre porte dell'indovinello: si dorme / si parla / si mangia. Sprite in pixel reali (come gli ostacoli).
// get(kind) -> { base, leaf }: 'base' = stipite con luce dietro la porta, 'leaf' = anta (si apre ruotando verso sinistra).
const Doors = (() => {
  const W = 76, H = 124, LW = 64, LH = 118;
  const INK = PAL.ink, cache = {};
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const E = Px.ell;

  const SKIN = { A: ['#2a8f8a', '#4fc4b3', '#1c6460'], B: ['#8e5bd1', '#b48ae6', '#5f3a96'], C: ['#c9962a', '#f6c344', '#8c6414'], sleep: ['#2f4a9a', '#4a69b0', '#1d3170'], talk: ['#f28c28', '#ffb258', '#b9640f'], eat: ['#d23a52', '#ec6a80', '#9a2238'] };

  function iconSleep(c) {
    R(c, 6, 8, 52, 64, '#16236a');
    for (const [x, y] of [[44, 14], [14, 12], [48, 36], [10, 40], [30, 8]]) R(c, x, y, 2, 2, '#ffffff');
    E(c, 22, 26, 12, 12, '#ffe27a'); E(c, 28, 22, 10, 10, '#16236a');             // luna
    Px.text(c, 'Z', 36, 38, '#ffffff', 3, 'left'); Px.text(c, 'Z', 46, 26, '#ffffff', 2, 'left');
    R(c, 10, 64, 46, 5, '#8a5a2f'); R(c, 10, 54, 46, 10, '#ffffff');              // letto
    E(c, 18, 52, 8, 4, '#cfe3f0'); R(c, 28, 54, 28, 10, '#e0344b'); R(c, 28, 54, 28, 2, '#f06277');
    R(c, 10, 54, 2, 15, '#5f3b1a'); R(c, 54, 54, 2, 15, '#5f3b1a');
  }
  function iconTalk(c) {
    R(c, 6, 8, 52, 64, '#fff3d6');
    E(c, 24, 26, 18, 13, INK); E(c, 24, 26, 17, 12, '#ffffff'); R(c, 14, 36, 6, 8, INK); R(c, 15, 36, 4, 7, '#ffffff');
    Px.text(c, 'BLA', 24, 22, INK, 2, 'center');
    E(c, 38, 54, 17, 11, INK); E(c, 38, 54, 16, 10, '#9bd8ee'); R(c, 48, 62, 6, 7, INK); R(c, 49, 62, 4, 6, '#9bd8ee');
    for (let i = 0; i < 3; i++) R(c, 29 + i * 8, 53, 4, 4, INK);
  }
  function iconEat(c) {
    R(c, 6, 8, 52, 64, '#fff3d6');
    E(c, 31, 62, 24, 6, '#9aa5af'); E(c, 31, 60, 24, 5, '#e3e8ec');                  // piatto
    E(c, 31, 56, 18, 5, '#d9a05b');                                                  // panino sotto
    R(c, 13, 49, 36, 6, '#6b3f1f'); R(c, 13, 49, 36, 2, '#8a5530');                  // hamburger
    R(c, 11, 45, 40, 4, '#3fb858'); R(c, 13, 42, 36, 3, '#ffd23f');
    E(c, 31, 33, 19, 10, '#e0a85f'); R(c, 12, 38, 38, 4, '#e0a85f');
    E(c, 24, 28, 6, 3, '#f3c98a'); for (const [x, y] of [[20, 31], [30, 28], [38, 33], [27, 35]]) R(c, x, y, 3, 1, '#ffffff');
    L(c);
  }
  function L(c) { Px.line(c, 52, 20, 52, 38, 2, '#9aa5af'); Px.line(c, 49, 14, 49, 20, 1, '#9aa5af'); Px.line(c, 55, 14, 55, 20, 1, '#9aa5af'); }

  function iconLetter(c, kind) {
    R(c, 6, 8, 52, 64, '#fff3d6');
    R(c, 10, 12, 44, 56, '#ffffff'); R(c, 10, 12, 44, 2, '#e3e8ec');
    Px.text(c, kind, 31, 24, PAL.ink, 8, 'center');
  }

  function build(kind) {
    const [col, hi, lo] = SKIN[kind];
    const base = Px.outlined(Px.make(W, H, (c) => {
      R(c, 0, 0, W, H, '#6b4423'); R(c, 2, 2, W - 4, H - 2, '#8a5a2f'); R(c, 4, 4, W - 8, H - 4, '#5f3b1a');
      R(c, 6, 6, LW, LH, '#fff6c8'); R(c, 6, 6, LW, 6, '#ffe98a'); R(c, 10, 14, LW - 8, 2, '#ffffff');   // la luce dietro la porta
      R(c, 0, 0, W, 2, '#b5834a');
    }));
    const leaf = Px.outlined(Px.make(LW, LH, (c) => {
      Px.bev(c, 0, 0, LW, LH, col, hi, lo);
      R(c, 4, 4, 56, 68, '#10151f'); R(c, 5, 5, 54, 66, lo);
      c.save(); c.translate(-1, -1);
      (kind === 'sleep' ? iconSleep : kind === 'talk' ? iconTalk : kind === 'eat' ? iconEat : iconLetter)(c, kind);
      c.restore();
      Px.bev(c, 6, 80, 52, 30, col, lo, hi);               // pannello basso
      E(c, 54, 62, 3, 3, '#f6c344'); R(c, 52, 61, 2, 1, '#fff3b0');   // maniglia dorata
    }));
    return { base, leaf };
  }

  function get(kind) { return cache[kind] || (cache[kind] = build(kind)); }
  return { get, W, H };
})();
