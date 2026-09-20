const CACHE_VERSION = "biostack-pro-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle normal GET requests.
  if (request.method !== "GET") {
    return;
  }

  // Keep navigation requests network-first so new deployments
  // are picked up immediately instead of being trapped in stale cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
  }
});
