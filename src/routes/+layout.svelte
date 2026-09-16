<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { Toaster } from 'svelte-sonner';

  import { page } from '$app/state';

  import '../app.css';

  import { getExpressiveScheme, schemeToCSS } from '$lib/materialColors';
  import { FALLBACK_SCHEME } from '$lib/shared/consts';
  import type { MaterialScheme } from '$lib/shared/types';
  import { setAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import { getDarkModePreference } from '$lib/utils';

  const audioPlayer = setAudioPlayer();

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  let scheme = $state<MaterialScheme | null>(null);
  let schemeStyle = $derived(scheme ? schemeToCSS(scheme) : '');
  let themeColor = $derived(scheme?.surfaceContainer ?? FALLBACK_SCHEME.surfaceContainer);

  async function detectSWUpdate() {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener('statechange', () => {
        if (navigator.serviceWorker.controller && newWorker.state === 'installed') {
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
    document.documentElement.style.colorScheme = getDarkModePreference() ? 'dark' : 'light';
  });

  $effect(() => {
    const track = audioPlayer.currentTrack;
    let cancelled = false;
    getExpressiveScheme(track?.album.id || '', track?.album.albumArtId || '').then((nextScheme) => {
      if (!cancelled) scheme = nextScheme;
    });
    return () => {
      cancelled = true;
    };
  });
</script>

<svelte:head>
  <title>{page.data.title ? page.data.title + ' | ' : ''}Svelte Music Streamer</title>
  <meta name="theme-color" content={themeColor} />
</svelte:head>

<div
  class="bg-surface-container text-on-surface flex h-dvh w-full justify-center transition-colors duration-500"
  style={schemeStyle}
>
  <div class="flex h-full w-full flex-col overflow-hidden p-1">
    {@render children?.()}
  </div>
  <Toaster
    position="top-center"
    closeButton
    toastOptions={{
      unstyled: true,
      classes: {
        toast: [
          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md font-[inherit] text-sm transition-colors duration-500',
          // default / normal / action / loading
          'bg-surface-container/95 text-on-surface border-outline-variant',
          '[&>[data-close-button]]:bg-surface-container [&>[data-close-button]]:text-on-surface-variant [&>[data-close-button]]:border-outline-variant',
          '[&>[data-close-button]]:hover:bg-surface-variant [&>[data-close-button]]:hover:text-on-surface',
          '[&>[data-button]]:bg-primary [&>[data-button]]:text-on-primary',
          '[&>[data-cancel]]:bg-surface-variant [&>[data-cancel]]:text-on-surface-variant',
          // success
          'data-[type=success]:bg-tertiary-container/95 data-[type=success]:text-on-tertiary-container data-[type=success]:border-tertiary',
          'data-[type=success]:[&>[data-close-button]]:bg-tertiary-container data-[type=success]:[&>[data-close-button]]:text-on-tertiary-container data-[type=success]:[&>[data-close-button]]:border-tertiary',
          'data-[type=success]:[&>[data-close-button]]:hover:bg-tertiary data-[type=success]:[&>[data-close-button]]:hover:text-on-tertiary',
          'data-[type=success]:[&>[data-button]]:bg-tertiary data-[type=success]:[&>[data-button]]:text-on-tertiary',
          'data-[type=success]:[&>[data-cancel]]:bg-tertiary/30 data-[type=success]:[&>[data-cancel]]:text-on-tertiary-container',
          // info
          'data-[type=info]:bg-primary-container/95 data-[type=info]:text-on-primary-container data-[type=info]:border-primary',
          'data-[type=info]:[&>[data-close-button]]:bg-primary-container data-[type=info]:[&>[data-close-button]]:text-on-primary-container data-[type=info]:[&>[data-close-button]]:border-primary',
          'data-[type=info]:[&>[data-close-button]]:hover:bg-primary data-[type=info]:[&>[data-close-button]]:hover:text-on-primary',
          'data-[type=info]:[&>[data-button]]:bg-primary data-[type=info]:[&>[data-button]]:text-on-primary',
          'data-[type=info]:[&>[data-cancel]]:bg-primary/30 data-[type=info]:[&>[data-cancel]]:text-on-primary-container',
          // warning
          'data-[type=warning]:bg-secondary-container/95 data-[type=warning]:text-on-secondary-container data-[type=warning]:border-secondary',
          'data-[type=warning]:[&>[data-close-button]]:bg-secondary-container data-[type=warning]:[&>[data-close-button]]:text-on-secondary-container data-[type=warning]:[&>[data-close-button]]:border-secondary',
          'data-[type=warning]:[&>[data-close-button]]:hover:bg-secondary data-[type=warning]:[&>[data-close-button]]:hover:text-on-secondary',
          'data-[type=warning]:[&>[data-button]]:bg-secondary data-[type=warning]:[&>[data-button]]:text-on-secondary',
          'data-[type=warning]:[&>[data-cancel]]:bg-secondary/30 data-[type=warning]:[&>[data-cancel]]:text-on-secondary-container',
          // error
          'data-[type=error]:bg-error data-[type=error]:text-on-error data-[type=error]:border-transparent',
          'data-[type=error]:[&>[data-close-button]]:bg-error data-[type=error]:[&>[data-close-button]]:text-on-error data-[type=error]:[&>[data-close-button]]:border-on-error/30',
          'data-[type=error]:[&>[data-close-button]]:hover:bg-on-error data-[type=error]:[&>[data-close-button]]:hover:text-error',
          'data-[type=error]:[&>[data-button]]:bg-on-error data-[type=error]:[&>[data-button]]:text-error',
          'data-[type=error]:[&>[data-cancel]]:bg-on-error/20 data-[type=error]:[&>[data-cancel]]:text-on-error'
        ].join(' '),
        title: 'font-semibold leading-snug',
        description: 'text-sm leading-snug opacity-90',
        content: 'flex min-w-0 flex-1 flex-col gap-0.5',
        icon: 'flex size-5 shrink-0 items-center justify-center [&_svg]:size-5',
        closeButton:
          'absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full border shadow-md transition-colors',
        actionButton: 'ml-auto shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold',
        cancelButton: 'ml-auto shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold'
      }
    }}
  />
</div>
