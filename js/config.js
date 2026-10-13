// Configurazione globale di Nurse Surf. Risoluzione logica 180x320 (pixel art), scalata a schermo intero.
const CFG = {
  W: 180,
  H: 320,
  LANES: 3,
  // Prospettiva: la corsia si allarga dall'orizzonte verso il basso
  HORIZON_Y: 92,
  PLAYER_Y: 258,
  LANE_X_NEAR: [34, 90, 146],
  LANE_X_FAR: [74, 90, 106],
  // Gameplay
  START_SPEED: 1.0,     // unita' di profondita' al secondo
  MAX_SPEED: 2.1,
  SPEED_GAIN: 0.018,    // incremento al secondo
  JUMP_TIME: 0.62,
  SLIDE_TIME: 0.6,
  LANE_SWITCH_TIME: 0.13,
  CHASER_START_GAP: 0.55,  // 0..1, distanza dell'inseguitrice (1 = lontanissima)
  CHASER_CLOSE_STEP: 0.22, // quanto si avvicina dopo ogni errore
  MAX_HITS: 3,
  // Finale: dopo quanti secondi di corsa compare il corridoio speciale
  FINALE_AFTER: 38,
  DEPTH_MAX: 1.0,
  // Aspetto della protagonista (coerente in tutto il gioco)
  HERO: {
    hair: '#c9a46a',       // castano chiaro tendente al biondo
    hairShade: '#a8834d',
    eyes: '#5a3416',       // castani
    skin: '#f2c9a5',
    skinShade: '#d9a982'
  },
  // Testi personalizzabili del finale
  FINALE: {
    gateText: 'TRAGUARDO',
    doorText: 'AULA MAGNA',
    hallBanner: 'LAUREA',
    chaserLine: 'BRAVA!',
    subtitle: 'BRAVISSIMA!',   // lascia '' per non mostrarlo
    title: 'CONGRATULAZIONI!'
  },
  OUTFITS: ['casual', 'elegante', 'uniforme'],
  OUTFIT_LABELS: { casual: 'CASUAL', elegante: 'ELEGANTE', uniforme: 'UNIFORME' },
  STORAGE_KEY: 'nursesurf.v1'
};

// Salvataggio locale (scelta della divisa, record). Non fallisce se lo storage e' bloccato.
const Save = {
  get() {
    try { return JSON.parse(localStorage.getItem(CFG.STORAGE_KEY)) || {}; } catch (e) { return {}; }
  },
  set(patch) {
    try { localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(Object.assign(Save.get(), patch))); } catch (e) { /* ignora */ }
  }
};

// Palette ospedale
const PAL = {
  ink: '#10151f',
  wallTop: '#cfe7ee', wallBot: '#a9d3dc', wallStripe: '#7fb7c4',
  floorA: '#e9f1f3', floorB: '#d3dfe3', floorLine: '#b7c6cc',
  ceiling: '#eef6f8', light: '#fffbe0',
  red: '#e0344b', redDark: '#a82036',
  green: '#3bb273', greenDark: '#26875a',
  blue: '#3e7bd6', blueDark: '#27559c',
  gold: '#f6c344', goldDark: '#c9962a',
  white: '#ffffff', grey: '#8b97a1', greyDark: '#5b6670',
  metal: '#c4ccd3', metalDark: '#8c97a1',
  yellow: '#ffd23f', orange: '#f28c28', purple: '#8e5bd1', pink: '#f08fb0'
};
