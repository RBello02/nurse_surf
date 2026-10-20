// Configurazione globale di Nurse Surf. Risoluzione logica 180x320 (pixel art), scalata a schermo intero.
const CFG = {
  NAME: 'MARTINA',
  W: 180,
  H: 320,
  RES: 4,         // pixel reali per unita' di progetto (720x1280)
  LANES: 3,
  // Prospettiva: la corsia si allarga dall'orizzonte verso il basso
  HORIZON_Y: 110,
  PLAYER_Y: 258,
  LANE_X_NEAR: [34, 90, 146],
  LANE_X_FAR: [74, 90, 106],
  // Gameplay
  START_SPEED: 0.9,     // unita' di profondita' al secondo
  MAX_SPEED: 1.9,
  SPEED_GAIN: 0.0125,    // incremento al secondo
  RAMP_TIME: 70,        // secondi per arrivare alla difficolta' massima
  JUMP_TIME: 0.7,
  JUMP_PEAK: 46,        // altezza massima del salto (unita')
  HERO_K: 1.4,          // scala di Martina nel gioco
  SLIDE_TIME: 0.6,
  LANE_SWITCH_TIME: 0.13,
  CHASER_START_GAP: 0.55,  // 0..1, distanza dell'inseguitrice (1 = lontanissima)
  CHASER_CLOSE_STEP: 0.22, // quanto si avvicina dopo ogni errore
  MAX_HITS: 3,
  // Obiettivo: 150 CFU totali. Ogni medaglietta ne vale CFU_PER_MEDAL.
  // A UNI_AT_CFU l'ospedale finisce e comincia l'universita'; a CFU_GOAL si apre il corridoio del finale.
  CFU_GOAL: 150,
  CFU_PER_MEDAL: 3,
  UNI_AT_CFU: 60,
  // Indovinelli delle tre porte. A atCfu la corsa si ferma. Risposta giusta (right: true) = si entra e si prosegue,
  // sbagliata = la porta resta chiusa e l'infermiera fa la puntura (fine partita).
  // kind: 'sleep' | 'talk' | 'eat' (porte con disegno) oppure 'A' | 'B' | 'C' (porte con lettera, per domande scritte).
  // zone: 'hospital' = la domanda arriva in ospedale (prima dell'universita'); senza zone arriva all'universita'.
  // label: max 9 caratteri. question: una o due righe (max ~26 caratteri). poison: dopo la puntura Martina diventa verde e gigantesca (sprite "big" in hero.js).
  DOOR: {
    puzzles: [
      { atCfu: 30, zone: 'hospital', question: ["COSA TI CHIESE L'INFERMIERE", 'DURANTE IL TIROCINIO?'], poison: true, doors: [
        { kind: 'A', label: 'SINCOPE', right: true }, { kind: 'B', label: 'EMBOLIA' }, { kind: 'C', label: 'ISCHEMIA' }] },
      { atCfu: 45, zone: 'hospital', question: ["QUAL E' STATO IL TUO PASTO", "PIU' DISCUTIBILE IN REPARTO?"], poison: true, doors: [
        { kind: 'A', label: 'PASTA' }, { kind: 'B', label: 'POLLO ROSA', right: true }, { kind: 'C', label: "PURE'" }] },
      { atCfu: 105, question: ['IN UN ARMADIO DEL REPARTO', 'TI SIEDI DI NASCOSTO.', 'COSA SENTI SOTTO DI TE?'], poison: true, doors: [
        { kind: 'A', label: 'INFERMIERE' }, { kind: 'B', label: 'MATERASSI' }, { kind: 'C', label: 'DEFUNTO', right: true }] },
      { atCfu: 125, question: ['UROLOGIA: EMATURIA INDOLORE', 'IN UN FUMATORE DI 60 ANNI.', 'PRIMO SOSPETTO?'], poison: true, doors: [
        { kind: 'A', label: 'VESCICA', right: true }, { kind: 'B', label: 'PROSTATA' }, { kind: 'C', label: 'CALCOLI' }] },
      { atCfu: 140, question: ["QUAL E' IL VERO MIRACOLO", 'DI QUESTA LAUREA?'], poison: true, doors: [
        { kind: 'A', label: 'IMPARATO' }, { kind: 'B', label: 'SOPRAVVIVO' }, { kind: 'C', label: 'NO LITI', right: true }] }
    ]
  },
  ZONES: {
    hospital: { bubbles: ['SOLO UNA PUNTURINA!', 'FERMA LI!', 'NON FA MALE!', 'VIENI QUI!'] },
    uni: { gate: "UNIVERSITA'", banner: "BENVENUTA ALL'UNIVERSITA'!", bubbles: ['ANCHE ALL\'UNI!', 'TI TROVO OVUNQUE!', 'RICHIAMO VACCINALE!', 'VIENI QUI!'] }
  },
  DEPTH_MAX: 1.0,
  // Aspetto della protagonista (coerente in tutto il gioco)
  HERO: {
    hair: '#5a3a26',       // castano scuro (come nella foto)
    hairShade: '#3e281a',
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
    subtitle: 'BRAVISSIMA MARTINA!',   // lascia '' per non mostrarlo
    title: 'CONGRATULAZIONI!'
  },
  // Scena iniziale (testi dei fumetti)
  INTRO: {
    sign: 'OSPEDALE',
    // Copione: who = 'm' (Martina) o 'n' (infermiera); lines = righe del fumetto (max ~23 caratteri).
    // La prima battuta dell'infermiera fa entrare in scena la nurse. 'scare' = Martina spaventata.
    script: [
      { who: 'm', lines: ['PIACERE, SONO MARTINA!', 'SONO UNA STUDENTESSA', 'DI INFERMIERISTICA.'] },
      { who: 'm', lines: ['SONO VENUTA A FARE', 'IL TIROCINIO!'] },
      { who: 'n', lines: ['BENVENUTA, MARTINA!', 'MA PRIMA...'] },
      { who: 'n', lines: ['DEVO FARTI LA', 'PUNTURINA! VIENI QUI,', 'NON FA MALE!'] },
      { who: 'n', lines: ['E\' IL REGOLAMENTO', 'DEL REPARTO! SU,', 'BRACCIO!'] },
      { who: 'm', lines: ['COSA?! NO NO NO!', 'SCAPPOOO!'], scare: true }
    ]
  },
  OUTFITS: ['casual', 'elegante', 'uniforme'],
  OUTFIT_TITLES: { casual: 'VESTITO DI LAUREA', elegante: 'ELEGANTE', uniforme: 'UNIFORME' },   // nome esteso sotto Martina
  OUTFIT_LABELS: { casual: 'LAUREA', elegante: 'ELEGANTE', uniforme: 'UNIFORME' },
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
