/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

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

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    const cacheKey = cachedResponse?.headers.get('cache-key');

    const headers = new Headers(event.request.headers);
    if (cacheKey) {
      headers.set('cache-key', cacheKey);
    }

    const response = await fetch(event.request, {
      signal: controller.signal,
      headers
    });

    if (response.status === 304) {
      console.log('Serving from cache:', event.request.url);
      return cachedResponse!;
    } else {
      const newCacheKey = response.headers.get('cache-key');
      if (newCacheKey) {
        cache.put(event.request, response.clone());
      }
    }

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
