const CACHE_NAME = "biled-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/style.css",
  "/main.js",
  "/bleManager.js",
  "/license.js",
  "/vendor.js",
  "/gallery.js",
  "/upload.js",
  "/toast.js",
  "/assets/logoBiled.png",
  "/assets/sounds/connected_voice.mp3",
  "/assets/sounds/disconnected_voice.mp3",
  // dan tambahkan file .gif, .h, dll yang ingin di-cache
];

// serviceWorker.js
self.addEventListener("install", (event) => {
  console.log("[SW] Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
