<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import '../app.css';

  async function detectSWUpdate() {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (confirm('A new version of the app is available. Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            location.reload();
          }
        }
      });
    });
  }

  onMount(() => {
    detectSWUpdate();
  });
</script>

<svelte:head>
  <title>{$page.data.title ? $page.data.title + ' | ' : ''}Svelte Music Streamer</title>
</svelte:head>

<div class="flex h-[100dvh] w-full justify-center">
  <div class="flex h-full w-full flex-col overflow-hidden p-1">
    <slot />
  </div>
</div>
