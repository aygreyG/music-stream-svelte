<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import RoundPlayCircleFilled from '~icons/ic/round-play-circle-filled';
  import RoundPauseCircleOutline from '~icons/ic/round-pause-circle-outline';
  import AlbumImage from './AlbumImage.svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import { getCSSVariables, getReadableTime } from '$lib/utils';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import type { Snippet } from 'svelte';
  import type { Prisma } from '../../generated/prisma-client/client';

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
          albumArtDarkMuted: true;
          albumArtVibrant: true;
          albumArtMuted: true;
          albumArtLightVibrant: true;
          albumArtLightMuted: true;
          albumArtDarkVibrant: true;
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
    showAlbumName?: boolean;
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
    button,
    showAlbumName = true
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
  class="group flex h-14 w-full flex-none cursor-default items-center from-transparent via-zinc-600/10 to-transparent transition-colors select-none hover:bg-linear-to-r"
  class:px-4={!indexed}
  style={getCSSVariables(track.album.albumArtLightVibrant)}
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
          class="text-primary/70 hover:text-primary z-10 flex items-center justify-center"
          onclick={() => player.togglePlay()}
          use:vibrate
        >
          <RoundPlayCircleFilled class="text-center text-3xl transition-colors" />
        </button>
      {:else}
        <button
          class="text-primary/70 hover:text-primary z-10 flex items-center justify-center"
          onclick={() => player.togglePlay()}
          use:vibrate
        >
          <RoundPauseCircleOutline class="text-center text-3xl transition-colors" />
        </button>
      {/if}
    {:else}
      <button
        class="text-primary/50 hover:text-primary z-10 flex items-center justify-center opacity-0 group-hover:opacity-100"
        onclick={() => handleClick()}
        use:vibrate
      >
        <RoundPlayCircleFilled class="overflow-clip text-center text-3xl transition-colors" />
      </button>
      <div
        class="pointer-events-none absolute top-0 left-0 z-0 h-12 w-12 overflow-hidden rounded-md group-hover:opacity-0"
      >
        <AlbumImage album={track.album} maxSize="s" />
      </div>
      <div
        class="pointer-events-none absolute top-0 left-0 z-0 h-12 w-12 overflow-hidden rounded-md opacity-0 group-hover:opacity-20"
      >
        <AlbumImage album={track.album} blur maxSize="s" />
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
      class="w-full cursor-default overflow-hidden text-start text-ellipsis whitespace-nowrap"
      use:vibrate
    >
      {track.title}
    </button>
    <div class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-white/70">
      {#each track.artists.toSorted( (a, _) => (a.name !== track.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
        {@const shouldHaveComma = track.artists.length > 1 && index != track.artists.length - 1}
        <a class={['hover:underline', shouldHaveComma && 'mr-1']} href="/artist/{artist.id}">
          {artist.name}{#if shouldHaveComma},{/if}
        </a>
      {/each}
      {#if showAlbumName}
        -
        <a href="/album/{track.album.id}" class="hover:underline">
          {track.album.title}
        </a>
      {/if}
    </div>
    {#if listenedInformation.lastListened}
      <!-- TODO: Make sure it is always readable and does not wrap
           Issue: https://github.com/aygreyG/music-stream-svelte/issues/124
      -->
      <div class="flex w-full justify-between text-xs whitespace-nowrap text-white/70">
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
