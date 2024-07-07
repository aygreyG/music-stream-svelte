<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { observeVisibility } from '$lib/observeVisibility';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { crossfade } from '$lib/transitions/crossfade';
  import { vibrate } from '$lib/actions/vibrate';
  import type { PageData } from './$types';
  const [send] = crossfade;

  export let album: PageData['albums'][0];
  export let index: number;
  export let first: number | undefined = undefined;

  let animate: boolean = false;
  let outrostarted: boolean = false;
  let delay = 30 * index;

  $: first !== undefined ? (delay = Math.abs(index - first) * 30) : (delay = 30 * index);
</script>

{#if animate}
  <a
    use:vibrate
    class="h-36 w-36 overflow-hidden rounded-md md:h-40 md:w-40 xl:h-52 xl:w-52"
    class:z-20={outrostarted}
    class:bg-zinc-900={!album.albumArtAccent}
    href="/album/{album.id}"
    in:fly={{ duration: 500, delay, easing: quintOut, x: -20 }}
    out:send|global={{ key: `album-image-${album.id}` }}
    on:outrostart={() => (outrostarted = true)}
    id={index.toString()}
  >
    <div class="h-full w-full">
      <AlbumImage {album} />
    </div>
    <div class="absolute bottom-0 left-0 flex w-full flex-col justify-end gap-1 p-1 text-center">
      <div class="z-10 overflow-hidden whitespace-nowrap rounded-md" class:hidden={outrostarted}>
        <div class="absolute -left-1 -top-24 h-fit w-[calc(100%+0.5rem)] md:-top-28 xl:-top-40">
          <AlbumImage {album} maxSize="s" blur />
        </div>
        <div class="h-full w-full overflow-hidden text-ellipsis bg-zinc-900/80 px-1">
          {album.title}
        </div>
      </div>
      <div
        class="z-10 overflow-hidden text-ellipsis whitespace-nowrap rounded-md text-xs"
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
  />
{/if}
