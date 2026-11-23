// TDBMS offline support: keeps the app files on the device so it opens instantly, with or without network.
const CACHE = 'tdbms-v9';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'app-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // data goes straight to Google
  const fresh = () => fetch(req).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone())); return r; });
  if (url.pathname.endsWith('config.js')) { // settings: try network first
    e.respondWith(fresh().catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // app files: open instantly from the device, update in the background for next time
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fresh().catch(() => hit || caches.match('index.html'));
    return hit || net;
  }));
});
