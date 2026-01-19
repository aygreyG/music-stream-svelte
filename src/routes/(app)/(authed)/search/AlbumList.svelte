<script lang="ts">
  import { fade } from 'svelte/transition';
  import AlbumLink from '../AlbumLink.svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import { enhance } from '$app/forms';
  import RoundRefresh from '~icons/ic/round-refresh';
  import type { SearchAlbum } from '$lib/shared/types';

  interface Props {
    total: number;
    albums: SearchAlbum[];
    query: string;
    type: string;
    startIndex?: number;
    ontypechange: () => void;
    onalbumsloaded: (searchAlbums: SearchAlbum[]) => void;
  }

  let {
    total,
    albums,
    query,
    type,
    startIndex = 0,
    onalbumsloaded,
    ontypechange
  }: Props = $props();
  let requestCanceller: (() => void) | undefined = $state();
  let loading = $state(false);
  const duration = 250;

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
</script>

<div
  out:fade|global={{ duration }}
  class="my-2 bg-linear-to-r from-transparent via-zinc-600/20 px-2 text-center text-xl"
>
  Albums:
</div>
<div class="flex flex-wrap items-center justify-center gap-8 p-2">
  {#each albums as album, index (album.id)}
    <div class="size-36 overflow-hidden rounded-xl md:size-40 xl:size-52">
      <AlbumLink {album} index={Math.min(Math.abs(index - startIndex), index)} />
    </div>
  {/each}
</div>
{#if albums.length < total}
  {#if type !== 'album'}
    <div class="flex items-center justify-center pb-2">
      <button
        use:vibrate
        class="rounded-xl bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
        onclick={() => ontypechange()}
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
          if (
            result.type === 'success' &&
            result.data?.albums &&
            (result.data.albums as SearchAlbum[]).length > 0
          ) {
            onalbumsloaded(result.data.albums as SearchAlbum[]);
          }
          loading = false;
        };
      }}
      class="flex items-center justify-center pb-2"
    >
      <input type="hidden" name="from" value={albums.length} />
      <input type="hidden" name="query" value={query} />

      <button
        class="rounded-xl bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
        type="submit"
        use:vibrate
        disabled={loading}
      >
        <div class:opacity-0={loading}>
          Load more ({total - albums.length} left)
        </div>
        {#if loading}
          <div class="absolute top-1 left-1/2 -translate-x-1/2">
            <RoundRefresh class="animate-spin text-xl" />
          </div>
        {/if}
      </button>
    </form>
  {/if}
{/if}
