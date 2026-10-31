const CACHE = "gymbuddy-static-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["/icons/icon-192.png", "/icons/icon-512.png"]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isIcon = url.origin === self.location.origin && url.pathname.startsWith("/icons/");
  if (!isIcon) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
