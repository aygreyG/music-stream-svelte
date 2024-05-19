<script lang="ts">
  import PlaylistImage from '$lib/components/PlaylistImage.svelte';
  import { fade } from 'svelte/transition';
  import { crossfade } from '$lib/transitions/crossfade';
  import { flip } from 'svelte/animate';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import { enhance } from '$app/forms';
  import HeartOff from 'virtual:icons/iconamoon/heart-off';
  import { playTrack } from '$lib/stores/audioPlayer.js';
  import { vibrate } from '$lib/actions/vibrate.js';

  export let data;
  const [send, receive] = crossfade;
  let container: HTMLDivElement;
  let scrolled = false;
</script>

<div class="flex h-full w-full flex-col">
  <div
    class="flex items-center justify-center gap-6 p-4 transition-shadow md:justify-start"
    class:shadow-md={scrolled}
  >
    <div
      class="flex h-32 w-32 flex-none items-center justify-center overflow-clip rounded-md md:h-40 md:w-40 xl:h-48 xl:w-48"
      in:receive|global={{ key: data.playlist.id, duration: 300 }}
    >
      <PlaylistImage albumSet={data.albumSet} />
    </div>

    <div
      in:fade|global={{ delay: 250, duration: 250 }}
      class="flex flex-col items-start justify-center text-2xl"
    >
      {data.playlist.name}
      {#if data.playlist.tracks.length > 0}
        <div class="text-sm">
          {data.playlist.tracks.length} tracks
        </div>
      {/if}
    </div>
  </div>

  <div
    class="flex h-full flex-col overflow-auto"
    bind:this={container}
    on:scroll={() => (scrolled = container?.scrollTop > 0)}
  >
    {#each data.playlist.tracks as track, index (track.id)}
      <div class="w-full flex-none" animate:flip={{ duration: 250 }}>
        <TrackRow
          handleClick={() => {
            playTrack(data.playlist.tracks, index);
          }}
          {track}
          delay={250 + index * 30}
        >
          <form use:enhance slot="button" action="?/remove" method="POST">
            <input type="hidden" name="trackId" value={track.id} />
            <button
              class="flex h-full w-full items-center justify-center"
              title="Remove"
              type="submit"
              use:vibrate
            >
              <HeartOff class="text-2xl text-zinc-600 hover:text-primary" />
            </button>
          </form>
        </TrackRow>
      </div>
    {:else}
      <div class="text-white/70 text-center text-xl px-4">
        There are no tracks in this playlist.
      </div>
    {/each}
  </div>
</div>
