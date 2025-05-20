const CACHE_NAME = "femmeiacloth-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // Add other assets (CSS, JS, images) you want to cache
];

// Install event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});