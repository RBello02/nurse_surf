// Copia i file del gioco in www/ (cartella usata da Capacitor per creare l'APK): npm run build
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons']) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
console.log('Creato www/ con i file del gioco');
