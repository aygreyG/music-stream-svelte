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

<div class="hidden h-full w-4/12 flex-col gap-1 sm:flex xl:w-3/12">
  <div class="flex flex-col gap-2 rounded-md bg-zinc-900/95 p-4">
    <NavigationElements {user} />
  </div>
  <div class="h-full min-h-fit overflow-auto rounded-md bg-zinc-900/95 p-2">
    {#if user}
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
    {/if}
  </div>
</div>

<div
  class="absolute -left-1 top-4 z-30 flex items-center justify-center rounded-e-md bg-zinc-800/90 shadow-md backdrop-blur-md sm:hidden"
>
  <button on:click={() => (open = !open)}>
    {#if open}
      <RoundClose class="text-4xl text-fuchsia-600/70 transition-colors hover:text-fuchsia-600" />
    {:else}
      <RoundMenu class="text-4xl text-fuchsia-600/70 transition-colors hover:text-fuchsia-600" />
    {/if}
  </button>
</div>

{#if open}
  <div
    transition:slide={{ axis: 'x', duration: 500 }}
    class="absolute left-0 top-0 z-20 h-[calc(100%-0.25rem)] w-full overflow-y-auto overflow-x-clip rounded-md bg-zinc-900/80 backdrop-blur-md"
  >
    <div
      class="flex h-full flex-col items-center justify-center"
      transition:fade|global={{ duration: 200 }}
    >
      <NavigationElements on:clickedelement={() => (open = false)} {user} />
    </div>
  </div>
{/if}
