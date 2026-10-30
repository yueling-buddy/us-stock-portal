const SW_VERSION = "2026-10-31 03:55:51";
const CACHE = 'screener-cache';
const DATA_RE = [/data\.json/, /sector_hist\.json/];
const FRESH_MS = 10 * 60 * 1000;
const NET_TIMEOUT = 15000;
const PAGE_TIMEOUT = 5000;

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))));
  await self.clients.claim();
})()));

function fetchT(req, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => { try { ctl.abort(); } catch (_) {} }, ms);
  return fetch(req, {cache: 'no-store', signal: ctl.signal})
    .then(res => { clearTimeout(t); return res; })
    .catch(err => { clearTimeout(t); throw err; });
}

function canon(url) {
  try { const u = new URL(url); return u.origin + u.pathname; } catch (_) { return url; }
}

function store(cache, key, res) {
  try { if (res && res.ok) { const c = res.clone(); cache.put(key, c).catch(() => {}); } } catch (_) {}
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  const isData = DATA_RE.some(re => re.test(req.url));
  const isPage = req.mode === 'navigate' || req.destination === 'document' || /index\.html?$/.test(req.url);

  if (isData) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const key = new Request(canon(req.url));
      const cached = await cache.match(key);
      const net = () => fetchT(req, NET_TIMEOUT).then(res => { store(cache, key, res); return res; });
      if (cached) {
        const ts = Date.parse(cached.headers.get('date') || '');
        const age = isNaN(ts) ? Infinity : (Date.now() - ts);
        if (age < FRESH_MS) { net().catch(() => {}); return cached; }
        try { return await net(); } catch (_) { return cached; }
      }
      return net();
    })());
    return;
  }

  if (isPage) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const key = new Request(canon(req.url));
      try {
        const res = await fetchT(req, PAGE_TIMEOUT);
        store(cache, key, res);
        return res;
      } catch (err) {
        const cached = (await cache.match(key)) || (await cache.match(req, {ignoreSearch: true}));
        if (cached) return cached;
        throw err;
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = new Request(canon(req.url));
    const cached = await cache.match(key);
    const net = fetch(req).then(res => { store(cache, key, res); return res; }).catch(() => null);
    if (cached) { net.catch(() => {}); return cached; }
    const res = await net;
    if (res) return res;
    throw new Error('offline');
  })());
});
