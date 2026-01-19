<script lang="ts">
  import { onMount } from 'svelte';
  import RoundSearch from '~icons/ic/round-search';
  import AlbumLink from './AlbumLink.svelte';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';
  import { flip } from 'svelte/animate';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let container: HTMLDivElement | null = $state(null);
  let firstVisibleElement: number = $state(0);
  let foundScroll = $state(false);
  let scrolled = $state(false);
  let scrolledFromTop = $state(false);
  let searchString = $state('');

  let filtered = $derived(
    data.albums.filter((album) => {
      if (!searchString) {
        return true;
      }

      return (
        album.title.toLowerCase().includes(searchString.toLowerCase()) ||
        album.albumArtist.name.toLowerCase().includes(searchString.toLowerCase())
      );
    })
  );

  function updateVisibleElements() {
    if (!container) return;
    let first;
    for (const child of container.children) {
      const rect = child.getBoundingClientRect();
      if (
        rect.bottom >= 0 &&
        rect.bottom <= window.innerHeight &&
        (!scrolled || (scrolled && rect.top >= 0 && rect.top <= window.innerHeight))
      ) {
        first = parseInt(child.id);
        break;
      }
    }

    if (first) {
      firstVisibleElement = first;
    }
  }

  onMount(async () => {
    const scroll = localStorage.getItem('dashboard-scroll');
    if (scroll && container) {
      container.scrollTop = parseInt(scroll);
      foundScroll = true;
    }
    updateVisibleElements();
  });
</script>

<div
  out:fade|global={{ duration: 250 }}
  class="absolute top-0 left-0 flex h-full w-full flex-col overflow-hidden"
>
  <div class="p-4 pb-0 text-center text-xl font-bold">Albums</div>

  <div
    class="z-20 flex w-full flex-col px-8 py-1 transition-shadow duration-300"
    class:shadow-md={scrolledFromTop}
  >
    <label class="flex w-full items-center">
      <input
        class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/30 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:bg-zinc-600/50 focus-visible:ring-2"
        type="text"
        bind:value={searchString}
        name="search"
        autocomplete="off"
        placeholder="Search"
      />
      <RoundSearch class="absolute right-2 text-xl" />
    </label>
  </div>

  <div
    class="flex flex-wrap items-center justify-center gap-8 overflow-auto p-2"
    bind:this={container}
    onscroll={() => {
      if (!container) return;
      localStorage.setItem('dashboard-scroll', container.scrollTop.toString() || '0');

      updateVisibleElements();

      if (!foundScroll) {
        foundScroll = true;
        return;
      }

      scrolled = true;
      scrolledFromTop = container.scrollTop > 0;
    }}
  >
    {#each filtered as album, index (album.id)}
      <div
        animate:flip={{ duration: 200 }}
        class="size-36 overflow-hidden rounded-xl md:size-40 xl:size-52"
        id={index.toString()}
      >
        <AlbumLink {album} {index} first={firstVisibleElement} />
      </div>
    {/each}
  </div>
</div>
