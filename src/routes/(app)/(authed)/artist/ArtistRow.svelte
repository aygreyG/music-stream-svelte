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
  let trackAndAlbumCount = '(';
  $: scrolled ? (delay = 0) : (delay = 30 * index);
  $: {
    trackAndAlbumCount = '(';
    if (artist._count.albums > 0) {
      trackAndAlbumCount += `${artist._count.albums} album`;
      if (artist._count.albums > 1) {
        trackAndAlbumCount += 's';
      }
    }
    if (artist._count.tracks > 0) {
      if (artist._count.albums > 0) {
        trackAndAlbumCount += ', ';
      }
      trackAndAlbumCount += `${artist._count.tracks} track`;
      if (artist._count.tracks > 1) {
        trackAndAlbumCount += 's';
      }
    }
    trackAndAlbumCount += ')';
  }
</script>

{#if animate}
  <a
    class="flex justify-between gap-2 from-zinc-600/10 px-4 py-2 transition-colors hover:bg-gradient-to-r"
    in:fly={{ duration: 300, easing: quintOut, x: -20, delay }}
    href="/artist/{artist.id}"
  >
    <div>
      {artist.name}
    </div>
    <div class="text-balance text-right">
      {trackAndAlbumCount}
    </div>
  </a>
{:else}
  <a
    class="flex justify-between gap-2 p-2 pl-4 opacity-0"
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
      {trackAndAlbumCount}
    </div>
  </a>
{/if}
