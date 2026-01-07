const CACHE = "harang-solar-pwa-v20260107"; // ✅ 버전 올림(중요)
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./logo.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : null));
    await self.clients.claim();
  })());
});

// 네트워크 우선(최신), 실패 시 캐시
self.addEventListener("fetch", (e) => {
  e.respondWith((async () => {
    try {
      return await fetch(e.request);
    } catch {
      const cached = await caches.match(e.request);
      return cached || caches.match("./index.html");
    }
  })());
});
