/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const CACHE_NAME = `cache-${version}`;
const ASSETS = [...build, ...files];
const NON_CACHEABLE = [
  '/admin',
  '/api/admin',
  '/api/folder',
  '/api/play',
  '/loading',
  '/login',
  '/logout',
  '/playlist',
  '/profile'
];
const CACHE_FIRST = ['/api/image'];

self.addEventListener('install', (event) => {
  async function addFilesToCache() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
  async function removeOldCaches() {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key !== CACHE_NAME) {
        await caches.delete(key);
      }
    }
  }

  event.waitUntil(removeOldCaches());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (NON_CACHEABLE.some((path) => url.pathname.startsWith(path))) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  async function respond() {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);

    // build, files & api/image can always be served from the cache
    if (
      ASSETS.includes(url.pathname) ||
      (CACHE_FIRST.some((path) => url.pathname.startsWith(path)) && cachedResponse)
    ) {
      console.log('Serving from cache:', event.request.url);
      return cachedResponse;
    }

    const networkResponse = fetch(event.request);

    if (cachedResponse) {
      console.log('Serving from cache:', event.request.url);
      networkResponse.then((response) => {
        if (response.status === 200) {
          console.log('Updating cache:', event.request.url);
          cache.put(event.request, response.clone());
        }
      });

      return cachedResponse;
    }

    const response = await networkResponse;

    if (response.status === 200) {
      cache.put(event.request, response.clone());
    }

    return response;
  }

  event.respondWith(respond());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
