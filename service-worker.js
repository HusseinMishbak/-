/* UR Version 2 — installable web-app shell. */
'use strict';
const CACHE_NAME = 'ur-v2-shell-20261026-1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './curriculum.js?v=20261018-sequence8',
  './pronunciation-lesson.js?v=20261012-pron1',
  './curriculum-review.js?v=20261018-hours1',
  './speaking-assessment.js?v=20261012-audio5',
  './conversation-podcast.js?v=20261012-contrast2',
  './podcast-six-minutes.js?v=20261012-v1',
  './learning-games.js?v=20261011-games1',
  './i18n.js?v=20261026-v2foundation8',
  './curriculum-audit.js?v=20261018-audit1',
  './assessment-controls.js?v=20261018-correctionmode13',
  './billing.js?v=20261019-billing3',
  './citizenship-mock-exam.js?v=20261019-civic2',
  './citizenship-mock-bank.json?v=20261019-civic1',
  './learning-experience.js?v=20261019-v2foundation1',
  './ui/frello-inspired-refresh.css?v=20261026-contrast2',
  './ui/learning-experience.css?v=20261019-v2foundation1'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(url => cache.add(url).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('ur-v2-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then(response => {
      if (response && response.ok && response.type === 'basic') {
        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      }
      return response;
    }).catch(() => null);
    if (cached) {
      event.waitUntil(network.then(() => undefined));
      return cached;
    }
    return (await network) || Response.error();
  })());
});
