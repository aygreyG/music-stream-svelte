<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PlaylistWithTracks } from '$lib/shared/types';
  import { crossfade } from '$lib/transitions/crossfade';
  import type { Album } from '@prisma/client';
  import { fade } from 'svelte/transition';
  import PlaylistImage from '$lib/components/PlaylistImage.svelte';
  import RoundCheckCircle from 'virtual:icons/ic/round-check-circle';
  import TrashFill from 'virtual:icons/iconamoon/trash-fill';
  import { vibrate } from '$lib/actions/vibrate';

  export let playlist: PlaylistWithTracks;
  export let selected: boolean = false;

  const albumSet: Album[] = [];
  let nameInput: HTMLInputElement;
  let playlistName: string = playlist.name;
  let deleteClicked = false;
  const [send, receive] = crossfade;
  let timeout: string | number | NodeJS.Timeout | undefined;

  for (const track of playlist.tracks) {
    if (!albumSet.find((a) => a.id === track.album.id)) {
      albumSet.push(track.album);
    }

    if (albumSet.length === 4) break;
  }

  $: {
    if (selected) {
      nameInput?.focus();
    }
  }
</script>

<form
  class="flex h-full w-full flex-col items-center justify-between overflow-clip rounded-md bg-zinc-950/20"
  title={playlist.name}
  action="?/update"
  method="POST"
  use:enhance={({ action, cancel }) => {
    if (action.search === '?/delete') {
      if (deleteClicked) {
        deleteClicked = false;
      } else {
        deleteClicked = true;

        setTimeout(() => {
          deleteClicked = false;
        }, 1500);

        cancel();
      }
    } else {
      clearTimeout(timeout);
    }

    return async ({ update }) => {
      await update({ reset: false });
    };
  }}
>
  <input type="hidden" name="id" value={playlist.id} />

  <a
    href="/playlist/{playlist.id}"
    class="flex h-3/4 w-full flex-none items-center justify-center px-2 pt-2"
    out:send|global={{ key: playlist.id, duration: 300 }}
  >
    <div class="aspect-square h-full overflow-clip rounded-md">
      <PlaylistImage {albumSet} />
    </div>
  </a>

  <div class="my-2 w-full px-2 text-center">
    <input
      type="text"
      autocomplete="off"
      bind:this={nameInput}
      bind:value={playlistName}
      name="name"
      class="w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-none bg-transparent px-6 py-0 text-center outline-none transition-all focus-visible:bg-zinc-600 focus-visible:ring-2 focus-visible:ring-fuchsia-600"
      on:blur={() => {
        if (playlistName === '') {
          playlistName = playlist.name;
        } else {
          timeout = setTimeout(() => {
            if (playlistName !== playlist.name) {
              playlistName = playlist.name;
            }
          }, 100);
        }
      }}
    />

    {#if playlistName !== playlist.name && playlistName !== ''}
      <button
        use:vibrate
        transition:fade={{ duration: 200 }}
        class="absolute bottom-0 right-2"
        type="submit"
      >
        <RoundCheckCircle class="text-xl text-green-600/80" />
      </button>
    {:else}
      <button
        class="absolute bottom-0 right-2 text-rose-700/80"
        formaction="?/delete"
        type="submit"
        use:vibrate
      >
        {#if deleteClicked}
          <div in:fade={{ duration: 200 }}>
            <RoundCheckCircle class="text-xl" />
          </div>
        {:else}
          <div in:fade={{ duration: 200 }}>
            <TrashFill class="text-xl" />
          </div>
        {/if}
      </button>
    {/if}
  </div>
</form>
