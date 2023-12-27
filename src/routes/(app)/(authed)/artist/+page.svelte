<script lang="ts">
  import { observeVisibility } from '$lib/observeVisibility.js';
  import { onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ArtistRow from './ArtistRow.svelte';

  export let data;
  let animate: boolean = false;
  let scrolled = false;

  onMount(() => {
    animate = true;
  });
</script>

<div class="h-full flex flex-col overflow-hidden">
  <div class="text-center font-bold text-2xl px-4 pt-4">Artists</div>

  {#if data.artists.length === 0}
    <div class="text-center font-bold text-xl p-4">There are no artists 🫤</div>
  {/if}

  <div class="flex flex-col h-full overflow-auto text-lg" on:scroll={() => (scrolled = true)}>
    {#each data.artists as artist, index (artist.id)}
      <ArtistRow {artist} {index} {scrolled} />
    {/each}
  </div>
</div>
