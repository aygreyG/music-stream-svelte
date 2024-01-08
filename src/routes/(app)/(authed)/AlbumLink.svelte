<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { observeVisibility } from '$lib/observeVisibility';
  import type { AlbumWithArtist } from '$lib/shared/types';

  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { crossfade } from '$lib/transitions/crossfade';
  const [send, receive] = crossfade;

  export let album: AlbumWithArtist;
  export let index: number;
  export let first: number | undefined;

  let animate: boolean = false;
  let outrostarted: boolean = false;
  let delay = 30 * index;

  $: first ? (delay = Math.abs(index - first) * 30) : (delay = 30 * index);
</script>

{#if animate}
  <a
    class="md:w-40 md:h-40 h-36 w-36 xl:w-52 xl:h-52 overflow-hidden bg-zinc-900 rounded-md"
    class:z-20={outrostarted}
    href="/album/{album.id}"
    in:fly={{ duration: 500, delay, easing: quintOut, x: -20 }}
    out:send|global={{ key: `album-image-${album.id}` }}
    on:outrostart={() => (outrostarted = true)}
    id={index.toString()}
  >
    <div>
      <AlbumImage alt={album.title} id={album.id} />
    </div>
    <div class="bottom-0 left-0 absolute w-full text-center flex justify-end flex-col gap-1 p-1">
      <div class="whitespace-nowrap z-10 rounded-md overflow-hidden" class:hidden={outrostarted}>
        <div class="absolute xl:-top-40 md:-top-28 -top-24 -left-1 h-fit w-[calc(100%+0.5rem)]">
          <AlbumImage alt={album.title} id={album.id} maxSize="s" blur />
        </div>
        <div class="bg-zinc-900/80 h-full px-1 w-full overflow-hidden text-ellipsis">
          {album.title}
        </div>
      </div>
      <div
        class="whitespace-nowrap text-ellipsis overflow-hidden z-10 rounded-md text-xs"
        class:hidden={outrostarted}
      >
        <div
          class="absolute xl:-top-48 md:-top-36 -top-[7.75rem] -left-1 h-fit w-[calc(100%+0.5rem)]"
        >
          <AlbumImage alt={album.title} id={album.id} maxSize="s" blur />
        </div>
        <div class="bg-zinc-900/80 h-full text-ellipsis overflow-hidden w-full px-1">
          {album.albumArtist.name}
        </div>
      </div>
    </div>
  </a>
{:else}
  <div
    class="md:w-40 md:h-40 h-36 w-36 xl:w-52 xl:h-52 overflow-hidden opacity-0"
    use:observeVisibility={{
      onVisible: () => {
        animate = true;
      }
    }}
    id={index.toString()}
  />
{/if}
