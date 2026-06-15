// Sirène — Service Worker
// Met tout en cache dès la première visite → fonctionne hors connexion ✓

const CACHE = "sirene-v3";

// Assets à précacher au démarrage
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
];

// ── Installation : précache les assets essentiels ──────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activation : supprime les vieux caches ────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : cache-first, réseau en fallback, mise en cache auto ───────────
self.addEventListener("fetch", event => {
  // Ignore les requêtes non-GET et l'API GitHub
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("api.github.com")) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Si en cache → retourner immédiatement
      if (cached) return cached;

      // Sinon → réseau + mise en cache pour la prochaine fois
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors connexion sans cache : retourne null (l'app gère l'erreur)
        return null;
      });
    })
  );
});
