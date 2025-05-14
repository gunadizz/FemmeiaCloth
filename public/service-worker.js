self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('femmeiacloth-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        './index.html',
        '/IMG_3593.jpeg',
        '/IMG_3593.jpeg',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
