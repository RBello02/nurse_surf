// Aggiorna nel README il link per giocare con l'ultimo commit: node scripts/update-play-link.js [hash]
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const hash = process.argv[2] || execSync('git rev-parse HEAD', { cwd: path.join(__dirname, '..') }).toString().trim();
const file = path.join(__dirname, '..', 'README.md');
const url = `https://rawcdn.githack.com/RBello02/nurse_surf/${hash}/index.html`;
let s = fs.readFileSync(file, 'utf8');
const re = /https:\/\/rawcdn\.githack\.com\/RBello02\/nurse_surf\/[0-9a-f]+\/index\.html/g;
if (!re.test(s)) throw new Error('Link non trovato nel README');
fs.writeFileSync(file, s.replace(re, url));
console.log(url);
