const SW_VERSION = "2026-08-21 22:01:35";
const CACHE = 'screener-cache';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, {ignoreSearch: true});
    const net = fetch(req).then(res => {
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
        try { cache.put(req, res.clone()); } catch(_) {}
      }
      return res;
    }).catch(() => cached);
    return cached || net;
  })());
});
