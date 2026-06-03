<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  import scroll from '$lib/actions/scroll.svelte';
  import PlaylistImage from '$lib/components/PlaylistImage.svelte';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte.js';

  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let scrolled = $state(false);
  const audioPlayer = getAudioPlayer();
</script>

<div class="flex h-full w-full flex-col">
  <div
    class={[
      'flex items-center justify-center gap-6 p-4 transition-shadow md:justify-start',
      scrolled && 'shadow-md'
    ]}
    in:fade|global={{ duration: 250 }}
  >
    <div
      class="flex h-32 w-32 flex-none items-center justify-center overflow-clip rounded-md md:h-40 md:w-40 xl:h-48 xl:w-48"
    >
      <PlaylistImage albumSet={data.albumSet} />
    </div>

    <div class="flex flex-col items-start justify-center text-2xl">
      {data.playlist.name}
      {#if data.playlist.tracks.length > 0}
        <div class="text-sm">
          {data.playlist.tracks.length} track{data.playlist.tracks.length !== 1 ? 's' : ''}
        </div>
      {/if}
    </div>
  </div>

  <div
    class="flex h-full flex-col overflow-auto"
    use:scroll
    onscrolltopchange={(e) => (scrolled = e.detail.scrollTop > 0)}
  >
    {#each data.playlist.tracks as track, index (track.id)}
      <div
        class={['w-full flex-none', index === data.playlist.tracks.length - 1 && 'pb-2']}
        animate:flip={{ duration: 250 }}
      >
        <TrackRow
          handleClick={() => {
            audioPlayer.playTrack(data.playlist.tracks, index, true, {
              title: data.playlist.name,
              id: data.playlist.id
            });
          }}
          {track}
          user={data.user}
          currentPlaylistId={data.playlist.id}
          delay={250 + index * 30}
        />
      </div>
    {:else}
      <div class="text-center text-xl px-4">There are no tracks in this playlist.</div>
    {/each}
  </div>
</div>
