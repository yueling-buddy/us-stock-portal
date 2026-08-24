const SW_VERSION = "2026-08-25 03:01:03";
const CACHE = 'screener-cache';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const isPage = req.mode === 'navigate' || req.destination === 'document' || req.url.indexOf('/index.html') >= 0;
    if (isPage) {
      try {
        const net = await fetch(req);
        if (net && net.ok) { try { cache.put(req, net.clone()); } catch(_) {} }
        return net;
      } catch (_) {
        const cached = await cache.match(req, {ignoreSearch: true});
        return cached || Response.error();
      }
    }
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
