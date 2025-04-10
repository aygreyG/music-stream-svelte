<script lang="ts">
  import RoundSearch from '~icons/ic/round-search';
  import RoundRefresh from '~icons/ic/round-refresh';
  import { fade } from 'svelte/transition';
  import { tick } from 'svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import TrackList from './TrackList.svelte';
  import AlbumList from './AlbumList.svelte';
  import ArtistList from './ArtistList.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let searchString = $state(data.query || '');
  let type = $state(data.type || 'all');
  let formElement: HTMLFormElement | null = $state(null);
  let container: HTMLDivElement | null = $state(null);
  let loading = $state(false);
  let timeout: NodeJS.Timeout | undefined = $state();
  let duration = 250;
  let scrolled = $state(false);
  let startIndex = $state(0);
  let results = $state(data.results);

  // TODO: Reset loading state when we get a response,
  // this is hacky and should be changed in the future if possible
  // related issue: https://github.com/aygreyG/music-stream-svelte/issues/118
  $effect(() => {
    if (data.query) {
      tick().then(() => (loading = false));
    }
  });

  $effect(() => {
    if (type) {
      startIndex = 0;
      results = data.results;
    }
  });

  async function setType(newType: string) {
    type = newType;
    searchString = data.query || '';
    // waiting for dom to update before submitting the form
    await tick();
    if (searchString) formElement?.requestSubmit();
  }
</script>

<div class="absolute left-0 top-0 flex h-full w-full flex-col overflow-hidden">
  <div out:fade|global={{ duration }} class="p-4 pb-0 text-center text-xl font-bold">Search</div>

  <form
    out:fade|global={{ duration }}
    bind:this={formElement}
    class="z-20 flex px-8 pt-1"
    onsubmit={() => {
      if (searchString && searchString !== data.query) {
        loading = true;
      }
    }}
    data-sveltekit-replacestate
    data-sveltekit-keepfocus
  >
    <label class="flex w-2/3 items-center border-e border-zinc-500/50">
      <input
        required
        placeholder="Search"
        class="w-full rounded-s-md border-none bg-zinc-600/30 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        type="text"
        bind:value={searchString}
        oninput={() => {
          clearTimeout(timeout);
          if (searchString) {
            timeout = setTimeout(() => {
              formElement?.requestSubmit();
            }, 500);
          }
        }}
        name="query"
        autocomplete="off"
      />
    </label>
    <label class="flex w-1/3 items-center border-e border-zinc-500/50">
      <select
        name="type"
        class="w-full border-none bg-zinc-600/30 py-1 outline-none transition-all hover:bg-zinc-600/50 focus:ring-2 focus:ring-primary focus-visible:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        onchange={() => {
          if (searchString) formElement?.requestSubmit();
        }}
        bind:value={type}
      >
        <option value="all">All</option>
        <option value="track">Track</option>
        <option value="album">Album</option>
        <option value="artist">Artist</option>
      </select>
    </label>
    <button
      type="submit"
      class="flex items-center justify-center rounded-e-md bg-zinc-600/30 px-2 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:text-white/20 disabled:hover:bg-zinc-600/30"
      disabled={!searchString || loading}
      use:vibrate={{ mute: !searchString }}
    >
      {#if loading}
        <RoundRefresh class="animate-spin text-xl" />
      {:else}
        <RoundSearch class="text-xl" />
      {/if}
    </button>
  </form>
  {#if data?.success && data?.results}
    <div
      class="px-8 py-1 text-xs text-white/70 transition-shadow duration-300"
      class:shadow-md={scrolled}
    >
      Results for: "{data.query}"
    </div>
  {/if}

  <div
    class="h-full w-full overflow-auto"
    bind:this={container}
    onscroll={() => (scrolled = !!container?.scrollTop && container?.scrollTop > 0)}
    out:fade={{ duration: 200 }}
  >
    {#if data?.success && data.total && results}
      {#if results.tracks.length > 0}
        <TrackList
          query={data.query}
          total={data.total.tracks}
          tracks={results.tracks}
          {startIndex}
          {type}
          ontracksloaded={(tracks) => {
            if (results?.tracks) {
              startIndex = results.tracks.length - 1;
              results.tracks = [...results.tracks, ...tracks];
            }
          }}
          ontypechange={() => setType('track')}
        />
      {/if}

      {#if results.albums.length > 0}
        <AlbumList
          query={data.query}
          total={data.total.albums}
          albums={results.albums}
          {startIndex}
          {type}
          onalbumsloaded={(albums) => {
            if (results?.albums) {
              startIndex = results.albums.length - 1;
              results.albums = [...results.albums, ...albums];
            }
          }}
          ontypechange={() => setType('album')}
        />
      {/if}

      {#if results.artists.length > 0}
        <ArtistList
          query={data.query}
          total={data.total.artists}
          artists={results.artists}
          {startIndex}
          {type}
          onartistsloaded={(artists) => {
            if (results?.artists) {
              startIndex = results.artists.length - 1;
              results.artists = [...results.artists, ...artists];
            }
          }}
          ontypechange={() => setType('artist')}
        />
      {/if}
    {/if}
    {#if data?.success === false}
      <div class="p-2 text-center text-2xl">There are no results</div>
    {/if}
  </div>
</div>
