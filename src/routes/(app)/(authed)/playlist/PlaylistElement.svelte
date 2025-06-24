<script lang="ts">
  import { enhance } from '$app/forms';
  import { crossfade } from '$lib/transitions/crossfade';
  import { fade } from 'svelte/transition';
  import PlaylistImage from '$lib/components/PlaylistImage.svelte';
  import RoundCheckCircle from '~icons/ic/round-check-circle';
  import TrashFill from '~icons/iconamoon/trash-fill';
  import { vibrate } from '$lib/actions/vibrate';
  import type { Prisma } from '../../../../generated/prisma-client/client';

  interface Props {
    playlist: Prisma.PlaylistGetPayload<{
      select: {
        name: true;
        id: true;
        tracks: {
          select: {
            album: { select: { id: true; albumArtAccent: true; title: true; albumArtId: true } };
          };
        };
      };
    }>;
    selected?: boolean;
  }

  let { playlist, selected = false }: Props = $props();

  const albumSet: Prisma.AlbumGetPayload<{
    select: { id: true; title: true; albumArtId: true; albumArtAccent: true };
  }>[] = [];
  let nameInput: HTMLInputElement | null = $state(null);
  let playlistName: string = $state(playlist.name);
  let deleteClicked = $state(false);
  const [send] = crossfade;
  let timeout: string | number | NodeJS.Timeout | undefined = $state();

  for (const track of playlist.tracks) {
    if (!albumSet.find((a) => a.id === track.album.id)) {
      albumSet.push(track.album);
    }

    if (albumSet.length === 4) break;
  }

  $effect(() => {
    if (selected) {
      nameInput?.focus();
    }
  });
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
      class="w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-none bg-transparent px-6 py-0 text-center outline-none transition-all focus-visible:bg-zinc-600 focus-visible:ring-2 focus-visible:ring-primary"
      onblur={() => {
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
