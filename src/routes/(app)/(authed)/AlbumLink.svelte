<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { observeVisibility } from '$lib/observeVisibility';
  import { quintOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { crossfade } from '$lib/transitions/crossfade';
  import { vibrate } from '$lib/actions/vibrate';
  import type { PageData } from './$types';
  const [send] = crossfade;

  const DELAY = 20;

  interface Props {
    album: PageData['albums'][0];
    index: number;
    first?: number | undefined;
  }

  let { album, index, first = undefined }: Props = $props();

  let animate: boolean = $state(false);
  let outrostarted: boolean = $state(false);
  let delay = $derived.by(() => {
    if (first !== undefined) {
      return Math.abs(index - first) * DELAY;
    } else {
      return DELAY * index;
    }
  });
</script>

{#if animate}
  <a
    use:vibrate
    class="h-36 w-36 overflow-hidden rounded-xl md:h-40 md:w-40 xl:h-52 xl:w-52"
    class:z-20={outrostarted}
    class:bg-zinc-900={!album.albumArtDarkMuted}
    href="/album/{album.id}"
    in:scale={{ duration: 500, delay, easing: quintOut, start: 0.5 }}
    out:send|global={{ key: `album-image-${album.id}` }}
    onoutrostart={() => (outrostarted = true)}
    id={index.toString()}
  >
    <div class="h-full w-full">
      <AlbumImage {album} />
    </div>
    <div class="absolute bottom-0 left-0 flex w-full flex-col justify-end gap-0.5 p-1 text-center">
      <div
        class="z-10 overflow-hidden rounded-[10px] whitespace-nowrap"
        class:hidden={outrostarted}
      >
        <div class="absolute -top-24 -left-1 h-fit w-[calc(100%+0.5rem)] md:-top-28 xl:-top-40">
          <AlbumImage {album} maxSize="s" blur />
        </div>
        <div class="h-full w-full overflow-hidden bg-zinc-900/80 px-2 text-ellipsis">
          {album.title}
        </div>
      </div>
      <div
        class="z-10 overflow-hidden rounded-[9px] text-xs text-ellipsis whitespace-nowrap"
        class:hidden={outrostarted}
      >
        <div class="absolute -top-31 -left-1 h-fit w-[calc(100%+0.5rem)] md:-top-36 xl:-top-48">
          <AlbumImage {album} maxSize="s" blur />
        </div>
        <div class="h-full w-full overflow-hidden bg-zinc-900/80 px-1 text-ellipsis">
          {album.albumArtist.name}
        </div>
      </div>
    </div>
  </a>
{:else}
  <a
    class="h-36 w-36 overflow-hidden opacity-0 md:h-40 md:w-40 xl:h-52 xl:w-52"
    aria-label="{album.title} by {album.albumArtist.name}"
    href="/album/{album.id}"
    use:observeVisibility={{
      onVisible: () => {
        animate = true;
      }
    }}
    id={index.toString()}
  ></a>
{/if}
