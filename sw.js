// Pixel Arcade service worker: makes the arcade installable and playable offline.
// Pages and the games' own scripts are fetched network-first, skipping the browser's HTTP cache (GitHub Pages
// lets it keep pages for 10 minutes), so new releases show up right away when online.
// Everything else is served from the cache.
// Bump CACHE on every release (of any game) so old files get cleaned up.
const CACHE = 'pixel-arcade-v2.77.0';
const ASSETS = [
  './',
  './index.html',
  './thief.html',
  './racer.html',
  './heist.html',
  './pong.html',
  './football.html',
  './hoops.html',
  './wings.html',
  './gunner.js',
  './skyrun.html',
  './fish.html',
  './skate.html',
  './ski.html',
  './boxfight.html',
  './bike.html',
  './cook.html',
  './runs.html',
  './skygp.html',
  './moto.html',
  './defense.html',
  './pad.html',
  './vendor/three.module.min.js',
  './vendor/three.core.min.js',
  './vendor/qrcode.js',
  './vendor/peerjs.min.js',
  './common.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Each page is cached under its own address (the arcade at ./ is index.html).
const pageKey = url => { const u = new URL(url); u.search = ''; u.hash = ''; return u.pathname.endsWith('/') ? new URL('index.html', u).href : u.href; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Pages and the games' own scripts (common.js, gunner.js) are fetched fresh, together: a new page with an old
  // common.js from the cache would call things that are not there yet, and the game would freeze. The big
  // libraries in vendor/ do not change with a release and stay cache-first.
  const page = req.mode === 'navigate';
  if (page || (req.destination === 'script' && !new URL(req.url).pathname.includes('/vendor/'))) {
    const key = page ? pageKey(req.url) : req.url;
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
          return res;
        })
        .catch(() => caches.match(key).then(hit => hit || (page ? caches.match('./index.html') : Response.error())))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
