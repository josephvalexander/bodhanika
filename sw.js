/* ═══════════════════════════════════════════════
   sw.js — Bodhanika Service Worker
   Version is injected by GitHub Actions on deploy.
   Changing VERSION forces all clients to refresh.
   ═══════════════════════════════════════════════ */

const VERSION = 'v2026.04.02.0852';
const CACHE   = 'bodhanika-' + VERSION;

/* Files to cache for offline use */
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/base.css',
  '/css/layout.css',
  '/css/modal.css',
  '/js/data.js',
  '/js/data-1-5.js',
  '/js/data-6-10-science.js',
  '/js/data-6-10-maths.js',
  '/js/data-6-10-evs-life.js',
  '/js/app.js',
  '/js/modal.js',
  '/js/sims.js',
];

/* ── Install: cache all files ── */
self.addEventListener('install', function(e) {
  self.skipWaiting(); /* activate immediately, don't wait */
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    })
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      /* Take control of all open tabs immediately */
      return self.clients.claim();
    })
  );
});

/* ── Fetch: serve from cache, fall back to network ── */
self.addEventListener('fetch', function(e) {
  /* Only cache same-origin GET requests */
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        /* Cache successful responses */
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        /* Offline fallback for navigation requests */
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

/* ── Message: force refresh from app ── */
self.addEventListener('message', function(e) {
  if (e.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
