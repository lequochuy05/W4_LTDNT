const CACHE_VERSION = 'v1';
const CACHE_NAME_APP_SHELL = `${CACHE_VERSION}-app-shell`;
const CACHE_NAME_DYNAMIC = `${CACHE_VERSION}-dynamic`;

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  // Normally we would list Vite's generated assets here,
  // but Vite injects hashes. A common strategy for raw SW with Vite 
  // without Workbox is to cache assets on the fly.
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME_APP_SHELL).then((cache) => {
      console.log('[ServiceWorker] Pre-caching App Shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME_APP_SHELL && cacheName !== CACHE_NAME_DYNAMIC) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Network-Only for authentication requests (mocked as an example, though our mock is client-side)
  // If we had real /api/auth endpoints:
  if (url.pathname.startsWith('/api/auth')) {
    event.respondWith(fetch(request));
    return;
  }

  // 2. Cache-First for static assets (js, css, images in assets folder)
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          return caches.open(CACHE_NAME_APP_SHELL).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate for reference metadata (e.g. facilities list API if we had one)
  if (url.pathname.includes('/api/facilities')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          caches.open(CACHE_NAME_DYNAMIC).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Network-First for dynamic navigation or other API calls
  // (Fallback to Cache-Only offline page if it's a navigation request)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME_DYNAMIC).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // 5. Cache-Only for offline fallback
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Default fallback (Network-First)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME_DYNAMIC).then((cache) => {
          if (request.method === 'GET') {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => caches.match(request))
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-surveys') {
    console.log('[ServiceWorker] Background Sync triggered for sync-surveys');
    // Actual sync logic will trigger a client-side message or we could implement IDB here
    // But since the project uses IDB, we typically handle the sync via `postMessage` or directly
  }
});
