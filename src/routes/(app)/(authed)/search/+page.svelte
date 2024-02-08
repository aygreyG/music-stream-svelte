<script lang="ts">
  import RoundSearch from 'virtual:icons/ic/round-search';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';
  import RoundPlayCircleFilled from 'virtual:icons/ic/round-play-circle-filled';
  import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
  import AlbumLink from '../AlbumLink.svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { currentTrack, paused, playTrack } from '$lib/stores/audioPlayer';
  import { flip } from 'svelte/animate';
  import { tick } from 'svelte';

  export let data;

  let searchString = data.query || '';
  let type = data.type || 'all';
  let formElement: HTMLFormElement;
  let searching = false;
  let timeout: NodeJS.Timeout;
  let duration = 250;
  let container: HTMLDivElement;
  let scrolled = false;

  async function setType(newType: string) {
    type = newType;
    searchString = data.query || '';
    await tick();
    if (searchString) formElement.requestSubmit();
  }
</script>

<div class="absolute left-0 top-0 flex h-full w-full flex-col overflow-hidden">
  <div out:fade|global={{ duration }} class="pt-1 text-center text-xl font-bold">Search</div>

  <form out:fade|global={{ duration }} bind:this={formElement} class="z-20 flex px-8 pt-1">
    <label class="flex w-2/3 items-center border-e border-zinc-500">
      <!-- svelte-ignore a11y-autofocus -->
      <input
        autofocus
        required
        placeholder="Search"
        class="w-full rounded-s-md border-none bg-zinc-600 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
        type="text"
        bind:value={searchString}
        on:input={() => {
          clearTimeout(timeout);
          if (searchString) {
            timeout = setTimeout(() => {
              formElement.requestSubmit();
            }, 500);
          }
        }}
        name="query"
        autocomplete="off"
      />
    </label>
    <label class="flex w-1/3 items-center border-e border-zinc-500">
      <select
        name="type"
        class="w-full border-none bg-zinc-600 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
        on:change={() => {
          if (searchString) formElement.requestSubmit();
        }}
        bind:value={type}
      >
        <option value="all">All</option>
        <option value="artist">Artist</option>
        <option value="album">Album</option>
        <option value="track">Track</option>
      </select>
    </label>
    <button
      type="submit"
      class="flex items-center justify-center rounded-e-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!searchString}
    >
      <RoundSearch class="text-xl" />
    </button>
  </form>
  {#if data?.success && data?.results && !searching}
    <div
      out:fade|global={{ duration }}
      class="px-8 py-1 text-xs text-white/70 transition-shadow duration-300"
      class:shadow-md={scrolled}
    >
      Results for: "{data.query}"
    </div>
  {/if}

  <div
    class="h-full w-full overflow-auto"
    bind:this={container}
    on:scroll={() => (scrolled = container?.scrollTop > 0)}
    out:fade={{ duration: 200 }}
  >
    {#if searching}
      <div class="flex h-full w-full items-center justify-center">
        <RoundRefresh class="ml-2 h-8 w-8 animate-spin text-fuchsia-600" />
      </div>
    {/if}
    {#if data?.success && data?.results && !searching}
      {#if data.results.tracks.length > 0}
        <div
          out:fade|global={{ duration }}
          class="my-2 bg-gradient-to-r from-transparent via-zinc-600/20 px-2 text-center text-xl"
        >
          Tracks:
        </div>
        {#each data.results.tracks as track, index (track.id)}
          <div
            in:fly|global={{
              duration: 500,
              x: -20,
              easing: quintOut,
              delay: 30 * index
            }}
            animate:flip={{ duration: 500 }}
            tabindex="0"
            role="button"
            on:keydown={(e) => {
              if (e.key === 'Enter' && $currentTrack?.track.id !== track.id)
                playTrack(track, track.album, true);
            }}
            on:click={() => {
              if (matchMedia('(hover: none), (pointer: coarse)').matches) {
                playTrack(track, track.album, true);
              }
            }}
            on:dblclick={() =>
              $currentTrack?.track.id !== track.id ? playTrack(track, track.album, true) : null}
            class="group flex h-12 w-full cursor-default select-none items-center from-transparent via-zinc-600/10 to-transparent ps-2 transition-colors hover:bg-gradient-to-r"
          >
            <div class="flex h-10 w-10 items-center justify-center">
              {#if $currentTrack?.track.id === track.id}
                {#if $paused}
                  <button
                    class="z-10 flex items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600"
                    on:click={() => ($paused = false)}
                  >
                    <RoundPlayCircleFilled class="text-3xl transition-colors" />
                  </button>
                {:else}
                  <button
                    class="z-10 flex items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600"
                    on:click={() => ($paused = true)}
                  >
                    <RoundPauseCircleOutline class="text-3xl transition-colors" />
                  </button>
                {/if}
              {:else}
                <button
                  class="z-10 hidden items-center justify-center text-zinc-600 hover:text-fuchsia-600 group-hover:flex"
                  on:click={() => playTrack(track, track.album, true)}
                >
                  <RoundPlayCircleFilled class="text-3xl transition-colors" />
                </button>
                <div
                  class="absolute left-0 top-0 z-0 h-10 w-10 overflow-hidden rounded-md group-hover:opacity-20"
                >
                  <AlbumImage alt={track.album.title} id={track.album.id} maxSize="s" />
                </div>
              {/if}
            </div>
            <div class="w-[45%] pl-2">
              <div class="overflow-hidden text-ellipsis whitespace-nowrap">{track.title}</div>
              <div class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/70">
                {#each track.artists.sort( (a, b) => (a.name !== track.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                  <a class="hover:underline" href="/artist/{artist.id}">
                    {artist.name}{#if track.artists.length > 1 && index != track.artists.length - 1},{/if}
                  </a>
                {/each}
              </div>
            </div>
            <a
              href="/album/{track.album.id}"
              class="w-[calc(30%-0.5rem)] overflow-hidden text-ellipsis whitespace-nowrap pl-2 hover:underline"
            >
              {track.album.title}
            </a>
            <div class="w-[calc(25%-2.5rem)] pl-2">
              {new Date(track.length * 1000).toISOString().slice(14, 19)}
            </div>
          </div>
        {/each}
        {#if type !== 'track' && data.results.tracks.length < data.total.tracks}
          <button class="pb-2 pl-2 hover:underline" on:click={() => setType('track')}>
            Show all results
          </button>
        {/if}
      {/if}

      {#if data.results.albums.length > 0}
        <div
          out:fade|global={{ duration }}
          class="my-2 bg-gradient-to-r from-transparent via-zinc-600/20 px-2 text-center text-xl"
        >
          Albums:
        </div>
        <div class="flex flex-wrap items-center justify-center gap-8 p-2">
          {#each data.results.albums as album, index (album.id)}
            <AlbumLink {album} {index} />
          {/each}
        </div>
        {#if type !== 'album' && data.results.albums.length < data.total.albums}
          <button class="pb-2 pl-2 hover:underline" on:click={() => setType('album')}>
            Show all results
          </button>
        {/if}
      {/if}

      {#if data.results.artists.length > 0}
        <div
          out:fade|global={{ duration }}
          class="my-2 bg-gradient-to-r from-transparent via-zinc-600/20 px-2 text-center text-xl"
        >
          Artists:
        </div>
        <div class="flex w-full flex-col">
          {#each data.results.artists as artist, index (artist.id)}
            <a
              class="flex justify-between from-zinc-600/10 p-2 pl-4 transition-colors hover:bg-gradient-to-r"
              in:fly|global={{ duration: 500, easing: quintOut, x: -20, delay: 30 * index }}
              animate:flip={{ duration: 500 }}
              href="/artist/{artist.id}"
            >
              <div>
                {artist.name}
              </div>
              <div>
                (
                {#if artist._count.albums > 0}
                  {artist._count.albums} album{#if artist._count.albums > 1}s{/if}
                {/if}
                {#if artist._count.tracks > 0}
                  {artist._count.tracks} track{#if artist._count.tracks > 1}s{/if}
                {/if}
                )
              </div>
            </a>
          {/each}
        </div>
        {#if type !== 'artist' && data.results.artists.length < data.total.artists}
          <button class="pb-2 pl-2 hover:underline" on:click={() => setType('artist')}>
            Show all results
          </button>
        {/if}
      {/if}
    {/if}
    {#if data?.success === false}
      <div class="p-2 text-center text-2xl">There are no results</div>
    {/if}
  </div>
</div>
