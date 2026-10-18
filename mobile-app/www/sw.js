const CACHE = 'orr-french-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './app-icon.svg', './favicon.svg', './curriculum.js', './pronunciation-lesson.js', './curriculum-review.js', './speaking-assessment.js', './conversation-podcast.js', './podcast-six-minutes.js', './learning-games.js', './i18n.js', './assessment-controls.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Never cache auth, APIs, or third-party requests.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && /\\.(js|svg|webmanifest)$/.test(url.pathname)) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
