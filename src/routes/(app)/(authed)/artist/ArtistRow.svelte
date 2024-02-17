<script lang="ts">
  import { observeVisibility } from '$lib/observeVisibility';
  import type { Prisma } from '@prisma/client';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  type ArtistRowType = Prisma.ArtistGetPayload<{
    include: { _count: { select: { albums: true; tracks: true } } };
  }>;

  export let artist: ArtistRowType;
  export let index: number;
  export let scrolled: boolean;

  let animate: boolean = false;
  let delay = 30 * index;
  $: scrolled ? (delay = 0) : (delay = 30 * index);
</script>

{#if animate}
  <a
    class="flex justify-between from-zinc-600/10 p-2 pl-4 transition-colors hover:bg-gradient-to-r"
    in:fly={{ duration: 300, easing: quintOut, x: -20, delay }}
    href="/artist/{artist.id}"
  >
    <div>
      {artist.name}
    </div>
    <div>
      (
      {#if artist._count.albums > 0}
        {artist._count.albums} album{#if artist._count.albums > 1}s{/if}
      {/if}
      {#if artist._count.tracks > 0}
        {artist._count.tracks} track{#if artist._count.tracks > 1}s{/if}
      {/if}
      )
    </div>
  </a>
{:else}
  <a
    class="flex justify-between p-2 pl-4 opacity-0"
    use:observeVisibility={{
      onVisible: () => {
        animate = true;
      }
    }}
    href="/artist/{artist.id}"
  >
    <div>
      {artist.name}
    </div>
    <div>
      (
      {#if artist._count.albums > 0}
        {artist._count.albums} album{#if artist._count.albums > 1}s{/if}
      {/if}
      {#if artist._count.tracks > 0}
        {artist._count.tracks} track{#if artist._count.tracks > 1}s{/if}
      {/if}
      )
    </div>
  </a>
{/if}
