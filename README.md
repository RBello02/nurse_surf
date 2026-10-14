# Nurse Surf

Endless runner in pixel art ambientato nei corridoi di un ospedale, ispirato a Subway Surfers.
Martina (capelli castano scuro raccolti con frangia, occhi castani; nella divisa "elegante" indossa la tuta salvia con tracolla rossa) arriva all'ospedale, si presenta come studentessa di infermieristica venuta a fare il tirocinio e
l'infermiera vuole farle la puntura con una siringa gigante "PFIZER": da qui parte la fuga. Si corre tra lettini con
pazienti, carrelli e cartelli di reparto, raccogliendo le medagliette CFU. A 60 CFU l'ospedale lascia il posto all'universita' (aule in legno, librerie, bacheche; ostacoli: pile di libri, zaini, risme di fogli, professore col voto, librerie, lavagne, cartelli di aula). A 105 CFU la corsa si ferma per l'indovinello delle tre porte ("QUANDO SI DORME?": si dorme / si parla / si mangia): con la porta giusta si entra e si prosegue, con quella sbagliata la porta resta chiusa e arriva l'infermiera con la puntura (fine partita). A 150 CFU si apre il corridoio speciale
che porta al finale: la corona d'alloro e "CONGRATULAZIONI!".

Come si riconoscono gli ostacoli (sopra ognuno compare anche un'icona):
- oggetti **bassi** a terra (cartello "pavimento bagnato", secchio col mocio, scatole, barriera) con freccia gialla su: **salta**
- cartelli di reparto **appesi** al soffitto con frecce verso il basso, freccia azzurra giu: **scivola** sotto
- oggetti **alti** (lettini con pazienti, sedia a rotelle, carrello, distributore) con freccia rossa laterale: **cambia corsia**

HTML5 Canvas + JavaScript puro: nessuna dipendenza per giocare, nessun file di immagini o audio
(sprite e suoni sono generati dal codice).

## Gioca subito

**[Apri il gioco](https://rawcdn.githack.com/RBello02/nurse_surf/a25a6ac37803ea62c07cf5fe9027df18ade06cdf/index.html)**: funziona dal browser del telefono, senza installare nulla
(link: https://rawcdn.githack.com/RBello02/nurse_surf/a25a6ac37803ea62c07cf5fe9027df18ade06cdf/index.html).
Il link e' fissato a una versione precisa: dopo ogni aggiornamento viene rigenerato con `node scripts/update-play-link.js`.

## Giocare in locale (PC o telefono sulla stessa rete Wi-Fi)

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

Nel menu: tocca una divisa (o Martina) per sceglierla, poi INIZIA. Nella scena iniziale le battute avanzano solo toccando lo schermo (oppure SALTA). Ogni 6 CFU raccolti si recupera una vita.

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

- `js/config.js`: nome (`NAME`), copione della scena iniziale (`INTRO.script`: chi parla e le righe di ogni fumetto; si va avanti toccando), velocita', obiettivo di CFU (`CFU_GOAL`, 150), CFU per medaglietta (`CFU_PER_MEDAL`), CFU a cui si passa all'universita' (`UNI_AT_CFU`, 60), frasi dell'inseguitrice per ambiente (`ZONES`), indovinello delle porte (`DOOR`: CFU a cui compare, domanda, risposta giusta, etichette), vite, colori dell'aspetto
  della protagonista (`HERO`) e testi del finale (`FINALE`: cartelli, striscione, sottotitolo).
- `js/hero.js`: sprite della protagonista e dell'infermiera inseguitrice.
- `js/props.js`: ostacoli (si saltano, ci si scivola sotto, oppure si cambia corsia).
- `js/intro.js`: scena iniziale (esterno dell'ospedale, atrio, battute).
- `js/finale.js`: sala della cerimonia e animazione della corona.

## Struttura

```
index.html  manifest.webmanifest  sw.js  server.js
css/style.css
js/  config  audio  sprites  hero  props  doors  input  fx  world  game  intro  menu  finale  main
scripts/  check.js (controllo sintassi)  build-www.js (prepara www/ per Capacitor)
```

`npm run check` controlla la sintassi di tutti gli script.
