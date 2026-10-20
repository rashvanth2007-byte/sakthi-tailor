// Minimal offline support. Caches the core pages so the site still
// opens with no signal, and shows offline.html if a page that wasn't
// cached is requested while offline.

const CACHE_NAME = "sakthi-tailor-v4";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/training.html",
  "/offline.html",
  "/styles.css",
  "/script.js",
  "/images/hero-workshop.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match("/offline.html"))
    )
  );
});
