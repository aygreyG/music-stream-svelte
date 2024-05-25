<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import type { Prisma } from '@prisma/client';
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';

  type ArtistType = Prisma.ArtistGetPayload<{
    include: { _count: { select: { albums: true; tracks: true } } };
  }>;

  export let total: number;
  export let artists: ArtistType[];
  export let query: string;
  export let type: string;
  export let startIndex: number = 0;

  const dispatch = createEventDispatcher();
  const duration = 250;
  let loading = false;
  let requestCanceller: () => void;

  function cancelRequest() {
    if (requestCanceller) {
      requestCanceller();
    }
  }

  // If type or query changes cancel the previous request
  // in order to prevent running when requestCanceller is set the cancel logic is moved to another function
  $: {
    if (query && type) {
      cancelRequest();
      loading = false;
    }
  }

  function getAlbumAndTrackString(albumCount: number, trackCount: number) {
    let str = '(';
    if (albumCount > 0) {
      str += `${albumCount} album`;
      if (albumCount > 1) {
        str += 's';
      }
    }
    if (trackCount > 0) {
      if (albumCount > 0) {
        str += ', ';
      }
      str += `${trackCount} track`;
      if (trackCount > 1) {
        str += 's';
      }
    }
    str += ')';

    return str;
  }
</script>

<div
  out:fade|global={{ duration }}
  class="my-2 bg-gradient-to-r from-transparent via-zinc-600/20 px-2 text-center text-xl"
>
  Artists:
</div>
<div class="flex w-full flex-col">
  {#each artists as artist, index (artist.id)}
    <a
      class="flex justify-between from-zinc-600/10 p-2 pl-4 transition-colors hover:bg-gradient-to-r"
      in:fly|global={{
        duration: 500,
        easing: quintOut,
        x: -20,
        delay: Math.min(Math.abs(index - startIndex), index) * 30
      }}
      animate:flip={{ duration: 500, easing: quintOut }}
      href="/artist/{artist.id}"
    >
      <div>
        {artist.name}
      </div>
      <div>
        {getAlbumAndTrackString(artist._count.albums, artist._count.tracks)}
      </div>
    </a>
  {/each}
</div>
{#if artists.length < total}
  {#if type !== 'artist'}
    <button
      use:vibrate
      class="pb-4 pl-4 pt-2 hover:underline"
      on:click={() => dispatch('typechange')}
    >
      Show all ({total - artists.length} more)
    </button>
  {:else}
    <form
      method="POST"
      action="?/getArtists"
      use:enhance={({ cancel }) => {
        loading = true;
        requestCanceller = cancel;

        return ({ result }) => {
          if (result.type === 'success' && result.data?.artists && result.data.artists.length > 0) {
            dispatch('artistsloaded', { artists: result.data.artists });
          }
          loading = false;
        };
      }}
    >
      <input type="hidden" name="from" value={artists.length} />
      <input type="hidden" name="query" value={query} />
      <button use:vibrate class="pb-4 pl-4 pt-2 hover:underline" disabled={loading} type="submit">
        {#if loading}
          <RoundRefresh class="animate-spin text-xl" />
        {:else}
          Show all ({total - artists.length} more)
        {/if}
      </button>
    </form>
  {/if}
{/if}
