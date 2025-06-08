const CACHE_NAME = "femmeiacloth--webstore-v1";
const urlsToCache = [
  "/",
  "/store/index.html",
  "/store/manifest.json",
  // Tambahkan path file CSS, JS, gambar produk, dll yang ingin dicache
];

// Install SW & cache resources
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate SW & remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

// Fetch from cache, fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
