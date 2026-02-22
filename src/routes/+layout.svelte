<script lang="ts">
  import { page } from '$app/state';
  import { onMount, type Snippet } from 'svelte';
  import '../app.css';
  import { getExpressiveScheme, schemeToCSS } from '$lib/materialColors';
  import { setAudioPlayer } from '$lib/states/audioPlayer.svelte';

  const audioPlayer = setAudioPlayer();

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  let schemeStyle = $state('');

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

  $effect(() => {
    const track = audioPlayer.currentTrack;
    getExpressiveScheme(track?.album.id || '', track?.album.albumArtId || '').then((scheme) => {
      schemeStyle = schemeToCSS(scheme);
    });
  });
</script>

<svelte:head>
  <title>{page.data.title ? page.data.title + ' | ' : ''}Svelte Music Streamer</title>
</svelte:head>

<div
  class="bg-surface-container text-on-surface flex h-dvh w-full justify-center transition-colors duration-500"
  style={schemeStyle}
>
  <div class="flex h-full w-full flex-col overflow-hidden p-1">
    {@render children?.()}
  </div>
</div>
