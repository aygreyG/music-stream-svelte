<script lang="ts">
  import { onMount } from 'svelte';
  import RoundSearch from '~icons/ic/round-search';
  import RoundFileUpload from '~icons/ic/round-file-upload';
  import RoundRefresh from '~icons/ic/round-refresh';
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import { vibrate } from '$lib/actions/vibrate';
  import Modal from '$lib/components/Modal.svelte';
  import AlbumArtFromRelease from './AlbumArtFromRelease.svelte';
  import type { AlbumReleaseSearchResult } from '$lib/shared/types';
  import type { Prisma } from '../../../../../generated/prisma-client/client';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  interface Props {
    album: Prisma.AlbumGetPayload<{
      select: { title: true; albumArtist: { select: { name: true } }; id: true };
    }>;
    onclose: () => void;
  }

  let { album, onclose }: Props = $props();
  let releaseResponse: Promise<AlbumReleaseSearchResult> | undefined = $state();
  let albumArtLoading: boolean = $state(false);
  let albumArtQuery: string = $state('');
  const audioPlayer = getAudioPlayer();

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

  async function chooseAlbumArt(releaseId: string) {
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
      if (audioPlayer.currentTrack && audioPlayer.currentTrack.album.id === album.id) {
        const responseJson = await response.json();
        audioPlayer.currentTrack.album = {
          ...audioPlayer.currentTrack.album,
          albumArtId: responseJson.albumArtInfo.albumArtId
        };
      }

      await invalidate('album:art');
    }

    onclose();
  }

  onMount(() => {
    albumArtQuery = `${album.title} AND artist:${album.albumArtist.name}`;
    searchArt();
  });
</script>

<Modal title="Edit album art" {onclose}>
  <div class="flex flex-col items-center">
    <form
      use:enhance={() => {
        albumArtLoading = true;

        return async ({ update, result }) => {
          await update();
          if (result.type === 'success') {
            if (
              audioPlayer.currentTrack &&
              audioPlayer.currentTrack.album.id === album.id &&
              result?.data?.albumArtInfo
            ) {
              const responseData = result.data.albumArtInfo as Record<string, string>;
              audioPlayer.currentTrack.album = {
                ...audioPlayer.currentTrack.album,
                albumArtId: responseData.albumArtId
              };
            }
          }

          albumArtLoading = false;
          onclose();
        };
      }}
      enctype="multipart/form-data"
      method="POST"
      action="?/uploadart"
      class="flex w-full max-w-4xl flex-col justify-between gap-4 px-6 py-4 lg:flex-row lg:gap-0"
    >
      <input accept="image/*" name="artfile" type="file" required />
      <button
        class="bg-primary text-on-primary hover:bg-primary/80 focus-visible:bg-primary/80 flex items-center justify-center rounded-md px-4 transition-colors"
        type="submit"
        use:vibrate
      >
        Upload <RoundFileUpload class="text-xl" />
      </button>
    </form>

    <div class="flex w-full max-w-4xl px-6 py-1">
      <input
        class="focus-visible:ring-primary w-full rounded-s-xl border-none bg-zinc-600/50 py-1 text-ellipsis outline-hidden transition-all focus-visible:ring-2"
        type="text"
        bind:value={albumArtQuery}
        onkeydown={(e) => e.key === 'Enter' && searchArt()}
      />
      <button
        class="focus-visible:ring-primary focus-visible:bg-on-primary focus-visible:text-primary bg-primary text-on-primary flex items-center justify-center rounded-e-xl px-2 py-1 outline-hidden transition-colors focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        onclick={searchArt}
        use:vibrate
        disabled={albumArtQuery === '' || albumArtLoading}
        title="Search for album art"
      >
        <RoundSearch class="text-xl" />
      </button>
    </div>
    <div class="w-full max-w-4xl px-6 pb-2 text-xs">
      Options for searching album art
      <a
        class="hover:text-primary underline transition-colors"
        href="https://musicbrainz.org/doc/MusicBrainz_API/Search#Release"
        target="_blank">here</a
      >.
    </div>
  </div>

  {#if albumArtLoading}
    <div class="flex h-full w-full items-center justify-center">
      <RoundRefresh class="text-primary ml-2 h-8 w-8 animate-spin" />
    </div>
  {:else}
    {#await releaseResponse}
      <div class="flex h-full w-full items-center justify-center">
        <RoundRefresh class="text-primary ml-2 h-8 w-8 animate-spin" />
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
          {#each response.releases as release (release.id)}
            <AlbumArtFromRelease onchoose={chooseAlbumArt} {release} />
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
