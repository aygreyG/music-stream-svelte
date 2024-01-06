<script lang="ts">
  import { observeVisibility } from '$lib/observeVisibility';
  import type { Artist } from '@prisma/client';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let artist: Artist;
  export let index: number;
  export let scrolled: boolean;

  let animate: boolean = false;
  let delay = 30 * index;
  $: scrolled ? (delay = 0) : (delay = 30 * index);
</script>

{#if animate}
  <a
    class="hover:bg-gradient-to-r transition-colors from-zinc-600/10 p-2 pl-4"
    in:fly={{ duration: 300, easing: quintOut, x: -20, delay }}
    href="/artist/{artist.id}">{artist.name}</a
  >
{:else}
  <a
    class="p-2 pl-4 opacity-0"
    use:observeVisibility={{
      onVisible: () => {
        animate = true;
      }
    }}
    href="/artist/{artist.id}">{artist.name}</a
  >
{/if}
