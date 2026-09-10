const SW_VERSION = "2026-09-11 00:04:59";
const CACHE = 'screener-cache';
const NETWORK_FIRST = [/data\.json/, /sector_hist\.json/, /index\.html?$/, /\/screener\/$/];
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))));
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const isData = NETWORK_FIRST.some(re => re.test(req.url));
  if (isData) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const net = await fetch(req, {cache: 'no-store'});
        if (net && net.ok) { try { cache.put(req, net.clone()); } catch(_) {} }
        return net;
      } catch (err) {
        const cached = await cache.match(req);
        if (cached) return cached;
        throw err;
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const net = fetch(req).then(res => {
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
        try { cache.put(req, res.clone()); } catch(_) {}
      }
      return res;
    }).catch(() => cached);
    return cached || net;
  })());
});
