const CACHE = "wallet-shell-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./config.js",
  "./vendor/supabase.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })
        .then(hit => hit || (event.request.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = typeof data.title === "string" ? data.title.slice(0, 80) : "My Wallet";
  const body = typeof data.body === "string" ? data.body.slice(0, 200) : "Tap to log what you spent today.";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: "daily-reminder",
    renotify: true,
    data: { url: self.registration.scope }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = self.registration.scope;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(target)) { await w.focus(); w.postMessage({ type: "open-add" }); return; }
    }
    await self.clients.openWindow(target + "#add");
  })());
});
