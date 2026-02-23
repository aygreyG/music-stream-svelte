<script lang="ts">
  import type { Prisma } from '../../../../../generated/prisma-client/client';
  import { flip } from 'svelte/animate';
  import HeartFill from '~icons/iconamoon/heart-fill';
  import Heart from '~icons/iconamoon/heart';
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import Modal from '$lib/components/Modal.svelte';
  import type { SignedInUser } from '$lib/shared/types';
  import RoundRefresh from '~icons/ic/round-refresh';

  interface Props {
    open?: boolean;
    user: SignedInUser | null;
    track: Prisma.TrackGetPayload<{ select: { title: true; id: true } }> | undefined;
    onclose: () => void;
  }

  let { open = false, user, track, onclose }: Props = $props();

  let loading = $state(false);
</script>

{#if open && user && track}
  <Modal title={`Add "${track.title}" to playlist`} {onclose}>
    <div class="flex flex-col items-center gap-2 p-4">
      <form
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
        class="flex w-full max-w-lg justify-between rounded-xl border-none bg-zinc-600/30"
        method="POST"
        action="?/addplaylist"
      >
        <input type="hidden" name="trackid" value={track.id} />
        <input
          class="focus-visible:ring-primary w-full grow rounded-s-xl border-none bg-transparent outline-hidden transition-all focus-visible:ring-2"
          type="text"
          autocomplete="off"
          placeholder="New playlist"
          name="playlistname"
          required
        />
        <button
          class="focus-visible:ring-primary w-fit rounded-e-xl border-none bg-transparent px-2 py-1 outline-hidden transition-all focus-visible:ring-2"
          type="submit"
          use:vibrate
          disabled={loading}
        >
          {#if loading}
            <RoundRefresh class="animate-spin text-xl" />
          {:else}
            Add
          {/if}
        </button>
      </form>

      {#each user.playlists as playlist (playlist.id)}
        <form
          class="flex w-full max-w-lg items-center justify-between rounded-xl border-none bg-zinc-600/30 py-1 pr-2 pl-3"
          method="POST"
          use:enhance
          animate:flip={{ duration: 100 }}
          action="?/addtoplaylist"
        >
          <div class="flex w-full items-center justify-between pr-2">
            <a href="/playlist/{playlist.id}">{playlist.name}</a>
            <div>({playlist.tracks.length})</div>
          </div>
          <input type="hidden" name="playlistid" value={playlist.id} />
          <input type="hidden" name="trackid" value={track.id} />
          <button type="submit" class="group" use:vibrate>
            {#if playlist.tracks.some((t) => t.id === track.id)}
              <input type="hidden" name="remove" value={true} />
              <HeartFill class="hover:text-primary text-on-primary text-2xl transition-colors" />
            {:else}
              <HeartFill
                class="text-primary text-2xl opacity-0 transition-all group-hover:opacity-100"
              />
              <Heart
                class="text-on-primary absolute top-0 left-0 text-2xl transition-all group-hover:opacity-0"
              />
            {/if}
          </button>
        </form>
      {/each}
    </div>
  </Modal>
{/if}
