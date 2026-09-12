/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

declare let self: ServiceWorkerGlobalScope;

const CACHE_NAME = `cache-${version}`;
const ASSET_SET = new Set([...build, ...files]);
const NON_CACHEABLE = [
  '/admin',
  '/api/admin',
  '/api/folder',
  '/api/play',
  '/loading',
  '/login',
  '/logout',
  '/settings',
  '/history',
  '/favourite',
  '/playlist'
];
const NO_TIMEOUT = ['/api/lyrics'];
const TIMEOUT_MS = 15000;

const matches = (paths: string[], pathname: string) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

self.addEventListener('activate', (event: ExtendableEvent) => {
  const activate = async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  };

  event.waitUntil(activate());
});

self.addEventListener('install', (event: ExtendableEvent) => {
  const cacheAssets = async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll([...ASSET_SET]);
    } catch (error) {
      console.error('Failed to cache assets:', error);
    }
  };

  event.waitUntil(cacheAssets());
});

async function respond(event: FetchEvent): Promise<Response> {
  const url = new URL(event.request.url);
  let cachedResponse: Response | undefined;

  try {
    const cache = await caches.open(CACHE_NAME);
    cachedResponse = await cache.match(event.request);

    if (cachedResponse && ASSET_SET.has(url.pathname)) {
      return cachedResponse;
    }

    const headers = new Headers(event.request.headers);
    const cacheKey = cachedResponse?.headers.get('cache-key');
    if (cacheKey) {
      headers.set('cache-key', cacheKey);
    }

    const signal = matches(NO_TIMEOUT, url.pathname) ? undefined : AbortSignal.timeout(TIMEOUT_MS);

    const response = await fetch(event.request, { signal, headers });

    if (response.status === 304) {
      return cachedResponse!;
    }

    if (response.headers.get('cache-key')) {
      await cache.put(event.request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('Service worker error:', error);

    if (cachedResponse) {
      return cachedResponse;
    }

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

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (matches(NON_CACHEABLE, url.pathname)) return;

  event.respondWith(respond(event));
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
