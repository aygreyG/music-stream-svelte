<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { onMount, tick } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let data;
  let container: HTMLDivElement;
  let animate: boolean = false;

  onMount(async () => {
    animate = true;
    await tick();
    const scroll = localStorage.getItem('dashboard-scroll');
    if (scroll) {
      container.scrollTop = parseInt(scroll);
    }
  });
</script>

<div
  class="flex gap-8 items-center justify-center flex-wrap h-full overflow-auto p-2"
  bind:this={container}
  on:scroll={() => localStorage.setItem('dashboard-scroll', container.scrollTop.toString())}
>
  {#each data.albums as album, index (album.id)}
    {#if animate}
      <a
        class="md:w-40 md:h-40 h-36 w-36 xl:w-52 xl:h-52 overflow-hidden bg-zinc-900 rounded-md"
        href="/album/{album.id}"
        in:fly={{ duration: 500, delay: index * 30, easing: quintOut, x: -20 }}
      >
        <AlbumImage alt={album.title} id={album.id} />
        <div
          class="bottom-0 left-0 absolute w-full text-center flex justify-end flex-col gap-1 p-1"
        >
          <div
            class="whitespace-nowrap z-10 text-ellipsis overflow-hidden bg-zinc-900/80 backdrop-blur-sm rounded-md px-1"
          >
            {album.title}
          </div>
          <div
            class="whitespace-nowrap z-10 bg-zinc-900/80 backdrop-blur-sm rounded-md text-xs px-1"
          >
            {album.albumArtist.name}
          </div>
        </div>
      </a>
    {/if}
  {/each}
</div>
