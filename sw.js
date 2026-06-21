const CACHE_NAME = 'medtools-cache-v3'; // Version bump to flush old caches
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// Install Event - Pre-caches critical asset structures
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return caches.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Sweeps out legacy outdated caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Strategic Network-First for HTML/Manifest, Cache-First for others
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-First for core workspace files to ensure instant updates
  if (url.pathname.endsWith('index.html') || url.pathname.endsWith('manifest.json') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-First fallback to Network for static assets
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(e.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return response;
        });
      })
    );
  }
});
