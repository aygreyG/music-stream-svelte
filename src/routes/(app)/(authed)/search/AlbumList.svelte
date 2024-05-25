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
    <button
      use:vibrate
      class="pb-4 pl-4 pt-2 hover:underline"
      on:click={() => dispatch('typechange')}
    >
      Show all ({total - albums.length} more)
    </button>
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
    >
      <input type="hidden" name="from" value={albums.length} />
      <input type="hidden" name="query" value={query} />
      {#if loading}
        <div class="pb-4 pl-4 pt-2">
          <RoundRefresh class="animate-spin text-xl" />
        </div>
      {:else}
        <button use:vibrate class="pb-4 pl-4 pt-2 hover:underline" type="submit">
          Show more ({total - albums.length} left)
        </button>
      {/if}
    </form>
  {/if}
{/if}
