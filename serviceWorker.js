const STATIC_CACHE = "ble-static-v2";
const DYNAMIC_CACHE = "ble-dynamic-v2";
const API_CACHE = "ble-api-v2";

const staticUrlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/main.js",
  "/manifest.json",
  "/assets/modules/bleManager.js",
  "/assets/modules/gallery.js",
  "/assets/modules/license.js",
  "/assets/modules/vendor.js",
  "/assets/modules/upload.js",
  "/assets/modules/servo.js",
  "/assets/modules/toast.js",
  "/assets/modules/modal.js",
  "/assets/modules/config.js",
  "/assets/modules/utils.js",
  "/assets/modules/cache.js",
  "/assets/logo/logo-light.png",
  "/icons/icon-192.png",
  "/assets/sounds/connected_voice.mp3",
  "/assets/sounds/disconnected_voice.mp3",
  "/assets/sounds/welcome_connect.mp3",
  "/assets/sounds/error.mp3"
];

// Resources that should be cached dynamically
const dynamicCachePatterns = [
  /\/data\/.*\.(gif|h)$/,
  /\/assets\/gif\/.*\.gif$/,
  /\/assets\/header\/.*\.h$/,
  /\/assets\/sounds\/.*\.mp3$/
];

self.addEventListener("install", (event) => {
  console.log("[SW] Installing with enhanced cache");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(staticUrlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating and cleaning old caches");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log("[SW] API fallback to cache for:", url.pathname);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle dynamic resources (animations, headers, sounds)
  const isDynamicResource = dynamicCachePatterns.some(pattern => 
    pattern.test(url.pathname)
  );
  
  if (isDynamicResource) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Serving from dynamic cache:", url.pathname);
            return cachedResponse;
          }
          
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              console.log("[SW] Caching dynamic resource:", url.pathname);
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((error) => {
            console.log("[SW] Failed to fetch dynamic resource:", url.pathname, error);
            throw error;
          });
        });
      })
    );
    return;
  }
  
  // Handle static resources with cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        if (!response.ok) {
          return response;
        }
        
        const responseClone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      });
    })
  );
});