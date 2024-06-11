<script lang="ts">
  import { fade } from 'svelte/transition';
  import AlbumLink from '../AlbumLink.svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import { createEventDispatcher } from 'svelte';
  import { enhance } from '$app/forms';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';
  import type { SearchAlbum } from '$lib/shared/types';

  export let total: number;
  export let albums: SearchAlbum[];
  export let query: string;
  export let type: string;
  export let startIndex: number = 0;
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

  const dispatch = createEventDispatcher();

  const duration = 250;
  let loading = false;
</script>

<div
  out:fade|global={{ duration }}
  class="my-2 bg-gradient-to-r from-transparent via-zinc-600/20 px-2 text-center text-xl"
>
  Albums:
</div>
<div class="flex flex-wrap items-center justify-center gap-8 p-2">
  {#each albums as album, index (album.id)}
    <AlbumLink {album} index={Math.min(Math.abs(index - startIndex), index)} />
  {/each}
</div>
{#if albums.length < total}
  {#if type !== 'album'}
    <div class="flex items-center justify-center pb-2">
      <button
        use:vibrate
        class="rounded-md bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
        on:click={() => dispatch('typechange')}
      >
        Show all ({total - albums.length} more)
      </button>
    </div>
  {:else}
    <form
      method="POST"
      action="?/getAlbums"
      use:enhance={({ cancel }) => {
        loading = true;
        requestCanceller = cancel;
        return ({ result }) => {
          if (result.type === 'success' && result.data?.albums && result.data.albums.length > 0) {
            dispatch('albumsloaded', { albums: result.data.albums });
          }
          loading = false;
        };
      }}
      class="flex items-center justify-center pb-2"
    >
      <input type="hidden" name="from" value={albums.length} />
      <input type="hidden" name="query" value={query} />

      <button
        class="rounded-md bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
        type="submit"
        use:vibrate
        disabled={loading}
      >
        <div class:opacity-0={loading}>
          Load more ({total - albums.length} left)
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
