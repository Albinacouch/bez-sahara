// Offline support: serve the app shell and fonts from cache, refresh in the background.
// Firebase traffic (login, database) always goes straight to the network.
const CACHE = "sugarfree-v3";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
const CACHEABLE = url =>
  url.origin === self.location.origin ||
  url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" ||
  (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/"));

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || !CACHEABLE(url)) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request);
    const fresh = fetch(e.request).then(res => {
      if (res.ok || res.type === "opaque") cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
