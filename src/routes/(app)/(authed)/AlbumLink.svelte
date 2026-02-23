<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { observeVisibility } from '$lib/actions/observeVisibility';
  import { quintOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { vibrate } from '$lib/actions/vibrate';
  import type { PageData } from './$types';
  import { getExpressiveScheme, schemeToCSS } from '$lib/materialColors';

  const DELAY = 20;

  interface Props {
    album: PageData['albums'][0];
    index: number;
    first?: number | undefined;
  }

  let { album, index, first = undefined }: Props = $props();

  let animate: boolean = $state(false);
  let delay = $derived.by(() => {
    if (first !== undefined) {
      return Math.abs(index - first) * DELAY;
    } else {
      return DELAY * index;
    }
  });
  let schemeStyle = $state('');

  $effect(() => {
    if (animate) {
      getExpressiveScheme(album?.id || '', album?.albumArtId || '').then((scheme) => {
        schemeStyle = schemeToCSS(scheme);
      });
    }
  });
</script>

<div class="h-full w-full">
  {#if animate}
    <a
      use:vibrate
      class={['absolute inset-0 overflow-hidden rounded-xl', !album.albumArtId && 'bg-zinc-900']}
      href="/album/{album.id}"
      in:scale={{ duration: 400, delay, easing: quintOut, start: 0.8 }}
      style={schemeStyle}
    >
      <AlbumImage {album} />
      <div
        class="text-on-surface absolute bottom-0 left-0 flex w-full flex-col justify-end gap-0.5 p-1 text-center"
      >
        <div class="z-10 overflow-hidden rounded-[10px] whitespace-nowrap">
          <div class="absolute -top-24 -left-1 h-fit w-[calc(100%+0.5rem)] md:-top-28 xl:-top-40">
            <AlbumImage {album} maxSize="s" blur />
          </div>
          <div class="bg-surface/80 h-full w-full overflow-hidden px-2 text-ellipsis">
            {album.title}
          </div>
        </div>
        <div class="z-10 overflow-hidden rounded-[9px] text-xs text-ellipsis whitespace-nowrap">
          <div class="absolute -top-31 -left-1 h-fit w-[calc(100%+0.5rem)] md:-top-36 xl:-top-48">
            <AlbumImage {album} maxSize="s" blur />
          </div>
          <div class="bg-surface/80 h-full w-full overflow-hidden px-1 text-ellipsis">
            {album.albumArtist.name}
          </div>
        </div>
      </div>
    </a>
  {:else}
    <a
      class="absolute inset-0 opacity-0"
      aria-label="{album.title} by {album.albumArtist.name}"
      href="/album/{album.id}"
      use:observeVisibility={{
        onVisible: () => {
          animate = true;
        }
      }}
    ></a>
  {/if}
</div>
