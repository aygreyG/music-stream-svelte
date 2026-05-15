<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { vibrate } from '$lib/actions/vibrate';
  import type { SignedInUser } from '$lib/shared/types';

  import RoundAdd from '~icons/ic/round-add';
  import RoundRefresh from '~icons/ic/round-refresh';
  import CheckBold from '~icons/iconamoon/check-bold';

  interface Props {
    user: SignedInUser | null;
    trackId: string | undefined;
    onplaylistchange?: (playlistId: string, added: boolean) => void;
  }

  let { user, trackId, onplaylistchange }: Props = $props();

  let newPlaylistName = $state('');
  let newPlaylistLoading = $state(false);
  let togglingPlaylistId = $state<string | null>(null);

  async function createPlaylist() {
    if (!newPlaylistName || !trackId || newPlaylistLoading) return;
    newPlaylistLoading = true;
    try {
      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName, trackId })
      });
      if (res.ok) {
        newPlaylistName = '';
        const data = await res.json();
        onplaylistchange?.(data.playlist.id, true);
        await invalidate('load:main');
      }
    } finally {
      newPlaylistLoading = false;
    }
  }

  async function togglePlaylistTrack(playlistId: string, isInPlaylist: boolean) {
    if (!trackId) return;
    togglingPlaylistId = playlistId;
    try {
      const res = await fetch(`/api/playlist/${playlistId}/track`, {
        method: isInPlaylist ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId })
      });
      if (res.ok) {
        onplaylistchange?.(playlistId, !isInPlaylist);
        await invalidate('load:main');
      }
    } finally {
      togglingPlaylistId = null;
    }
  }
</script>

<form
  class="mb-2 flex w-full justify-between rounded-xl border-none px-0.5"
  onsubmit={(e) => {
    e.preventDefault();
    createPlaylist();
  }}
>
  <input
    class="focus-visible:ring-primary placeholder-on-surface/60 bg-surface-variant/40 w-full grow rounded-s-xl border-none p-3 outline-hidden transition-all focus-visible:ring-2"
    type="text"
    autocomplete="off"
    placeholder="New playlist"
    bind:value={newPlaylistName}
    required
  />
  <button
    class="focus-visible:ring-primary bg-surface-variant/40 w-fit rounded-e-xl border-none px-2 py-1 outline-hidden transition-all focus-visible:ring-2"
    type="submit"
    use:vibrate
    disabled={newPlaylistLoading}
  >
    {#if newPlaylistLoading}
      <RoundRefresh class="flex-none animate-spin text-xl" />
    {:else}
      Add
    {/if}
  </button>
</form>

<div class="flex flex-col gap-2">
  {#if user}
    {#each user.playlists as playlist (playlist.id)}
      {@const isInPlaylist = playlist.tracks.some((t) => t.id === trackId)}
      <button
        class="bg-surface-variant/40 hover:bg-on-surface/10 flex w-full items-center justify-between gap-1 rounded-xl p-3 pr-2 text-left transition-colors"
        use:vibrate
        disabled={togglingPlaylistId === playlist.id}
        onclick={() => togglePlaylistTrack(playlist.id, isInPlaylist)}
      >
        <div class="line-clamp-1 w-full">
          {playlist.name}
        </div>
        <div class="text-xs font-semibold opacity-60">({playlist.tracks.length})</div>
        {#if togglingPlaylistId === playlist.id}
          <RoundRefresh class="flex-none animate-spin text-xl" />
        {:else if isInPlaylist}
          <CheckBold class="text-primary flex-none text-xl" />
        {:else}
          <RoundAdd class="flex-none text-xl opacity-40" />
        {/if}
      </button>
    {/each}
  {/if}
</div>
