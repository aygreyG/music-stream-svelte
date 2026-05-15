<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import PlaylistTrackList from '$lib/components/PlaylistTrackList.svelte';
  import type { SignedInUser } from '$lib/shared/types';

  interface Props {
    open?: boolean;
    user: SignedInUser | null;
    trackId: string | undefined;
    trackTitle: string | undefined;
    onclose: () => void;
    onplaylistchange?: (playlistId: string, added: boolean) => void;
  }

  let { open = false, user, trackId, trackTitle, onclose, onplaylistchange }: Props = $props();
</script>

{#if open && user && trackId}
  <Modal title={`Add "${trackTitle}" to playlist`} {onclose}>
    <div class="p-4">
      <PlaylistTrackList {user} {trackId} {onplaylistchange} />
    </div>
  </Modal>
{/if}
