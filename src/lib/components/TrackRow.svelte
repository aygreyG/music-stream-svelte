<script lang="ts">
  import { currentTrack, paused, playTrack } from '$lib/stores/audioPlayer';
  import type { Prisma } from '@prisma/client';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import RoundPlayCircleFilled from 'virtual:icons/ic/round-play-circle-filled';
  import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
  import AlbumImage from './AlbumImage.svelte';
  import { vibrate } from '$lib/actions/vibrate';

  type TrackRowType = Prisma.TrackGetPayload<{
    include: {
      album: { include: { albumArtist: true; tracks: { include: { artists: true } } } };
      artists: true;
    };
  }>;

  export let track: TrackRowType;
  export let index: number | null = null;
  export let delay: number = (index || 0) * 30;
  export let handleClick: () => void = () => {
    playTrack(
      track.album.tracks.map((t) => ({ ...t, album: track.album })),
      track.album.tracks.findIndex((t) => t.id === track.id)
    );
  };

  let mainWidth = 'w-[calc(100%-6rem)]';

  $: indexed = index !== null;
  $: hasButton = !!$$slots.button;
  $: {
    if (indexed && hasButton) {
      mainWidth = 'w-[calc(100%-10rem)]';
    } else if (indexed || hasButton) {
      mainWidth = 'w-[calc(100%-8rem)]';
    }
  }
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
  on:keydown={(e) => {
    if (e.key === 'Enter' && $currentTrack?.id !== track.id) handleClick();
  }}
  on:dblclick={() => {
    if ($currentTrack?.id !== track.id) handleClick();
  }}
  use:vibrate
  class="group flex h-14 w-full flex-none cursor-default select-none items-center from-transparent via-zinc-600/10 to-transparent transition-colors hover:bg-gradient-to-r"
  class:px-4={!indexed}
>
  {#if indexed}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      on:click={() => {
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
    {#if $currentTrack?.id === track.id}
      {#if $paused}
        <button
          class="z-10 flex items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600"
          on:click={() => ($paused = false)}
          use:vibrate
        >
          <RoundPlayCircleFilled class="text-center text-3xl transition-colors" />
        </button>
      {:else}
        <button
          class="z-10 flex items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600"
          on:click={() => ($paused = true)}
          use:vibrate
        >
          <RoundPauseCircleOutline class="text-center text-3xl transition-colors" />
        </button>
      {/if}
    {:else}
      <button
        class="z-10 hidden items-center justify-center text-zinc-600 hover:text-fuchsia-600 group-hover:flex"
        on:click={() => handleClick()}
        use:vibrate
      >
        <RoundPlayCircleFilled class="text-center text-3xl transition-colors" />
      </button>
      <div
        class="absolute left-0 top-0 z-0 h-12 w-12 overflow-hidden rounded-md group-hover:opacity-20"
      >
        <AlbumImage
          alt={track.album.title}
          artId={track.album.albumArtId}
          id={track.album.id}
          maxSize="s"
        />
      </div>
    {/if}
  </div>

  <div class="{mainWidth} flex-none pl-2">
    <button
      on:click={() => {
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
  </div>

  <button
    on:click={() => {
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
      <slot name="button" />
    </div>
  {/if}
</div>
