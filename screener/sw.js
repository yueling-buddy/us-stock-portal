// 由 portal-design/sync_screener_public.py 在部署时覆盖写入（数据请求 network-first）。
// 原因：原 cache-first + ignoreSearch 会让旧行情快照长期驻留，用户看到昨天的涨跌。
const SW_VERSION = "2026-09-09 23:59:41";
const CACHE = 'screener-cache-v2';
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
  const url = req.url;
  const isData = NETWORK_FIRST.some(re => re.test(url));

  // 数据/页面请求：网络优先，失败才回退缓存（保证行情永远是最新的）
  if (isData) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const net = await fetch(req, {cache: 'no-store'});
        if (net && net.ok) { try { cache.put(req, net.clone()); } catch (_) {} }
        return net;
      } catch (err) {
        const cached = await cache.match(req);
        if (cached) return cached;
        throw err;
      }
    })());
    return;
  }

  // 静态资源（如 vendor/echarts）：缓存优先，避免每次重下大文件
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const net = fetch(req).then(res => {
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
        try { cache.put(req, res.clone()); } catch (_) {}
      }
      return res;
    }).catch(() => cached);
    return cached || net;
  })());
});
