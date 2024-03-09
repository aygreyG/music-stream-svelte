/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const CACHE_NAME = `cache-${version}`;
const ASSETS = [...build, ...files];

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

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE_NAME);

    // `build`/`files` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(url.pathname);

      if (response) {
        return response;
      }
    }

    try {
      const response = await fetch(event.request);
      const httpRequest = url.protocol === 'http:';

      if (!httpRequest) {
        return response;
      }

      if (!(response instanceof Response)) {
        throw new Error('invalid response from fetch');
      }

      if (response.status === 200) {
        cache.put(event.request, response.clone());
      }

      return response;
    } catch (err) {
      const response = await cache.match(event.request);

      if (response) {
        return response;
      }

      throw err;
    }
  }

  event.respondWith(respond());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
