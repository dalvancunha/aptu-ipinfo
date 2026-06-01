const CACHE_PREFIX = 'aptu-ipinfo';
const CACHE_VERSION = 'v5';
const APP_VERSION = 'app-2026-05-31-detail-v5';
const STATIC_CACHE_NAME = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  `/styles.css?v=${APP_VERSION}`,
  '/script.js',
  `/script.js?v=${APP_VERSION}`,
  '/manifest.webmanifest',
  '/assets/favicon.svg',
  '/assets/favicon.ico',
  '/assets/logo-aptu.svg',
  '/assets/logo-aptu-dark.svg',
  '/assets/whatsapp.svg',
  '/assets/apple-touch-icon.png',
  '/assets/pwa-icon-192.png',
  '/assets/pwa-icon-512.png',
  '/assets/pwa-icon-maskable-192.png',
  '/assets/pwa-icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallbackUrl) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(fallbackUrl || request, responseClone);
    }
    return networkResponse;
  } catch (_error) {
    return caches.match(fallbackUrl || request);
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok) {
    const responseClone = networkResponse.clone();
    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.put(request, responseClone);
  }
  return networkResponse;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Nunca interceptar requisicoes externas (nao usar respondWith).
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/index.html'));
    return;
  }

  const isAppCode =
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    requestUrl.pathname === '/script.js' ||
    requestUrl.pathname === '/styles.css';

  if (isAppCode) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  const shouldCacheFirst = ['image', 'font', 'manifest'].includes(event.request.destination);

  if (shouldCacheFirst) {
    event.respondWith(cacheFirst(event.request));
  }
});
