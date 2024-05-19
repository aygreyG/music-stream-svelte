<script lang="ts">
  import { vibrate } from '$lib/actions/vibrate';
  import { getAlbumArtUrl } from '$lib/shared/fetchAlbumArt';
  import type { Release } from '$lib/shared/types';
  import { createEventDispatcher } from 'svelte';

  export let release: Release;
  let showImage: boolean = false;
  const dispatch = createEventDispatcher();
</script>

<div class="flex w-40 flex-none flex-col items-center justify-center">
  <div class="h-36 w-36 flex-none overflow-clip rounded-md bg-zinc-600/80">
    {#if showImage}
      <img
        class="h-full w-full object-cover"
        src={getAlbumArtUrl(release.id)}
        alt="Art for {release.title}"
      />
    {/if}
  </div>
  <div>{release['artist-credit'].map((ac) => ac.artist.name).join(', ')}</div>
  <div>{release.title}</div>
  <div class="m-2 flex overflow-clip rounded-md text-sm font-bold">
    <button
      class="bg-primary transition-all hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-primary/65 disabled:opacity-80 disabled:hover:bg-primary/65"
      on:click={() => (showImage = true)}
      disabled={showImage}
      use:vibrate={{ mute: showImage }}
    >
      Show Image
    </button>
    <button
      class="bg-primary transition-all hover:bg-primary/80"
      on:click={() => dispatch('choosen', { releaseId: release.id })}
      use:vibrate
    >
      Choose Image
    </button>
  </div>
</div>
