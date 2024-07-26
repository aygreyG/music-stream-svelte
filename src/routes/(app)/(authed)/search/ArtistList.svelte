<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import type { SearchArtist } from '$lib/shared/types';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';

  interface Props {
    total: number;
    artists: SearchArtist[];
    query: string;
    type: string;
    startIndex?: number;
    ontypechange: () => void;
    onartistsloaded: (searchArtists: SearchArtist[]) => void;
  }

  let {
    total,
    artists,
    query,
    type,
    startIndex = 0,
    ontypechange,
    onartistsloaded
  }: Props = $props();

  const duration = 250;
  let loading = $state(false);
  let requestCanceller: (() => void) | undefined = $state();

  function cancelRequest() {
    if (requestCanceller) {
      requestCanceller();
    }
  }

  // If type or query changes cancel the previous request
  // in order to prevent running when requestCanceller is set the cancel logic is moved to another function
  $effect(() => {
    if (query && type) {
      cancelRequest();
      loading = false;
    }
  });

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
    <div class="flex items-center justify-center pb-2">
      <button
        use:vibrate
        class="rounded-md bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
        onclick={() => ontypechange()}
      >
        Show all ({total - artists.length} more)
      </button>
    </div>
  {:else}
    <form
      method="POST"
      action="?/getArtists"
      use:enhance={({ cancel }) => {
        loading = true;
        requestCanceller = cancel;

        return ({ result }) => {
          if (result.type === 'success' && result.data?.artists && result.data.artists.length > 0) {
            onartistsloaded(result.data.artists as SearchArtist[]);
          }
          loading = false;
        };
      }}
      class="flex items-center justify-center pb-2"
    >
      <input type="hidden" name="from" value={artists.length} />
      <input type="hidden" name="query" value={query} />

      <button
        class="rounded-md bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
        type="submit"
        use:vibrate
        disabled={loading}
      >
        <div class:opacity-0={loading}>
          Load more ({total - artists.length} left)
        </div>
        {#if loading}
          <div class="absolute left-1/2 top-1 -translate-x-1/2">
            <RoundRefresh class="animate-spin text-xl" />
          </div>
        {/if}
      </button>
    </form>
  {/if}
{/if}
