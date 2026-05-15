<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { resolve } from '$app/paths';
  import { observeVisibility } from '$lib/actions/observeVisibility';
  import { vibrate } from '$lib/actions/vibrate';

  import MusicArtistFill from '~icons/iconamoon/music-artist-fill';

  import type { Prisma } from '../../../../generated/prisma-client/client';

  type ArtistInfoType = Prisma.ArtistGetPayload<{
    select: { id: true; name: true; _count: { select: { albums: true; tracks: true } } };
  }>;

  interface Props {
    artist: ArtistInfoType;
    index: number;
  }

  let { artist, index }: Props = $props();

  let visible = $state(false);
  const cappedDelay = $derived(Math.min(index * 30, 300));

  let trackAndAlbumCount = $derived.by(() => {
    let tmp = '';
    if (artist._count.albums > 0) {
      tmp += `${artist._count.albums} album`;
      if (artist._count.albums > 1) {
        tmp += 's';
      }
    }
    if (artist._count.tracks > 0) {
      if (artist._count.albums > 0) {
        tmp += ' - ';
      }
      tmp += `${artist._count.tracks} track`;
      if (artist._count.tracks > 1) {
        tmp += 's';
      }
    }
    return tmp;
  });
</script>

{#if visible}
  <a
    class="bg-surface-container hover:bg-surface-container/60 flex h-full items-center gap-2 rounded-xl p-4 transition-colors"
    href={resolve(`/(app)/(authed)/artist/[id]`, { id: artist.id })}
    in:fly|global={{ duration: 300, easing: quintOut, x: -20, delay: cappedDelay }}
    use:vibrate
  >
    <MusicArtistFill class="flex-none text-2xl" />
    <div class="flex flex-col">
      <div class="line-clamp-2 font-bold">
        {artist.name}
      </div>
      <div class="text-xs text-balance">
        {trackAndAlbumCount}
      </div>
    </div>
  </a>
{:else}
  <div
    class="bg-surface-container h-full min-h-15 w-full rounded-xl"
    use:observeVisibility={{ onVisible: () => (visible = true) }}
    aria-hidden="true"
  ></div>
{/if}
