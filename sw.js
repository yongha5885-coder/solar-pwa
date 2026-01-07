const CACHE = "harang-solar-pwa-v3";
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

// 네트워크 우선(최신 코드 우선), 실패 시 캐시
self.addEventListener("fetch", (e) => {
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      return res;
    } catch {
      const cached = await caches.match(e.request);
      return cached || caches.match("./index.html");
    }
  })());
});
