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
const TIMEOUT_MS = 10000;

self.addEventListener('activate', (event: ExtendableEvent) => {
  const activate = async () => {
    // Remove old caches
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    );

    // Enable navigation preload if supported
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
  };

  event.waitUntil(activate());
});

self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting();

  const cacheAssets = async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(ASSETS);
    } catch (error) {
      console.error('Failed to cache assets:', error);
    }
  };

  event.waitUntil(cacheAssets());
});

async function respond(event: FetchEvent): Promise<Response> {
  try {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);

    if (
      ASSETS.includes(url.pathname) ||
      (CACHE_FIRST.some((path) => url.pathname.startsWith(path)) && cachedResponse)
    ) {
      console.log('Serving from cache:', event.request.url);
      return cachedResponse!;
    }

    const preloadedResponse = await event.preloadResponse;

    if (preloadedResponse) {
      return preloadedResponse;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    const response = await fetch(event.request, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return response;
  } catch (error) {
    console.error('Service worker error:', error);
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store'
      }
    });
  }
}

self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip non-cacheable paths
  if (NON_CACHEABLE.some((path) => url.pathname.startsWith(path))) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  event.respondWith(respond(event));
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
