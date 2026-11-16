// Pixel Arcade service worker: makes the arcade installable and playable offline.
// Pages and the games' own scripts are fetched network-first, skipping the browser's HTTP cache (GitHub Pages
// lets it keep pages for 10 minutes), so new releases show up right away when online.
// Everything else is served from the cache.
// Bump CACHE on every release (of any game) so old files get cleaned up.
const CACHE = 'pixel-arcade-v2.106.0';
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
  './hook.html',
  './miner.html',
  './horde.html',
  './snake.html',
  './farm.html',
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
  if (req.cache === 'no-store') return;      // asked for fresh on purpose (the arcade checking for a new version)

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

// --- NOTIFICATIONS (PX.Push in common.js): the server sends { title, body, url, tag }, already in the arcade's words.
// A tap opens that page (the arcade, or a game with ?join= for an invite): a tab showing it is brought to the front,
// or else a tab with the arcade's menu goes there (never a tab with a game running), otherwise a new one opens.
self.addEventListener('push', e => {
  let n = null;
  try { n = e.data && e.data.json(); } catch (x) { n = null; }
  if (!n || typeof n.title !== 'string') n = { title: 'PIXEL ARCADE', body: 'SOMETHING NEW IS WAITING FOR YOU.', url: 'index.html', tag: 'arcade' };
  e.waitUntil(self.registration.showNotification(n.title, {
    body: n.body || '',
    tag: n.tag || 'arcade',
    renotify: true,
    icon: 'icons/icon-192.png',
    badge: 'icons/favicon-32.png',
    data: { url: typeof n.url === 'string' ? n.url : 'index.html' },
    // a call (CALL in a friend's chat): it rings like a phone, as much as a notification can: a long buzz, and it
    // stays on the screen until you tap it or swipe it away
    ...(n.call === true ? { vibrate: [600, 300, 600, 300, 600, 300, 600, 300, 600, 300, 600], requireInteraction: true } : {}),
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || 'index.html', self.registration.scope);
  if (url.origin !== location.origin) return;
  e.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const same = tabs.find(c => c.url === url.href) || (url.search ? null : tabs.find(c => pageKey(c.url) === pageKey(url.href)));
    if (same) return same.focus();
    const menu = tabs.find(c => 'navigate' in c && pageKey(c.url) === new URL('index.html', self.registration.scope).href);
    if (menu) { try { const c = await menu.navigate(url.href); if (c) return c.focus(); } catch (x) { /* not ours to move */ } }
    return self.clients.openWindow(url.href);
  })());
});
