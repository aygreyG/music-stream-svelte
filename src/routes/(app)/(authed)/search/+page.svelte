<script lang="ts">
  import { tick } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { vibrate } from '$lib/actions/vibrate';
  import SearchBar from '$lib/components/SearchBar.svelte';

  import RoundRefresh from '~icons/ic/round-refresh';
  import RoundSearch from '~icons/ic/round-search';

  import type { PageData } from './$types';
  import AlbumList from './AlbumList.svelte';
  import ArtistList from './ArtistList.svelte';
  import TrackList from './TrackList.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // TODO: look into a better way to handle these
  // svelte-ignore state_referenced_locally
  let searchString = $state(data.query || '');
  // svelte-ignore state_referenced_locally
  let type = $state(data.type || 'all');
  // svelte-ignore state_referenced_locally
  let results = $state(data.results);
  let formElement: HTMLFormElement | null = $state(null);
  let container: HTMLDivElement | null = $state(null);
  let loading = $state(false);
  let timeout: NodeJS.Timeout | undefined = $state();
  let scrolled = $state(false);
  let startIndex = $state(0);

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

<div class="absolute top-0 left-0 flex h-full w-full flex-col overflow-hidden">
  <div
    in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
    class="p-4 pb-0 text-center text-xl font-bold"
  >
    Search
  </div>

  <form
    bind:this={formElement}
    class="z-20 flex items-center gap-2 px-8 pt-1"
    onsubmit={() => {
      if (searchString && searchString !== data.query) {
        loading = true;
      }
    }}
    data-sveltekit-replacestate
    data-sveltekit-keepfocus
  >
    <SearchBar
      bind:value={searchString}
      name="query"
      required
      class="flex-1"
      oninput={() => {
        clearTimeout(timeout);
        if (searchString) {
          timeout = setTimeout(() => {
            formElement?.requestSubmit();
          }, 500);
        }
      }}
    />
    <select
      name="type"
      class="bg-surface-container text-on-surface-variant hover:bg-surface-container-low focus:ring-primary/60 rounded-full border-none py-2 pr-8 pl-3 outline-hidden transition-all duration-200 focus:ring-2"
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
    <button
      type="submit"
      class="bg-primary text-on-primary focus-visible:ring-primary/60 flex shrink-0 items-center justify-center rounded-full p-2 outline-hidden transition-all duration-200 hover:brightness-110 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
      disabled={!searchString || loading}
      use:vibrate={{ mute: !searchString }}
    >
      {#if loading}
        <RoundRefresh class="animate-spin text-lg" />
      {:else}
        <RoundSearch class="text-lg" />
      {/if}
    </button>
  </form>
  {#if data?.success && data?.results}
    <div
      class={[
        'text-on-surface/80 px-8 py-1 text-xs transition-shadow duration-300',
        scrolled && 'shadow-md'
      ]}
    >
      Results for: "{data.query}"
    </div>
  {/if}

  <div
    class="h-full w-full overflow-auto"
    bind:this={container}
    onscroll={() => (scrolled = !!container?.scrollTop && container?.scrollTop > 0)}
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
