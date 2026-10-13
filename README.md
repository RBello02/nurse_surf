# Nurse Surf

Endless runner in pixel art ambientato nei corridoi di un ospedale, ispirato a Subway Surfers.
Una protagonista (frangia, occhi castani, capelli castano chiaro tendenti al biondo) corre tra barelle,
carrelli e cartelli di reparto, inseguita da un'infermiera con una siringa gigante "PFIZER".
Dopo un po' di corsa si apre il corridoio speciale che porta al finale: la corona d'alloro e "CONGRATULAZIONI!".

HTML5 Canvas + JavaScript puro: nessuna dipendenza per giocare, nessun file di immagini o audio
(sprite e suoni sono generati dal codice).

## Giocare (PC o telefono sulla stessa rete Wi-Fi)

```
npm start
```

Apri `http://localhost:8080` (dal telefono: `http://IP-DEL-PC:8080`). Porta diversa: `node server.js 3000`.
Senza Node basta anche `python3 -m http.server 8080` dentro la cartella.

## Comandi

| Azione | Touch | Tastiera (test) |
| --- | --- | --- |
| Cambio corsia | swipe sinistra / destra | frecce o A / D |
| Salto | swipe su | freccia su, W, spazio |
| Scivolata | swipe giu | freccia giu, S |
| Pausa | pulsante in alto a destra | - |

Nel menu: tocca una divisa (o la protagonista) per sceglierla, poi INIZIA.

## Su Android

**Come app dalla schermata Home (PWA):** pubblica la cartella su un hosting HTTPS (GitHub Pages, Netlify...),
apri il link con Chrome su Android e scegli "Aggiungi a schermata Home". Funziona anche offline.

**Come APK (serve Android Studio):**

```
npm install
npm run android:init     # una sola volta: crea la cartella android/
npm run android:sync     # ogni volta che cambi il gioco
npm run android:open     # apre Android Studio: Build > Build APK(s)
```

Per bloccare lo schermo in verticale aggiungi `android:screenOrientation="portrait"` all'`<activity>`
in `android/app/src/main/AndroidManifest.xml`.

## Personalizzare

- `js/config.js`: velocita', durata prima del finale (`FINALE_AFTER`, secondi), vite, colori dell'aspetto
  della protagonista (`HERO`) e testi del finale (`FINALE`: cartelli, striscione, sottotitolo).
- `js/hero.js`: sprite della protagonista e dell'infermiera inseguitrice.
- `js/props.js`: ostacoli (si saltano, ci si scivola sotto, oppure si cambia corsia).
- `js/finale.js`: sala della cerimonia e animazione della corona.

## Struttura

```
index.html  manifest.webmanifest  sw.js  server.js
css/style.css
js/  config  audio  sprites  hero  props  input  fx  world  game  menu  finale  main
scripts/  check.js (controllo sintassi)  build-www.js (prepara www/ per Capacitor)
```

`npm run check` controlla la sintassi di tutti gli script.
