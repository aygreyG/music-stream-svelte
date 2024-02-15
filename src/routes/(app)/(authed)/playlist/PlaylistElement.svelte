<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PlaylistWithTracks } from '$lib/shared/types';
  import { crossfade } from '$lib/transitions/crossfade';
  import type { Album } from '@prisma/client';
  import { fade } from 'svelte/transition';
  import PlaylistImage from '$lib/components/PlaylistImage.svelte';

  export let playlist: PlaylistWithTracks;
  export let selected: boolean = false;

  const albumSet: Album[] = [];
  let nameInput: HTMLInputElement;
  let playlistName: string = playlist.name;
  let deleteClicked = false;
  const [send, receive] = crossfade;

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
        }, 2000);

        cancel();
      }
    }

    return async ({ update }) => {
      await update({ reset: false });
    };
  }}
>
  <input type="hidden" name="id" value={playlist.id} />

  <a
    href="/playlist/{playlist.id}"
    class="flex h-2/3 w-full flex-none items-center justify-center px-2 pt-2"
    out:send|global={{ key: playlist.id, duration: 300 }}
  >
    <div class="aspect-square h-full overflow-clip rounded-md">
      <PlaylistImage {albumSet} />
    </div>
  </a>

  <input
    type="text"
    autocomplete="off"
    bind:this={nameInput}
    bind:value={playlistName}
    name="name"
    class="w-11/12 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-none bg-transparent px-1 py-0 text-center outline-none transition-all focus-visible:bg-zinc-600 focus-visible:ring-2 focus-visible:ring-fuchsia-600"
  />
  <div class="flex w-full items-center justify-center text-sm text-white">
    <button
      disabled={playlistName === playlist.name || playlistName === ''}
      class="w-1/2 bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Update
    </button>
    <button class="w-1/2 bg-rose-700" formaction="?/delete" type="submit">
      {#if deleteClicked}
        <div in:fade>Sure?</div>
      {:else}
        <div in:fade>Delete</div>
      {/if}
    </button>
  </div>
</form>
