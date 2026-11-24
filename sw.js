/* Korean Vocabulary World — offline cache. v1 */
const CACHE = 'kvw-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const u = new URL(e.request.url);
  // Pages: show the cached app even with no connection.
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then(function (r) { return r || fetch(e.request); }));
    return;
  }
  // App files: cache first, save new copies for next time.
  if (u.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
        return res;
      });
    }));
    return;
  }
  // Google Fonts: use the cached copy, refresh it in the background.
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then(function (r) {
      const f = fetch(e.request).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
        return res;
      });
      return r || f;
    }));
  }
});
