<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  import PlaylistImage from '$lib/components/PlaylistImage.svelte';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte.js';

  import HeartFill from '~icons/iconamoon/heart-fill';

  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let container: HTMLDivElement | null = $state(null);
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
      {#if data.albumSet.length > 0}
        <PlaylistImage albumSet={data.albumSet} />
      {:else}
        <div
          class="bg-surface-variant/40 flex h-full w-full items-center justify-center rounded-md"
        >
          <HeartFill class="text-primary text-4xl" />
        </div>
      {/if}
    </div>

    <div class="flex flex-col items-start justify-center gap-1">
      <div class="text-2xl">Favourites</div>
      {#if data.favouriteTracks.length > 0}
        <div class="text-sm">
          {data.favouriteTracks.length} track{data.favouriteTracks.length !== 1 ? 's' : ''}
        </div>
      {/if}
    </div>
  </div>

  <div
    class="flex h-full flex-col overflow-auto"
    bind:this={container}
    onscroll={() => (scrolled = !!container?.scrollTop && container?.scrollTop > 0)}
  >
    {#each data.favouriteTracks as track, index (track.id)}
      <div
        class={['w-full flex-none', index === data.favouriteTracks.length - 1 && 'pb-2']}
        animate:flip={{ duration: 250 }}
      >
        <TrackRow
          handleClick={() => {
            audioPlayer.playTrack(data.favouriteTracks, index, true, {
              title: 'Favourites',
              id: 'favourites'
            });
          }}
          {track}
          user={data.user}
          delay={250 + index * 30}
        />
      </div>
    {:else}
      <div in:fade|global={{ duration: 250 }} class="px-4 text-center text-xl">
        You haven't added any favourites yet. Use the heart icon on any track to add it here.
      </div>
    {/each}
  </div>
</div>
