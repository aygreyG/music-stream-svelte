<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import AlbumLink from '../../AlbumLink.svelte';

  export let data;
  let animate = false;

  onMount(() => {
    animate = true;
  });
</script>

<div class="h-full overflow-auto p-2">
  {#if animate}
    <h1 out:fade|global={{ duration: 250 }} class="p-2 text-center text-2xl font-bold">
      {data.artist.name}
    </h1>
    {#if data.artist.albums.length > 0}
      <div
        class="p-1 text-lg font-bold"
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 50 }}
        out:fade|global={{ duration: 250 }}
      >
        Albums:
      </div>
      <div class="flex flex-wrap items-center justify-center gap-8 p-2">
        {#each data.artist.albums as album, index (album.id)}
          <AlbumLink album={{ ...album, albumArtist: data.artist }} {index} />
        {/each}
      </div>
    {/if}
    {#if data.artist.tracks.length > 0}
      <div
        in:fly|global={{
          duration: 500,
          x: -20,
          easing: quintOut,
          delay: 50 + data.artist.albums.length * 50
        }}
        class="p-1 text-lg font-bold"
      >
        Featured on {data.artist.tracks.length} track{#if data.artist.tracks.length > 1}s{/if}:
      </div>
      {#each data.artist.tracks as track, index (track.id)}
        <TrackRow {track} delay={30 * index} />
      {/each}
    {/if}
  {/if}
</div>
