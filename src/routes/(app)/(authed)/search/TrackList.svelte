<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import type { SearchTrack } from '$lib/shared/types';
  import { untrack } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';

  interface Props {
    startIndex?: number;
    total: number;
    tracks: SearchTrack[];
    query: string;
    type: string;
    ontypechange: () => void;
    ontracksloaded: (searchTracks: SearchTrack[]) => void;
  }

  let {
    startIndex = 0,
    total,
    tracks,
    query,
    type,
    ontypechange,
    ontracksloaded
  }: Props = $props();
  let requestCanceller: (() => void) | undefined = $state();
  let loading = $derived(!!requestCanceller);
  const duration = 250;

  // If type or query changes cancel the previous request
  $effect(() => {
    if (query && type) {
      untrack(() => requestCanceller?.());
    }
  });
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
        onclick={() => ontypechange()}
      >
        Show all ({total - tracks.length} more)
      </button>
    </div>
  {:else}
    <form
      method="POST"
      action="?/getTracks"
      use:enhance={({ cancel }) => {
        requestCanceller = cancel;
        return ({ result }) => {
          requestCanceller = undefined;
          if (
            result.type === 'success' &&
            result.data?.tracks &&
            (result.data.tracks as SearchTrack[]).length > 0
          ) {
            ontracksloaded(result.data.tracks as SearchTrack[]);
          }
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
