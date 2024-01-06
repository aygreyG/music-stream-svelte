<script lang="ts">
  import type { SignedInUser } from '$lib/shared/types';
  import { previous, queue } from '$lib/stores/audioPlayer';
  import { fade, slide } from 'svelte/transition';
  import RoundMenu from 'virtual:icons/ic/round-menu';
  import RoundClose from 'virtual:icons/ic/round-close';
  import NavigationElements from './NavigationElements.svelte';

  export let user: SignedInUser | null = null;
  let open: boolean = false;
</script>

<div class="w-4/12 xl:w-3/12 sm:flex flex-col h-full gap-1 hidden">
  <div class="bg-zinc-900/95 p-4 rounded-md flex flex-col gap-2">
    <NavigationElements {user} />
  </div>
  <div class="bg-zinc-900/95 p-2 rounded-md min-h-fit h-full overflow-auto">
    {#each $previous as { track }}
      <div>
        {track.artists.map((a) => a.name).join(', ')} - {track.title}
      </div>
    {/each}
    {#each $queue as { track }}
      <div>
        {track.artists.map((a) => a.name).join(', ')} - {track.title}
      </div>
    {/each}
  </div>
</div>

<div
  class="z-30 shadow-md sm:hidden flex items-center justify-center absolute top-4 -left-1 bg-zinc-800/90 backdrop-blur-md rounded-e-md"
>
  <button on:click={() => (open = !open)}>
    {#if open}
      <RoundClose class="text-4xl text-fuchsia-600/70 hover:text-fuchsia-600 transition-colors" />
    {:else}
      <RoundMenu class="text-4xl text-fuchsia-600/70 hover:text-fuchsia-600 transition-colors" />
    {/if}
  </button>
</div>

{#if open}
  <div
    transition:slide={{ axis: 'x', duration: 500 }}
    class="overflow-y-auto overflow-x-clip backdrop-blur-md absolute top-0 left-0 h-[calc(100%-0.25rem)] w-full bg-zinc-900/80 z-20 rounded-md"
  >
    <div
      class="flex flex-col justify-center h-full items-center"
      transition:fade|global={{ duration: 200 }}
    >
      <NavigationElements on:clickedelement={() => (open = false)} {user} />
    </div>
  </div>
{/if}
