const CACHE = "wallet-shell-v87";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./i18n.js",
  "./config.js",
  "./vendor/supabase.js",
  "./manifest.webmanifest",
  "./icons/icon-192-bs.png",
  "./icons/apple-touch-icon-bs.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const SHELL = /\.(js|css|webmanifest)$/;

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  const navigate = event.request.mode === "navigate";
  const key = navigate ? "./index.html" : event.request;
  if (navigate || SHELL.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const network = fetch(event.request, { cache: "no-cache" }).then(response => {
        if (response.ok) cache.put(key, response.clone());
        return response;
      });
      const timeout = new Promise(resolve => setTimeout(resolve, 2500, null));
      try {
        const fresh = await Promise.race([network, timeout]);
        if (fresh) return fresh;
      } catch { }
      const cached = await cache.match(key, { ignoreSearch: true });
      if (cached) { event.waitUntil(network.catch(() => null)); return cached; }
      try { return await network; } catch { return Response.error(); }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: true });
    const network = fetch(event.request, { cache: "no-cache" })
      .then(response => {
        if (response.ok) cache.put(key, response.clone());
        return response;
      })
      .catch(() => null);
    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    return (await network) || Response.error();
  })());
});
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = typeof data.title === "string" ? data.title.slice(0, 80) : "BudgetSplit";
  const body = typeof data.body === "string" ? data.body.slice(0, 200) : "Tap to log what you spent today.";
  const open = ["add", "split", "home"].includes(data.open) ? data.open : "add";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "icons/icon-192-bs.png",
    badge: "icons/icon-192-bs.png",
    tag: open === "add" ? "daily-reminder" : "bs-" + open + "-" + Date.now(),
    renotify: open === "add",
    data: { open }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = self.registration.scope;
  const open = (event.notification.data && event.notification.data.open) || "add";
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(target)) { await w.focus(); w.postMessage({ type: "open-" + open }); return; }
    }
    await self.clients.openWindow(target + (open === "home" ? "" : "#" + open));
  })());
});
