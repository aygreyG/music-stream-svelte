<script lang="ts">
  import type { Track } from '@prisma/client';
  import { flip } from 'svelte/animate';
  import HeartFill from 'virtual:icons/iconamoon/heart-fill';
  import Heart from 'virtual:icons/iconamoon/heart';
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import Modal from '$lib/components/Modal.svelte';
  import type { SignedInUser } from '$lib/shared/types';

  export let open: boolean = false;
  export let user: SignedInUser | null;
  export let track: Track | undefined;
</script>

{#if open && user && track}
  <Modal title={`Add "${track.title}" to playlist`} on:close>
    <div class="flex flex-col items-center gap-2 p-4">
      <form
        use:enhance
        class="flex w-full max-w-lg justify-between rounded-md border-none bg-zinc-600"
        method="POST"
        action="?/addplaylist"
      >
        <input type="hidden" name="trackid" value={track.id} />
        <input
          class="w-full flex-grow rounded-s-md border-none bg-zinc-600 p-2 outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
          type="text"
          autocomplete="off"
          placeholder="New playlist"
          name="playlistname"
          required
        />
        <button
          class="w-fit rounded-e-md border-none bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
          type="submit"
          use:vibrate
        >
          Add
        </button>
      </form>

      {#each user.playlists as playlist (playlist.id)}
        <form
          class="flex w-full max-w-lg items-center justify-between rounded-md border-none bg-zinc-600 px-2 py-1"
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
          <input type="hidden" name="trackid" value={track.id} />
          <button type="submit" class="group" use:vibrate>
            {#if playlist.tracks.some((t) => t.id === track.id)}
              <input type="hidden" name="remove" value={true} />
              <HeartFill class="text-2xl transition-colors hover:text-primary" />
            {:else}
              <HeartFill
                class="text-2xl text-primary opacity-0 transition-all group-hover:opacity-100"
              />
              <Heart class="absolute left-0 top-0 text-2xl transition-all group-hover:opacity-0" />
            {/if}
          </button>
        </form>
      {/each}
    </div>
  </Modal>
{/if}
