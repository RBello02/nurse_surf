// Compila la versione 3D (src3d/ + three.js) in un unico file: js3d/nurse3d.js. Uso: npm run build3d
const esbuild = require('esbuild');
const path = require('path');
esbuild.build({
  entryPoints: [path.join(__dirname, '..', 'src3d', 'app.js')],
  bundle: true, minify: true, format: 'iife', target: ['es2019'], legalComments: 'none',
  outfile: path.join(__dirname, '..', 'js3d', 'nurse3d.js')
}).then(() => console.log('js3d/nurse3d.js pronto')).catch(() => process.exit(1));
