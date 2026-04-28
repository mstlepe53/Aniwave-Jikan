const CACHE_NAME = 'dramalie-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/apple-icon.png',
  '/android-icon-192x192.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/server/') ||
      url.pathname.startsWith('/node_modules/') ||
      url.pathname.startsWith('/@vite/') ||
      url.pathname.includes('__vite'))
  ) {
    event.respondWith(fetch(request));
    return;
  }

  if (url.hostname === 'drama-api-ivory.vercel.app') {
    event.respondWith(fetch(request));
    return;
  }

  if (
    url.hostname.includes('mydramalist.com') ||
    url.hostname.includes('axcdn.top')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((r) => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
