<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import type { SearchTrack } from '$lib/shared/types';
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';

  export let startIndex: number = 0;
  export let total: number;
  export let tracks: SearchTrack[];
  export let query: string;
  export let type: string;
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
  Tracks:
</div>
<div class="flex w-full flex-col">
  {#each tracks as track, index (track.id)}
    <div class="w-full flex-none" animate:flip={{ duration: 500, easing: quintOut }}>
      <TrackRow {track} delay={250 + Math.min(Math.abs(index - startIndex), index) * 30} />
    </div>
  {/each}
</div>
{#if tracks.length < total}
  {#if type !== 'track'}
    <div class="flex items-center justify-center pb-2">
      <button
        use:vibrate
        class="rounded-md bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
        on:click={() => dispatch('typechange')}
      >
        Show all ({total - tracks.length} more)
      </button>
    </div>
  {:else}
    <form
      method="POST"
      action="?/getTracks"
      use:enhance={({ cancel }) => {
        loading = true;
        requestCanceller = cancel;
        return ({ result }) => {
          if (result.type === 'success' && result.data?.tracks && result.data.tracks.length > 0) {
            dispatch('tracksloaded', { tracks: result.data.tracks });
          }
          loading = false;
        };
      }}
      class="flex items-center justify-center pb-2"
    >
      <input type="hidden" name="from" value={tracks.length} />
      <input type="hidden" name="query" value={query} />

      <button
        class="rounded-md bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
        type="submit"
        use:vibrate
        disabled={loading}
      >
        <div class:opacity-0={loading}>
          Load more ({total - tracks.length} left)
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
