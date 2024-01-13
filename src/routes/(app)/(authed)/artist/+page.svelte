<script lang="ts">
  import { onMount } from 'svelte';
  import ArtistRow from './ArtistRow.svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import RoundSearch from 'virtual:icons/ic/round-search';

  export let data;
  let scrolled = false;
  let searchString = '';
  let animate = false;

  $: filtered = data.artists.filter(
    (artist) =>
      artist.name.toLowerCase().includes(searchString.toLowerCase()) ||
      artist.sanitized.toLowerCase().includes(searchString.toLowerCase())
  );

  onMount(() => {
    animate = true;
  });
</script>

<div class="flex h-full flex-col overflow-hidden">
  <div class="px-4 pt-4 text-center text-2xl font-bold">Artists</div>

  {#if data.artists.length === 0}
    <div class="p-4 text-center text-xl font-bold">There are no artists 🫤</div>
  {:else}
    {#if animate}
      <div class="flex w-full flex-col pt-4" in:fly={{ duration: 300, easing: quintOut, x: -20 }}>
        <label class="flex w-full items-center rounded-md px-2 backdrop-blur-md">
          <input
            class="w-full rounded-md bg-zinc-600 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
            type="text"
            bind:value={searchString}
            name="search"
          />
          <RoundSearch class="absolute right-4 text-xl" />
        </label>
      </div>
    {/if}

    <div
      class="flex h-full flex-col overflow-auto pt-2 text-lg"
      on:scroll={() => (scrolled = true)}
    >
      {#each filtered as artist, index (artist.id)}
        <div animate:flip={{ duration: 100 }} class="flex w-full flex-col">
          <ArtistRow {artist} {index} {scrolled} />
        </div>
      {/each}
    </div>
  {/if}
</div>
