<script lang="ts">
  import ArtistRow from './ArtistRow.svelte';
  import { flip } from 'svelte/animate';
  import RoundSearch from 'virtual:icons/ic/round-search';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let scrolled = $state(false);
  let searchString = $state('');
  let scrolledFromTop = $state(false);
  let container: HTMLDivElement | null = $state(null);

  let filtered = $derived(
    data.artists.filter(
      (artist) =>
        artist.name.toLowerCase().includes(searchString.toLowerCase()) ||
        artist.sanitized.toLowerCase().includes(searchString.toLowerCase())
    )
  );
</script>

<div class="absolute left-0 top-0 flex h-full w-full flex-col overflow-hidden">
  <div class="p-4 pb-0 text-center text-xl font-bold">Artists</div>

  {#if data.artists.length === 0}
    <div class="p-4 pt-1 text-center text-xl font-bold">There are no artists 🫤</div>
  {:else}
    <div
      class="flex w-full flex-col px-8 py-1 transition-shadow duration-300"
      class:shadow-md={scrolledFromTop}
    >
      <label class="flex w-full items-center rounded-md backdrop-blur-md">
        <input
          class="w-full rounded-md border-none bg-zinc-600/30 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
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
      class="flex h-full flex-col overflow-auto pt-2 text-lg"
      bind:this={container}
      onscroll={() => {
        scrolled = true;
        if (container) scrolledFromTop = container.scrollTop > 0;
      }}
    >
      {#each filtered as artist, index (artist.id)}
        <div animate:flip={{ duration: 100 }} class="flex w-full flex-col">
          <ArtistRow {artist} {index} {scrolled} />
        </div>
      {/each}
    </div>
  {/if}
</div>
