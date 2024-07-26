<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, type Snippet } from 'svelte';
  import '../app.css';
  import { getAccessibleColor, getRGBColor } from '$lib/utils';
  import currentTheme from '$lib/stores/themeStore';
  import type { LayoutData } from './$types';

  interface Props {
    data: LayoutData;
    children?: Snippet;
  }

  let { data, children }: Props = $props();

  let styleArr = $derived([
    getRGBColor($currentTheme.primary, 'primary'),
    getRGBColor(getAccessibleColor($currentTheme.primary), 'accessible'),
    getRGBColor($currentTheme.gradientStart, 'gradient-start'),
    getRGBColor($currentTheme.gradientMiddle, 'gradient-middle'),
    getRGBColor($currentTheme.gradientEnd, 'gradient-end'),
    `--gradient-angle: ${$currentTheme.gradientAngle.replaceAll('_', ' ')};`,
    `--gradient-middle-point: ${$currentTheme.gradientMiddlePoint}%;`,
    `--rounding: ${$currentTheme.rounding}px;`
  ]);

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

  $effect(() => currentTheme.set(data.theme));

  onMount(() => {
    detectSWUpdate();
  });
</script>

<svelte:head>
  <meta name="theme-color" content={$currentTheme.primary} />
  <title>{$page.data.title ? $page.data.title + ' | ' : ''}Svelte Music Streamer</title>
</svelte:head>

<div class="bg-theme-gradient flex h-[100dvh] w-full justify-center" style={styleArr.join(' ')}>
  <div class="flex h-full w-full flex-col overflow-hidden p-1">
    {@render children?.()}
  </div>
</div>
