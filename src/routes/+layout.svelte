<script lang="ts">
  import { page } from '$app/state';
  import { onMount, type Snippet } from 'svelte';
  import '../app.css';
  import { theme } from '$lib/states/theme.svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

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
  <title>{page.data.title ? page.data.title + ' | ' : ''}Svelte Music Streamer</title>
</svelte:head>

<div
  class="flex h-dvh w-full justify-center transition-colors duration-500"
  style="background-color: {theme.shownBackground};"
>
  <div class="flex h-full w-full flex-col overflow-hidden p-1">
    {@render children?.()}
  </div>
</div>
