<script lang="ts">
  import RoundEdit from '~icons/ic/round-edit';
  import HeartFill from '~icons/iconamoon/heart-fill';
  import Heart from '~icons/iconamoon/heart';
  import AlbumIcon from '~icons/iconamoon/music-album';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicInOut, quintOut } from 'svelte/easing';
  import type { Prisma } from '../../../../../generated/prisma-client/client';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import PlaylistModal from './PlaylistModal.svelte';
  import EditModal from './EditModal.svelte';
  import type { PageData } from './$types';
  import { ROLE } from '$lib/shared/consts';
  import { getExpressiveScheme, schemeToCSS } from '$lib/materialColors';

  type TrackType = Prisma.TrackGetPayload<{ select: { title: true; id: true } }>;

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let animate: boolean = $state(false);
  let editModalOpen: boolean = $state(false);
  let playlistModalOpen: boolean = $state(false);
  let playlistModalTrack: TrackType | undefined = $state();
  const discInfo = $derived.by(() => {
    let multipleDiscs = false;
    const discChangeIndexes: number[] = [];
    let lastDiscNumber: number | null = null;

    data.album.tracks.forEach((track, index) => {
      const discNumber = parseInt(track.discNumber || '1', 10);
      if (lastDiscNumber === null) {
        lastDiscNumber = discNumber;
      } else if (discNumber !== lastDiscNumber) {
        multipleDiscs = true;
        discChangeIndexes.push(index);
        lastDiscNumber = discNumber;
      }
    });

    return {
      multipleDiscs,
      discChangeIndexes
    };
  });

  let container: HTMLDivElement | null = $state(null);
  let scrolled = $state(false);
  let schemeStyle = $state('');

  function openPlaylistModal(track: TrackType) {
    playlistModalTrack = track;
    playlistModalOpen = true;
  }

  $effect(() => {
    if (data.album.id) {
      getExpressiveScheme(data.album.id, data.album.albumArtId).then((scheme) => {
        schemeStyle = schemeToCSS(scheme);
      });
    }
  });

  onMount(() => {
    animate = true;
  });
</script>

{#key data.album.id}
  <div
    class="bg-surface text-on-surface absolute top-0 left-0 flex h-full w-full flex-col overflow-hidden transition-colors duration-300"
    style={schemeStyle}
  >
    {#if animate}
      <div
        in:fade|global={{ duration: 500, easing: cubicInOut, delay: 100 }}
        class="absolute top-0 left-0 h-full w-full opacity-20"
      >
        <AlbumImage key={data.album.updatedAt.toISOString()} blur album={data.album} maxSize="s" />
      </div>
    {/if}
    <div class="to-surface flex h-full flex-col bg-radial from-transparent from-60%">
      <div
        class="flex items-center justify-center gap-6 p-4 transition-shadow md:justify-start"
        class:shadow-md={scrolled}
        in:fade|global={{ duration: 500, easing: cubicInOut }}
      >
        <div class="group h-32 w-32 flex-none overflow-clip rounded-md">
          <AlbumImage key={data.album.updatedAt.toISOString()} album={data.album} />
          {#if data.user?.role !== ROLE.USER}
            <div
              class="bg-surface-dim/80 absolute bottom-0 left-0 flex gap-2 rounded-tr-md rounded-bl-md backdrop-blur-xs transition-all group-hover:opacity-100 focus-within:opacity-100 sm:opacity-0"
            >
              <button
                use:vibrate
                onclick={() => (editModalOpen = true)}
                aria-label="Edit album art"
              >
                <RoundEdit
                  class="text-primary/70 hover:text-primary p-1 text-3xl transition-colors"
                />
              </button>
            </div>
          {/if}
        </div>
        <div class="flex flex-col">
          <div>
            {data.album.title}
          </div>
          <a class="hover:underline" href="/artist/{data.album.albumArtistId}">
            {data.album.albumArtist.name}
          </a>
          <div>
            {data.album.releaseDate || ''}
          </div>
        </div>
      </div>

      <div
        class="flex h-full flex-col overflow-auto"
        bind:this={container}
        onscroll={() => (scrolled = !!container?.scrollTop && container?.scrollTop > 0)}
      >
        {#each data.album.tracks as track, index (track.id)}
          {#if track.discNumber !== null && discInfo.multipleDiscs && (index === 0 || discInfo.discChangeIndexes.includes(index))}
            <div
              in:fly|global={{ delay: 250 + index * 30, duration: 500, easing: quintOut, x: -20 }}
              class={['px-4 font-semibold', index !== 0 && 'mt-4']}
            >
              <AlbumIcon class="inline-block align-text-bottom font-normal" />
              Disc {track.discNumber}
            </div>
          {/if}
          <div class={['w-full flex-none', index === data.album.tracks.length - 1 && 'pb-2']}>
            <TrackRow
              showAlbumName={false}
              track={{ ...track, album: data.album }}
              delay={250 + index * 30}
            >
              {#snippet button()}
                <button
                  use:vibrate
                  onclick={() => openPlaylistModal(track)}
                  class="hover:text-primary flex h-full w-full items-center justify-center"
                >
                  {#if track.playlists.length > 0}
                    <HeartFill class="text-2xl transition-colors" />
                  {:else}
                    <Heart class="text-2xl transition-colors" />
                  {/if}
                </button>
              {/snippet}
            </TrackRow>
          </div>
        {/each}
      </div>
    </div>
    <PlaylistModal
      onclose={() => (playlistModalOpen = false)}
      open={playlistModalOpen}
      user={data.user}
      track={playlistModalTrack}
    />

    {#if editModalOpen}
      <EditModal onclose={() => (editModalOpen = false)} album={data.album} />
    {/if}
  </div>
{/key}
