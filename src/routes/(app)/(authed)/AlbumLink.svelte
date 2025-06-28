<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { observeVisibility } from '$lib/observeVisibility';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { crossfade } from '$lib/transitions/crossfade';
  import { vibrate } from '$lib/actions/vibrate';
  import type { PageData } from './$types';
  const [send] = crossfade;

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
      return Math.abs(index - first) * 30;
    } else {
      return 30 * index;
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
    in:fly={{ duration: 500, delay, easing: quintOut, x: -20 }}
    out:send|global={{ key: `album-image-${album.id}` }}
    onoutrostart={() => (outrostarted = true)}
    id={index.toString()}
  >
    <div class="h-full w-full">
      <AlbumImage {album} />
    </div>
    <div class="absolute bottom-0 left-0 flex w-full flex-col justify-end gap-0.5 p-1 text-center">
      <div
        class="z-10 overflow-hidden whitespace-nowrap rounded-[10px]"
        class:hidden={outrostarted}
      >
        <div class="absolute -left-1 -top-24 h-fit w-[calc(100%+0.5rem)] md:-top-28 xl:-top-40">
          <AlbumImage {album} maxSize="s" blur />
        </div>
        <div class="h-full w-full overflow-hidden text-ellipsis bg-zinc-900/80 px-2">
          {album.title}
        </div>
      </div>
      <div
        class="z-10 overflow-hidden text-ellipsis whitespace-nowrap rounded-[9px] text-xs"
        class:hidden={outrostarted}
      >
        <div
          class="absolute -left-1 -top-[7.75rem] h-fit w-[calc(100%+0.5rem)] md:-top-36 xl:-top-48"
        >
          <AlbumImage {album} maxSize="s" blur />
        </div>
        <div class="h-full w-full overflow-hidden text-ellipsis bg-zinc-900/80 px-1">
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
