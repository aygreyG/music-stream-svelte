<script lang="ts">
  import RoundEdit from '~icons/ic/round-edit';
  import HeartFill from '~icons/iconamoon/heart-fill';
  import Heart from '~icons/iconamoon/heart';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { crossfade } from '$lib/transitions/crossfade';
  const [, receive] = crossfade;
  import type { Prisma } from '../../../../../generated/prisma-client/client';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import PlaylistModal from './PlaylistModal.svelte';
  import EditModal from './EditModal.svelte';
  import type { PageData } from './$types';
  import { ROLE } from '$lib/shared/consts';
  import { getAccessibleColor, getRGBColor } from '$lib/utils';
  import { theme } from '$lib/states/theme.svelte';

  type TrackType = Prisma.TrackGetPayload<{ select: { title: true; id: true } }>;

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let animate: boolean = $state(false);
  let albumAnimating: boolean = $state(false);
  let editModalOpen: boolean = $state(false);
  let playlistModalOpen: boolean = $state(false);
  let playlistModalTrack: TrackType | undefined = $state();

  let container: HTMLDivElement | null = $state(null);
  let scrolled = $state(false);

  function openPlaylistModal(track: TrackType) {
    playlistModalTrack = track;
    playlistModalOpen = true;
  }

  onMount(() => {
    animate = true;
    if (data.album) {
      theme.currentAlbum = data.album;
    }

    return () => {
      theme.currentAlbum = null;
    };
  });
</script>

{#key data.album.id}
  <div
    class="absolute left-0 top-0 flex h-full w-full flex-col overflow-hidden"
    style={data.album.albumArtLightVibrant
      ? [
          getRGBColor(data.album.albumArtLightVibrant, 'primary'),
          getRGBColor(getAccessibleColor(data.album.albumArtLightVibrant), 'accessible')
        ].join(';')
      : ''}
  >
    {#if animate}
      <div
        in:fade|global={{ duration: 500, easing: cubicInOut, delay: 100 }}
        class="absolute left-0 top-0 h-full w-full opacity-10"
      >
        <AlbumImage key={data.album.updatedAt.toISOString()} blur album={data.album} maxSize="s" />
      </div>
    {/if}
    <div class="flex h-full flex-col">
      <div
        class="flex items-center justify-center gap-6 p-4 transition-shadow md:justify-start"
        class:shadow-md={scrolled}
        in:fade|global={{ duration: 500, easing: cubicInOut }}
      >
        <div
          class="group h-32 w-32 flex-none overflow-clip rounded-md"
          class:z-20={albumAnimating}
          in:receive|global={{ key: `album-image-${data.album.id}` }}
          onintrostart={() => (albumAnimating = true)}
          onintroend={() => (albumAnimating = false)}
        >
          <AlbumImage key={data.album.updatedAt.toISOString()} album={data.album} />
          {#if !albumAnimating && data.user?.role !== ROLE.USER}
            <div
              class="absolute bottom-0 left-0 flex gap-2 rounded-bl-md rounded-tr-md bg-zinc-900/80 backdrop-blur-sm transition-all focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0"
            >
              <button
                use:vibrate
                onclick={() => (editModalOpen = true)}
                aria-label="Edit album art"
              >
                <RoundEdit
                  class="p-1 text-3xl text-primary/70 transition-colors hover:text-primary"
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
          <div class={['w-full flex-none', index === data.album.tracks.length - 1 && 'pb-2']}>
            <TrackRow track={{ ...track, album: data.album }} delay={250 + index * 30}>
              {#snippet button()}
                <button
                  use:vibrate
                  onclick={() => openPlaylistModal(track)}
                  class="flex h-full w-full items-center justify-center text-zinc-600 hover:text-primary"
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

      <div class="absolute right-2 top-2 flex items-end">
        <div
          class="size-5 flex-none rounded-l-md outline outline-2"
          title="Vibrant"
          style="background-color: {data.album.albumArtVibrant};"
        ></div>
        <div
          class="size-5 flex-none outline outline-2"
          title="Muted"
          style="background-color: {data.album.albumArtMuted};"
        ></div>
        <div
          class="size-5 flex-none outline outline-2"
          title="Dark Vibrant"
          style="background-color: {data.album.albumArtDarkVibrant};"
        ></div>
        <div
          class="size-5 flex-none outline outline-2"
          title="Dark Muted"
          style="background-color: {data.album.albumArtDarkMuted};"
        ></div>
        <div
          class="size-5 flex-none outline outline-2"
          title="Light Vibrant"
          style="background-color: {data.album.albumArtLightVibrant};"
        ></div>
        <div
          class="size-5 flex-none rounded-r-md outline outline-2"
          title="Light Muted"
          style="background-color: {data.album.albumArtLightMuted};"
        ></div>
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
