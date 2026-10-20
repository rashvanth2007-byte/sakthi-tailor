// Offline support. Pages: network first, so customers always see the latest
// details, falling back to the saved copy (or offline.html) with no signal.
// Static files (CSS, JS, images, language packs): cache first, refreshed in the background.
// Paths are relative to this file, so the site works on GitHub Pages' /sakthi-tailor/ path or a custom domain.

const CACHE_NAME = "sakthi-tailor-v7";
const CORE_ASSETS = [
  "./",
  "index.html",
  "training.html",
  "privacy.html",
  "terms.html",
  "offline.html",
  "styles.css",
  "config.js",
  "i18n.js",
  "script.js",
  "favicon.png",
  "logo.png",
  "icon-192.png",
  "manifest.json",
  "lang/ta.js",
  "lang/te.js",
  "lang/ml.js",
  "lang/kn.js",
  "lang/hi.js",
  "lang/ur.js",
  "images/aari-01.jpg",
  "images/design-02.jpg",
  "images/aari-02.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch Google, WhatsApp, etc.

  if (req.mode === "navigate") {
    // Pages are stored by path only, so ?lang=ta or ?service=Training still open offline
    const key = url.origin + url.pathname;
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(key, copy));
          return res;
        })
        .catch(() => caches.match(key).then((hit) => hit || caches.match("offline.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
