// Effetti sonori sintetizzati con WebAudio: nessun file audio da caricare.
const Sfx = (() => {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'square', vol = 0.08, slideTo = null, delay = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol = 0.06, delay = 0) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource();
    const g = c.createGain();
    g.gain.value = vol;
    s.buffer = buf;
    s.connect(g).connect(c.destination);
    s.start(c.currentTime + delay);
  }

  // Melodia allegra semplice per il gameplay (arpeggio in Do maggiore)
  const MELODY = [523, 659, 784, 659, 587, 740, 880, 740, 523, 659, 784, 1047, 880, 784, 659, 587];
  const BASS = [131, 131, 196, 196, 147, 147, 196, 196];

  function startMusic() {
    stopMusic();
    musicStep = 0;
    musicTimer = setInterval(() => {
      if (muted) return;
      tone(MELODY[musicStep % MELODY.length], 0.11, 'square', 0.025);
      if (musicStep % 2 === 0) tone(BASS[(musicStep / 2) % BASS.length], 0.2, 'triangle', 0.05);
      musicStep++;
    }, 140);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  return {
    unlock: ensure,
    isMuted: () => muted,
    toggleMute() { muted = !muted; if (muted) stopMusic(); return muted; },
    startMusic, stopMusic,
    jump() { tone(300, 0.18, 'square', 0.07, 700); },
    slide() { noise(0.18, 0.05); tone(220, 0.15, 'sawtooth', 0.03, 110); },
    lane() { tone(440, 0.06, 'triangle', 0.05, 520); },
    coin() { tone(988, 0.07, 'square', 0.06); tone(1319, 0.14, 'square', 0.06, null, 0.07); },
    hit() { noise(0.25, 0.1); tone(180, 0.3, 'sawtooth', 0.09, 60); },
    cluck() { [0, 0.14, 0.28, 0.5].forEach((d, i) => { tone(560 + i * 90, 0.12, 'square', 0.07, 900 + i * 60, d); tone(300, 0.1, 'sawtooth', 0.03, 520, d); }); noise(0.35, 0.05, 0.5); },
    roar() { noise(0.7, 0.12); tone(110, 0.8, 'sawtooth', 0.12, 45); tone(220, 0.5, 'square', 0.05, 90, 0.1); },
    warn() { tone(660, 0.1, 'square', 0.05); tone(550, 0.1, 'square', 0.05, null, 0.12); },
    select() { tone(660, 0.07, 'square', 0.06); tone(880, 0.09, 'square', 0.06, null, 0.07); },
    start() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.07, null, i * 0.09)); },
    gameOver() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, null, i * 0.18)); },
    door() { tone(150, 0.4, 'sawtooth', 0.05, 300); },
    fanfare() {
      const seq = [523, 523, 523, 698, 659, 659, 659, 784, 880, 1047];
      seq.forEach((f, i) => tone(f, 0.2, 'square', 0.07, null, i * 0.16));
      [262, 349, 392, 523].forEach((f, i) => tone(f, 0.5, 'triangle', 0.06, null, 0.6 + i * 0.3));
    },
    sparkle() { tone(1568 + Math.random() * 600, 0.08, 'triangle', 0.04); }
  };
})();
