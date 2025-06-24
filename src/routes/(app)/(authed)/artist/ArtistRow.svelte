<script lang="ts">
  import { observeVisibility } from '$lib/observeVisibility';
  import type { Prisma } from '../../../../generated/prisma-client/client';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  type ArtistRowType = Prisma.ArtistGetPayload<{
    select: { id: true; name: true; _count: { select: { albums: true; tracks: true } } };
  }>;

  interface Props {
    artist: ArtistRowType;
    index: number;
    scrolled: boolean;
  }

  let { artist, index, scrolled }: Props = $props();

  let animate: boolean = $state(false);
  let delay = $derived.by(() => {
    if (scrolled) {
      return 0;
    }
    return 30 * index;
  });

  let trackAndAlbumCount = $derived.by(() => {
    let tmp = '(';
    if (artist._count.albums > 0) {
      tmp += `${artist._count.albums} album`;
      if (artist._count.albums > 1) {
        tmp += 's';
      }
    }
    if (artist._count.tracks > 0) {
      if (artist._count.albums > 0) {
        tmp += ', ';
      }
      tmp += `${artist._count.tracks} track`;
      if (artist._count.tracks > 1) {
        tmp += 's';
      }
    }
    tmp += ')';
    return tmp;
  });
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
