// Gestione input: swipe touch, tap, tastiera (per test su PC).
// Emette azioni astratte: left, right, up, down, tap (con coordinate logiche).
const Input = (() => {
  const listeners = [];
  let canvas = null;
  let start = null;
  const SWIPE_MIN = 18;     // pixel schermo minimi per riconoscere uno swipe
  const SWIPE_MAX_TIME = 600;

  function emit(action, data) {
    for (const fn of listeners) fn(action, data);
  }

  function toLogical(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * CFG.W,
      y: ((clientY - r.top) / r.height) * CFG.H
    };
  }

  function onDown(e) {
    Sfx.unlock();
    const p = e.changedTouches ? e.changedTouches[0] : e;
    start = { x: p.clientX, y: p.clientY, t: performance.now(), fired: false };
    if (e.cancelable) e.preventDefault();
  }

  function onMove(e) {
    if (!start || start.fired) return;
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;
    start.fired = true;
    if (Math.abs(dx) > Math.abs(dy)) emit(dx > 0 ? 'right' : 'left');
    else emit(dy > 0 ? 'down' : 'up');
    if (e.cancelable) e.preventDefault();
  }

  function onUp(e) {
    if (!start) return;
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const dt = performance.now() - start.t;
    if (!start.fired) {
      const dx = p.clientX - start.x;
      const dy = p.clientY - start.y;
      if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN && dt < SWIPE_MAX_TIME) {
        emit('tap', toLogical(p.clientX, p.clientY));
      }
    }
    start = null;
    if (e.cancelable) e.preventDefault();
  }

  const KEYS = {
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up', ' ': 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    Enter: 'confirm'
  };

  function onKey(e) {
    const a = KEYS[e.key];
    if (!a) return;
    Sfx.unlock();
    e.preventDefault();
    if (e.repeat) return;
    emit(a);
  }

  return {
    init(cv) {
      canvas = cv;
      if (window.PointerEvent) {
        cv.addEventListener('pointerdown', onDown);
        cv.addEventListener('pointermove', onMove);
        cv.addEventListener('pointerup', onUp);
        cv.addEventListener('pointercancel', () => { start = null; });
      } else {
        cv.addEventListener('touchstart', onDown, { passive: false });
        cv.addEventListener('touchmove', onMove, { passive: false });
        cv.addEventListener('touchend', onUp, { passive: false });
        cv.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }
      window.addEventListener('keydown', onKey);
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    on(fn) { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; }
  };
})();
