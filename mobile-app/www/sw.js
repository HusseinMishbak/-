const CACHE = 'orr-french-shell-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app-icon.svg',
  './favicon.svg',
  './privacy.html',
  './curriculum.js?v=20261018-sequence8',
  './pronunciation-lesson.js?v=20261012-pron1',
  './curriculum-review.js?v=20261018-hours1',
  './speaking-assessment.js?v=20261012-audio5',
  './conversation-podcast.js?v=20261012-contrast2',
  './podcast-six-minutes.js?v=20261012-v1',
  './learning-games.js?v=20261011-games1',
  './i18n.js?v=20261019-v2foundation1',
  './curriculum-audit.js?v=20261018-audit1',
  './assessment-controls.js?v=20261018-correctionmode13',
  './learning-experience.js?v=20261019-v2foundation1',
  './ui/frello-inspired-refresh.css',
  './ui/learning-experience.css?v=20261019-v2foundation1'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('orr-french-shell-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Do not cache auth/API/third-party requests.

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put('./index.html', response.clone()));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && /\.(js|css|svg|webmanifest|html)$/.test(url.pathname)) {
        caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      }
      return response;
    }))
  );
});
