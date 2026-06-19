const CACHE_NAME = 'puerto-araujo-noticias-v1';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/styles/importer.css',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

self.addEventListener('install', event => {

  console.log('✅ Service Worker instalado');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );

});

self.addEventListener('activate', event => {

  console.log('✅ Service Worker activado');

  event.waitUntil(
    caches.keys().then(cacheNames => {

      return Promise.all(

        cacheNames.map(cache => {

          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }

        })

      );

    })
  );

});

self.addEventListener('fetch', event => {

  event.respondWith(

    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })

  );

});