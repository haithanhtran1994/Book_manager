// Service worker: cache app shell + thư viện SheetJS để mở app khi offline.
// File .xlsx/.csv và GitHub API KHÔNG được cache (luôn lấy dữ liệu mới).
const CACHE = 'bookmgr-v1';
const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(['./app.html', LIB].map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isShell = url.origin === location.origin && /(\/|app\.html)$/.test(url.pathname);
  const isLib = req.url === LIB;
  if (!isShell && !isLib) return;
  // network-first, fallback cache
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./app.html')))
  );
});