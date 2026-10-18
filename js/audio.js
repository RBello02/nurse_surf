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

  // Voce sintetica "animale": oscillatore con formante (filtro passa-banda), vibrato e, volendo, distorsione
  function voice(f0, f1, dur, vol, delay, o = {}) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator(), g = c.createGain(), flt = c.createBiquadFilter();
    osc.type = o.type || 'sawtooth';
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    flt.type = 'bandpass'; flt.frequency.value = o.formant || 1000; flt.Q.value = o.q || 2;
    if (o.vib) {                                    // vibrato / ringhio
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = o.vibDepth || 30;
      lfo.connect(lg).connect(osc.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc.connect(flt);
    if (o.dist) {
      const ws = c.createWaveShaper(), curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * o.dist); }
      ws.curve = curve; node = node.connect(ws);
    }
    node.connect(g).connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
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
    // gallina: tre "bok bok bok" secchi e uno "coccodeee" lungo e acuto con vibrato
    cluck() {
      [0, 0.16, 0.32].forEach((d, i) => voice(520 + i * 40, 880 + i * 60, 0.11, 0.35, d, { type: 'sawtooth', formant: 1300, q: 3 }));
      voice(700, 1250, 0.18, 0.4, 0.55, { formant: 1500, q: 2.5 });
      voice(1250, 780, 0.6, 0.42, 0.74, { formant: 1400, q: 2, vib: 22, vibDepth: 110 });
      noise(0.12, 0.05, 0.55);
    },
    // sumo: tamburo taiko, "HAI!" gridato e pestone che fa tremare il pavimento
    sumo() {
      tone(110, 0.45, 'sine', 0.55, 45, 0); noise(0.12, 0.2, 0);
      voice(210, 250, 0.16, 0.5, 0.12, { type: 'sawtooth', formant: 820, q: 2.2, vib: 9, vibDepth: 6, dist: 2 });
      voice(250, 310, 0.34, 0.5, 0.26, { type: 'sawtooth', formant: 2300, q: 2.2, vib: 7, vibDepth: 8, dist: 2 });
      tone(70, 0.5, 'sine', 0.6, 35, 0.62); noise(0.22, 0.18, 0.62);
    },
    // ruggito da gigante: ringhio basso distorto con tremolo, rantolo di rumore e un secondo "GRAAH" piu' acuto
    roar() {
      voice(95, 48, 1.3, 0.55, 0, { type: 'sawtooth', formant: 260, q: 0.9, vib: 26, vibDepth: 14, dist: 4 });
      voice(190, 85, 1.0, 0.4, 0.05, { type: 'square', formant: 520, q: 1.2, vib: 34, vibDepth: 26, dist: 3 });
      voice(320, 150, 0.7, 0.25, 0.2, { type: 'sawtooth', formant: 900, q: 1.5, vib: 18, vibDepth: 20 });
      noise(1.0, 0.14, 0);
    },
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
