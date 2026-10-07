// Service Worker для «Ділення стовпчиком» (PWA, офлайн-режим)
// HTML-сторінка завжди береться зі свіжої мережі (і одразу перезаписує кеш),
// інші файли оновлюються у фоні при кожному запиті.
// Змінюйте номер у CACHE_NAME лише щоб примусово очистити всі старі кеші.
const CACHE_NAME = 'dilennya-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/dilennya-stovpchykom-740-na-4.webp',
  './images/dilennya-stovpchykom-740-na-4.jpg',
  './images/dilennya-z-ostacheyu-1695-na-16.webp',
  './images/dilennya-z-ostacheyu-1695-na-16.jpg',
  './images/dilennya-stovpchykom-5492656-na-52.webp',
  './images/dilennya-stovpchykom-5492656-na-52.jpg'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // кожен файл кешується окремо: якщо якогось нема — решта все одно збережеться
      return Promise.all(ASSETS.map(function(url){
        return cache.add(url).catch(function(){ /* не критично */ });
      }));
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; })
                             .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  const req = event.request;
  const isHTML = req.mode === 'navigate' ||
    (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') !== -1);

  if(isHTML){
    event.respondWith(
      fetch(req, { cache: 'no-cache' }).then(function(res){
        if(res && res.ok){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached){
      const network = fetch(req, { cache: 'no-cache' }).then(function(res){
        if(res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
