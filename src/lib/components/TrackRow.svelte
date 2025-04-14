<script lang="ts">
  import type { Prisma } from 'prisma-client';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import RoundPlayCircleFilled from '~icons/ic/round-play-circle-filled';
  import RoundPauseCircleOutline from '~icons/ic/round-pause-circle-outline';
  import AlbumImage from './AlbumImage.svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import { getReadableTime } from '$lib/utils';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import type { Snippet } from 'svelte';

  type TrackRowType = Prisma.TrackGetPayload<{
    select: {
      id: true;
      title: true;
      length: true;
      trackNumber: true;
      artists: { select: { name: true; id: true } };
      album: {
        select: {
          id: true;
          title: true;
          albumArtist: { select: { name: true; id: true } };
          albumArtId: true;
          albumArtAccent: true;
          albumArt: true;
          tracks: {
            select: { id: true; title: true; artists: { select: { name: true; id: true } } };
          };
        };
      };
    };
  }>;

  type ListenedType = { listened: number; lastListened: Date | null };

  interface Props {
    track: TrackRowType;
    index?: number | null;
    delay?: number;
    listenedInformation?: ListenedType;
    handleClick?: () => void;
    button?: Snippet;
  }

  const player = getAudioPlayer();

  let {
    track,
    index = null,
    delay = (index || 0) * 30,
    listenedInformation = { listened: 0, lastListened: null },
    handleClick = () => {
      player.playTrack(
        track.album.tracks.map((t) => ({ ...t, album: track.album })),
        track.album.tracks.findIndex((t) => t.id === track.id)
      );
    },
    button
  }: Props = $props();

  let indexed = $derived(index !== null);
  let hasButton = $derived(!!button);
  let mainWidth = $derived.by(() => {
    if (indexed && hasButton) {
      return 'w-[calc(100%-10rem)]';
    }

    if (indexed || hasButton) {
      return 'w-[calc(100%-8rem)]';
    }

    return 'w-[calc(100%-6rem)]';
  });
</script>

<div
  in:fly|global={{
    duration: 500,
    x: -20,
    easing: quintOut,
    delay
  }}
  tabindex="0"
  role="button"
  onkeydown={(e) => {
    if (e.key === 'Enter' && player.currentTrack?.id !== track.id) handleClick();
  }}
  ondblclick={() => {
    if (player.currentTrack?.id !== track.id) handleClick();
  }}
  use:vibrate
  class="group flex h-14 w-full flex-none cursor-default select-none items-center from-transparent via-zinc-600/10 to-transparent transition-colors hover:bg-gradient-to-r"
  class:px-4={!indexed}
>
  {#if indexed}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onclick={() => {
        if (matchMedia('(hover: none), (pointer: coarse)').matches) {
          handleClick();
        }
      }}
      class="flex h-full w-8 items-center justify-center"
      use:vibrate
    >
      {#if track.trackNumber !== null}
        {track.trackNumber}
      {:else if index !== null}
        {index + 1}
      {/if}
    </div>
  {/if}

  <div class="flex h-12 w-12 flex-none items-center justify-center">
    {#if player.currentTrack?.id === track.id}
      {#if player.paused}
        <button
          class="z-10 flex items-center justify-center text-primary/70 hover:text-primary"
          onclick={() => player.togglePlay()}
          use:vibrate
        >
          <RoundPlayCircleFilled class="text-center text-3xl transition-colors" />
        </button>
      {:else}
        <button
          class="z-10 flex items-center justify-center text-primary/70 hover:text-primary"
          onclick={() => player.togglePlay()}
          use:vibrate
        >
          <RoundPauseCircleOutline class="text-center text-3xl transition-colors" />
        </button>
      {/if}
    {:else}
      <button
        class="z-10 hidden items-center justify-center text-zinc-600 hover:text-primary group-hover:flex"
        onclick={() => handleClick()}
        use:vibrate
      >
        <RoundPlayCircleFilled class="text-center text-3xl transition-colors" />
      </button>
      <div
        class="absolute left-0 top-0 z-0 h-12 w-12 overflow-hidden rounded-md group-hover:opacity-20"
      >
        <AlbumImage album={track.album} maxSize="s" />
      </div>
    {/if}
  </div>

  <div class="{mainWidth} flex-none pl-2">
    <button
      onclick={() => {
        if (matchMedia('(hover: none), (pointer: coarse)').matches) {
          handleClick();
        }
      }}
      class="w-full cursor-default overflow-hidden text-ellipsis whitespace-nowrap text-start"
      use:vibrate
    >
      {track.title}
    </button>
    <div class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/70">
      {#each track.artists.sort( (a, b) => (a.name !== track.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
        <a class="hover:underline" href="/artist/{artist.id}">
          {artist.name}{#if track.artists.length > 1 && index != track.artists.length - 1},{/if}
        </a>
      {/each}
      -
      <a href="/album/{track.album.id}" class="hover:underline">
        {track.album.title}
      </a>
    </div>
    {#if listenedInformation.lastListened}
      <!-- TODO: Make sure it is always readable and does not wrap
           Issue: https://github.com/aygreyG/music-stream-svelte/issues/124
      -->
      <div class="flex w-full justify-between whitespace-nowrap text-xs text-white/70">
        <div>{listenedInformation.lastListened.toLocaleString()}</div>
        <div
          class="translate-x-14 overflow-hidden text-ellipsis"
          title={getReadableTime(listenedInformation.listened)}
        >
          {getReadableTime(listenedInformation.listened)}
        </div>
      </div>
    {/if}
  </div>

  <button
    onclick={() => {
      if (matchMedia('(hover: none), (pointer: coarse)').matches) {
        handleClick();
      }
    }}
    class="w-14 flex-none cursor-default pl-2 text-sm"
    use:vibrate
  >
    {new Date(track.length * 1000).toISOString().slice(14, 19)}
  </button>

  {#if hasButton}
    <div class="w-8 flex-none">
      {@render button?.()}
    </div>
  {/if}
</div>
