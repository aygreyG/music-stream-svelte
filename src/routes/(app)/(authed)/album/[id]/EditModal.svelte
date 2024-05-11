<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import RoundSearch from 'virtual:icons/ic/round-search';
  import RoundFileUpload from 'virtual:icons/ic/round-file-upload';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import { vibrate } from '$lib/actions/vibrate';
  import Modal from '$lib/components/Modal.svelte';
  import { currentTrack } from '$lib/stores/audioPlayer';
  import AlbumArtFromRelease from './AlbumArtFromRelease.svelte';
  import type { AlbumReleaseSearchResult, AlbumWithArtist } from '$lib/shared/types';

  export let album: AlbumWithArtist;
  let releaseResponse: Promise<AlbumReleaseSearchResult>;
  let albumArtLoading: boolean = false;
  let albumArtQuery: string = `${album.title} AND artist:${album.albumArtist.name}`;

  const dispatch = createEventDispatcher();

  function searchArt() {
    if (
      releaseResponse === undefined ||
      (albumArtQuery !== '' &&
        !albumArtLoading &&
        albumArtQuery !== `${album.title} AND artist:${album.albumArtist.name}`)
    ) {
      releaseResponse = fetch('/api/admin/search-art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: albumArtQuery
        })
      }).then((res) => res.json() as Promise<AlbumReleaseSearchResult>);
    }
  }

  async function chooseAlbumArt({ detail: { releaseId } }: CustomEvent<{ releaseId: string }>) {
    albumArtLoading = true;
    const response = await fetch(`/api/admin/art/${album.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ releaseId })
    });

    albumArtLoading = false;

    if (response.ok) {
      // Handling if the currently playing track is from the same album
      if ($currentTrack && $currentTrack.albumId === album.id) {
        const responseJson = await response.json();
        $currentTrack.album.albumArtId = responseJson.albumArtId;
      }

      await invalidate('album:art');
    }

    dispatch('close');
  }

  onMount(() => searchArt());
</script>

<Modal title="Edit album art" on:close>
  <div class="flex flex-col items-center">
    <form
      use:enhance={() => {
        albumArtLoading = true;

        return async ({ update, result }) => {
          await update();
          console.log(result);
          if (result.type === 'success') {
            if ($currentTrack && $currentTrack.albumId === album.id && result?.data?.albumArtId) {
              $currentTrack.album.albumArtId = result.data.albumArtId.toString();
            }
          }

          albumArtLoading = false;
          dispatch('close');
        };
      }}
      enctype="multipart/form-data"
      method="POST"
      action="?/uploadart"
      class="flex w-full max-w-4xl flex-col justify-between gap-4 px-6 py-4 lg:flex-row lg:gap-0"
    >
      <input accept="image/*" name="artfile" type="file" required />
      <button
        class="flex items-center justify-center rounded-md bg-primary px-4 transition-colors hover:bg-primary/80 focus-visible:bg-primary/80"
        type="submit"
        use:vibrate
      >
        Upload <RoundFileUpload class="text-xl" />
      </button>
    </form>

    <div class="flex w-full max-w-4xl px-6 py-1">
      <input
        class="w-full text-ellipsis rounded-s-md border-none bg-zinc-600 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
        type="text"
        bind:value={albumArtQuery}
        on:keydown={(e) => e.key === 'Enter' && searchArt()}
      />
      <button
        class="flex items-center justify-center rounded-e-md border-s border-zinc-500 bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        on:click={searchArt}
        use:vibrate
        disabled={albumArtQuery === '' || albumArtLoading}
        title="Search for album art"
      >
        <RoundSearch class="text-xl" />
      </button>
    </div>
    <div class="w-full max-w-4xl px-6 pb-2 text-xs text-zinc-300">
      Options for searching album art
      <a
        class="underline transition-colors hover:text-primary"
        href="https://musicbrainz.org/doc/MusicBrainz_API/Search#Release"
        target="_blank">here</a
      >.
    </div>
  </div>

  {#if albumArtLoading}
    <div class="flex h-full w-full items-center justify-center">
      <RoundRefresh class="ml-2 h-8 w-8 animate-spin text-primary" />
    </div>
  {:else}
    {#await releaseResponse}
      <div class="flex h-full w-full items-center justify-center">
        <RoundRefresh class="ml-2 h-8 w-8 animate-spin text-primary" />
      </div>
    {:then response}
      {#if !response}
        <div class="flex h-full w-full flex-col items-center justify-center px-6">
          An error occured trying to get album arts. Please try again!
        </div>
      {:else if response.releases.length === 0}
        <div class="flex h-full w-full flex-col items-center justify-center gap-2">
          <div class="text-2xl font-bold">No results found</div>
          <div class="text-xl">Try searching for something else</div>
        </div>
      {:else}
        <div class="flex flex-wrap items-center justify-center gap-2">
          {#each response.releases as release}
            <AlbumArtFromRelease on:choosen={chooseAlbumArt} {release} />
          {/each}
        </div>
      {/if}
    {/await}
  {/if}
</Modal>

<style>
  input[type='file']::file-selector-button {
    border-radius: 0.25rem;
    border: none;
    padding: 0.1rem 0.2rem;
    font-size: 1rem;
    transition: all 0.2s;
  }
</style>
