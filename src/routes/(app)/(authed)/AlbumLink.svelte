<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { observeVisibility } from '$lib/observeVisibility';
  import type { AlbumWithArtist } from '$lib/shared/types';

  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let album: AlbumWithArtist;
  export let index: number;
  export let first: number | undefined;

  let animate: boolean = false;
  let delay = 30 * index;

  $: first ? (delay = Math.abs(index - first) * 30) : (delay = 30 * index);
</script>

{#if animate}
  <a
    class="md:w-40 md:h-40 h-36 w-36 xl:w-52 xl:h-52 overflow-hidden bg-zinc-900 rounded-md"
    href="/album/{album.id}"
    in:fly={{ duration: 500, delay, easing: quintOut, x: -20 }}
    id={index.toString()}
  >
    <AlbumImage alt={album.title} id={album.id} />
    <div class="bottom-0 left-0 absolute w-full text-center flex justify-end flex-col gap-1 p-1">
      <div
        class="whitespace-nowrap z-10 text-ellipsis overflow-hidden bg-zinc-900/80 backdrop-blur-sm rounded-md px-1"
      >
        {album.title}
      </div>
      <div class="whitespace-nowrap z-10 bg-zinc-900/80 backdrop-blur-sm rounded-md text-xs px-1">
        {album.albumArtist.name}
      </div>
    </div>
  </a>
{:else}
  <div
    class="md:w-40 md:h-40 h-36 w-36 xl:w-52 xl:h-52 overflow-hidden bg-zinc-900 rounded-md opacity-0"
    use:observeVisibility={{
      onVisible: () => {
        animate = true;
      }
    }}
    id={index.toString()}
  />
{/if}
