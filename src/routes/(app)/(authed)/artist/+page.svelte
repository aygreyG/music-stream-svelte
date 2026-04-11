<script lang="ts">
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import SearchBar from '$lib/components/SearchBar.svelte';

  import type { PageData } from './$types';
  import ArtistInfo from './ArtistInfo.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
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

<div class="@container absolute top-0 left-0 flex h-full w-full flex-col overflow-hidden">
  <div
    class="p-4 pb-0 text-center text-xl font-bold"
    in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
  >
    Artists
  </div>

  {#if data.artists.length === 0}
    <div class="p-4 pt-1 text-center text-xl font-bold">There are no artists.</div>
  {:else}
    <div
      class={[
        'flex w-full flex-col px-8 py-1 transition-shadow duration-300',
        scrolledFromTop && 'shadow-md'
      ]}
    >
      <SearchBar bind:value={searchString} />
    </div>

    <div
      class="grid grid-cols-1 items-center justify-center gap-3 overflow-auto p-2 @sm:grid-cols-2 @3xl:grid-cols-4 @5xl:grid-cols-5 @7xl:grid-cols-6"
      bind:this={container}
      onscroll={() => {
        if (container) scrolledFromTop = container.scrollTop > 0;
      }}
    >
      {#each filtered as artist, index (artist.id)}
        <div animate:flip={{ duration: 100 }} class="h-full">
          <ArtistInfo {artist} {index} />
        </div>
      {/each}
    </div>
  {/if}
</div>
