// Service worker: permette il gioco offline una volta caricato.
const CACHE = 'nursesurf-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css', './icons/icon.svg',
  './js/config.js', './js/audio.js', './js/sprites.js', './js/hero.js', './js/props.js', './js/input.js', './js/fx.js', './js/world.js',
  './js/game.js', './js/intro.js', './js/menu.js', './js/finale.js', './js/main.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
