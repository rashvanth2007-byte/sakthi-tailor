// Offline support.
// - Pages, CSS, JS and language packs: network first, so every update is
//   seen straight away; the saved copy is only used when there's no signal.
// - Images: cache first (they never change in place; new photos get new names).
// Cache keys ignore the query string, so ?lang=ta, ?service=... and the
// ?v= asset versions all map to one saved copy.
// Paths are relative to this file, so the site works on GitHub Pages'
// /sakthi-tailor/ path or on a custom domain.

const CACHE_NAME = "sakthi-tailor-v13";
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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS.map((u) => new Request(u, { cache: "reload" })))));
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

function keyFor(url) {
  return url.origin + url.pathname;
}

function save(key, res) {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE_NAME).then((c) => c.put(key, copy));
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch Google, WhatsApp, etc.
  const key = keyFor(url);

  if (req.destination === "image") {
    event.respondWith(
      caches.match(key).then((hit) => hit || fetch(req).then((res) => save(key, res)))
    );
    return;
  }

  event.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => save(key, res))
      .catch(() =>
        caches.match(key).then((hit) => hit || (req.mode === "navigate" ? caches.match("offline.html") : Response.error()))
      )
  );
});
