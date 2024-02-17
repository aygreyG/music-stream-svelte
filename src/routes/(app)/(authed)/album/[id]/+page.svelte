<script lang="ts">
  import RoundEdit from 'virtual:icons/ic/round-edit';
  import RoundClose from 'virtual:icons/ic/round-close';
  import HeartFill from 'virtual:icons/iconamoon/heart-fill';
  import Heart from 'virtual:icons/iconamoon/heart';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { searchForAlbumRelease } from '$lib/shared/fetchAlbumArt.js';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { cubicIn, cubicInOut } from 'svelte/easing';
  import { crossfade } from '$lib/transitions/crossfade';
  import type { AlbumReleaseSearchResult } from '$lib/shared/types.js';
  import AlbumArtFromRelease from './AlbumArtFromRelease.svelte';
  const [send, receive] = crossfade;
  import RoundRefresh from 'virtual:icons/ic/round-refresh';
  import { invalidate } from '$app/navigation';
  import type { Track } from '@prisma/client';
  import { enhance } from '$app/forms';
  import { flip } from 'svelte/animate';
  import TrackRow from '$lib/components/TrackRow.svelte';

  export let data;
  let animate: boolean = false;
  let albumAnimating: boolean = false;
  let editModalOpen: boolean = false;
  let playlistModalOpen: boolean = false;
  let playlistModalTrack: Track;
  let releaseResponse: Promise<AlbumReleaseSearchResult>;
  let albumArtLoading: boolean = false;
  let container: HTMLDivElement;
  let scrolled = false;

  async function openEditModal() {
    if (!releaseResponse) {
      releaseResponse = searchForAlbumRelease(data.album.albumArtist.name, data.album.title);
    }
    editModalOpen = true;
  }

  function openPlaylistModal(track: Track) {
    playlistModalTrack = track;
    playlistModalOpen = true;
  }

  async function chooseAlbumArt({ detail: { releaseId } }: CustomEvent<{ releaseId: string }>) {
    albumArtLoading = true;
    const response = await fetch(`/api/admin/art/${data.album.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ releaseId })
    });

    editModalOpen = false;
    albumArtLoading = false;

    if (response.ok) {
      await invalidate('album:art');
    }
  }

  onMount(() => {
    animate = true;
  });
</script>

{#key data.album.id}
  <div class="absolute left-0 top-0 flex h-full w-full flex-col overflow-hidden">
    {#if animate}
      <div
        in:fade|global={{ duration: 500, easing: cubicInOut }}
        class="absolute left-0 top-0 h-full w-full opacity-10"
      >
        <AlbumImage
          key={data.album.updatedAt.toISOString()}
          blur
          alt="Backdrop for {data.album.title}"
          id={data.album.id}
          maxSize="s"
        />
      </div>
    {/if}
    <div class="flex h-full flex-col">
      <div
        class="flex items-center justify-center gap-6 p-4 transition-shadow md:justify-start"
        class:shadow-md={scrolled}
        in:fade|global={{ duration: 500, easing: cubicInOut }}
      >
        <div
          class="group h-32 w-32 overflow-clip rounded-md"
          class:z-20={albumAnimating}
          in:receive|global={{ key: `album-image-${data.album.id}` }}
          on:introstart={() => (albumAnimating = true)}
          on:introend={() => (albumAnimating = false)}
        >
          <AlbumImage
            key={data.album.updatedAt.toISOString()}
            alt={data.album.title}
            id={data.album.id}
          />
          {#if !albumAnimating && data.user?.role !== 'USER'}
            <div
              class="absolute bottom-0 left-0 flex gap-2 rounded-bl-md rounded-tr-md bg-zinc-900/80 backdrop-blur-sm transition-all group-hover:opacity-100 sm:opacity-0"
            >
              <button on:click={openEditModal}>
                <RoundEdit
                  class="p-1 text-3xl text-fuchsia-600/70 transition-colors hover:text-fuchsia-600"
                />
              </button>
            </div>
          {/if}
        </div>
        <div class="flex flex-col">
          <div>
            {data.album.title}
          </div>
          <a class="hover:underline" href="/artist/{data.album.albumArtistId}">
            {data.album.albumArtist.name}
          </a>
          <div>
            {data.album.releaseDate || ''}
          </div>
        </div>
      </div>

      <div
        class="flex h-full flex-col overflow-auto"
        bind:this={container}
        on:scroll={() => (scrolled = container?.scrollTop > 0)}
      >
        {#each data.album.tracks as track, index (track.id)}
          <div class="w-full flex-none">
            <TrackRow track={{ ...track, album: data.album }} delay={250 + index * 30}>
              <button
                on:click={() => openPlaylistModal(track)}
                slot="button"
                class="flex h-full w-full items-center justify-center text-zinc-600 hover:text-fuchsia-600"
              >
                {#if track.playlists.length > 0}
                  <HeartFill class="text-2xl transition-colors" />
                {:else}
                  <Heart class="text-2xl transition-colors" />
                {/if}
              </button>
            </TrackRow>
          </div>
        {/each}
      </div>
    </div>
  </div>

  {#if editModalOpen}
    <div
      transition:fade={{ duration: 200, easing: cubicIn }}
      class="absolute left-0 top-0 z-10 h-full w-full bg-zinc-900/5 backdrop-blur-sm"
    >
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="absolute left-0 top-0 h-full w-full"
        on:click={() => (editModalOpen = !editModalOpen)}
      />
      <div
        class="absolute left-0 top-0 m-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)] overflow-auto rounded-md bg-zinc-900/95"
      >
        <div class="flex items-center justify-between">
          <div class="w-full text-center text-xl font-bold">Edit album art</div>
          <div
            class="flex items-center justify-center rounded-bl-md rounded-tr-md hover:bg-zinc-600/20"
          >
            <button on:click={() => (editModalOpen = !editModalOpen)}>
              <RoundClose
                class="p-1 text-3xl text-fuchsia-600/70 transition-colors hover:text-fuchsia-600"
              />
            </button>
          </div>
        </div>

        {#if albumArtLoading}
          <div class="flex h-full w-full items-center justify-center">
            <RoundRefresh class="ml-2 h-8 w-8 animate-spin text-fuchsia-600" />
          </div>
        {:else}
          {#await releaseResponse}
            <div class="flex h-full w-full items-center justify-center">
              <RoundRefresh class="ml-2 h-8 w-8 animate-spin text-fuchsia-600" />
            </div>
          {:then rresponse}
            {#if rresponse.releases.length === 0}
              <div class="flex h-full w-full flex-col items-center justify-center gap-2">
                <div class="text-2xl font-bold">No results found</div>
                <div class="text-xl">Try searching for something else</div>
              </div>
            {:else}
              <div class="flex flex-wrap items-center justify-center gap-2">
                {#each rresponse.releases as release}
                  <AlbumArtFromRelease on:choosen={chooseAlbumArt} {release} />
                {/each}
              </div>
            {/if}
          {/await}
        {/if}
      </div>
    </div>
  {/if}

  {#if playlistModalOpen}
    <div
      transition:fade={{ duration: 200, easing: cubicIn }}
      class="absolute left-0 top-0 z-10 h-full w-full bg-zinc-900/5 backdrop-blur-sm"
    >
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="absolute left-0 top-0 h-full w-full"
        on:click={() => (playlistModalOpen = !playlistModalOpen)}
      />
      <div
        class="absolute left-0 top-0 m-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)] overflow-auto rounded-md bg-zinc-900/95"
      >
        <div class="flex items-center justify-between">
          <div class="w-full px-8 text-center text-xl font-bold">
            Add "{playlistModalTrack.title}" to playlist
          </div>
          <div
            class="absolute right-0 top-0 flex items-center justify-center rounded-bl-md rounded-tr-md hover:bg-zinc-600/20"
          >
            <button on:click={() => (playlistModalOpen = !playlistModalOpen)}>
              <RoundClose
                class="p-1 text-3xl text-fuchsia-600/70 transition-colors hover:text-fuchsia-600"
              />
            </button>
          </div>
        </div>

        {#if data.user}
          <div class="flex flex-col items-center gap-2 px-4 py-2">
            <form
              use:enhance
              class="flex w-full justify-between rounded-md border-none bg-zinc-600"
              method="POST"
              action="?/addplaylist"
            >
              <input type="hidden" name="trackid" value={playlistModalTrack.id} />
              <input
                class="flex-grow rounded-s-md border-none bg-zinc-600 p-2 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
                type="text"
                autocomplete="off"
                placeholder="New playlist"
                name="playlistname"
                required
              />
              <button
                class="w-fit rounded-e-md border-none bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
                type="submit"
              >
                Add
              </button>
            </form>

            {#each data.user.playlists as playlist (playlist.id)}
              <form
                class="flex w-full items-center justify-between rounded-md border-none bg-zinc-600 px-2 py-1"
                method="POST"
                use:enhance
                animate:flip={{ duration: 100 }}
                action="?/addtoplaylist"
              >
                <div class="flex w-full items-center justify-between pr-2">
                  <div>{playlist.name}</div>
                  <div>({playlist.tracks.length})</div>
                </div>
                <input type="hidden" name="playlistid" value={playlist.id} />
                <input type="hidden" name="trackid" value={playlistModalTrack.id} />
                <button type="submit" class="group">
                  {#if playlist.tracks.some((t) => t.id === playlistModalTrack.id)}
                    <input type="hidden" name="remove" value={true} />
                    <HeartFill class="text-2xl transition-colors hover:text-fuchsia-600" />
                  {:else}
                    <HeartFill
                      class="text-2xl text-fuchsia-600 opacity-0 transition-all group-hover:opacity-100"
                    />
                    <Heart
                      class="absolute left-0 top-0 text-2xl transition-all group-hover:opacity-0"
                    />
                  {/if}
                </button>
              </form>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/key}
