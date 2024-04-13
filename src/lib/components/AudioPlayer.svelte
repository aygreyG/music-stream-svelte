<script lang="ts">
  import RoundPlayCircleOutline from 'virtual:icons/ic/round-play-circle-outline';
  import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
  import RoundSkipPrevious from 'virtual:icons/ic/round-skip-previous';
  import RoundSkipNext from 'virtual:icons/ic/round-skip-next';
  import RoundVolumeUp from 'virtual:icons/ic/round-volume-up';
  import RoundVolumeDown from 'virtual:icons/ic/round-volume-down';
  import RoundVolumeMute from 'virtual:icons/ic/round-volume-mute';
  import RoundVolumeOff from 'virtual:icons/ic/round-volume-off';
  import RoundRepeat from 'virtual:icons/ic/round-repeat';
  import RoundShuffle from 'virtual:icons/ic/round-shuffle';
  import type { SignedInUser } from '$lib/shared/types';
  import { currentTrack, playNext, paused, playPrevious } from '$lib/stores/audioPlayer';
  import AlbumImage from './AlbumImage.svelte';
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { vibrate } from '$lib/actions/vibrate';

  export let user: SignedInUser | null = null;

  let player: HTMLAudioElement;
  let currentTime = 0;
  let prevTime = 0;
  let duration: number;
  let volume: number;
  let prevVolume = 0;
  let durationString = '--:--';
  let currentString = '--:--';
  let repeat = false;
  let shuffle = false;

  function togglePlay() {
    if (!$currentTrack) {
      return;
    }

    $paused = !$paused;
  }

  function onEnded() {
    if (repeat) {
      player.currentTime = 0;
      prevTime = 0;
      player.play();
    } else {
      playNext();
    }
  }

  function updateVolume(e: WheelEvent) {
    volume = Math.max(0, Math.min(1, volume + (e.deltaY < 0 ? 0.05 : -0.05)));
  }

  $: if (duration) {
    durationString = new Date(duration * 1000).toISOString().slice(14, 19);
    if (currentTime === 0) {
      currentString = '00:00';
    }
  } else {
    durationString = '--:--';
  }

  $: if (currentTime) {
    currentString = new Date(currentTime * 1000).toISOString().slice(14, 19);

    if (navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: player.playbackRate,
        position: currentTime
      });
    }
  } else {
    currentString = '--:--';
  }

  $: if (volume && browser) {
    localStorage.setItem('player-volume', volume.toString());
  }

  currentTrack.subscribe((val) => {
    if (val) {
      if (navigator.mediaSession) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: val.title,
          artist: val.artists.map((a) => a.name).join(', '),
          album: val.album.title,
          artwork: [
            {
              src: `/api/image/${val.album.id}/l/avif`,
              sizes: '300x300',
              type: 'image/avif'
            },
            {
              src: `/api/image/${val.album.id}/l/webp`,
              sizes: '300x300',
              type: 'image/webp'
            },
            {
              src: `/api/image/${val.album.id}/l`,
              sizes: '300x300',
              type: `image/${val.album.albumArt?.split('.').pop()}`
            }
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
          togglePlay();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          togglePlay();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          playPrevious();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          playNext();
        });
      }
    }
  });

  onMount(() => {
    const vol = localStorage.getItem('player-volume');

    if (vol) {
      volume = parseFloat(vol);
    } else {
      volume = 0.3;
    }
  });
</script>

<div class="flex h-full w-full gap-1">
  {#if $currentTrack && user}
    <audio
      preload="metadata"
      src="/api/play/{$currentTrack.id}"
      bind:currentTime
      bind:duration
      bind:paused={$paused}
      bind:this={player}
      bind:volume
      autoplay={true}
      on:ended={onEnded}
    />
  {/if}
  <div class="h-full w-full rounded-md bg-zinc-900/95 p-2">
    {#if user}
      <div class="flex h-full w-full flex-col justify-around px-2">
        <div class="flex w-full gap-2 sm:hidden">
          <div class="h-10 w-10 flex-none overflow-clip rounded-md bg-zinc-900">
            {#if $currentTrack}
              {#key $currentTrack.id}
                <a
                  in:fade|global={{ duration: 300, easing: quintOut, delay: 300 }}
                  out:fade|global={{ duration: 300, easing: quintOut }}
                  href="/album/{$currentTrack.album.id}"
                  class="flex h-10 w-10"
                >
                  <AlbumImage
                    alt={$currentTrack.album.title}
                    id={$currentTrack.album.id}
                    maxSize="s"
                  />
                </a>
              {/key}
            {/if}
          </div>
          {#if $currentTrack}
            {#key $currentTrack.id}
              <div
                in:fade|global={{ duration: 300, easing: quintOut, delay: 300 }}
                out:fade|global={{ duration: 300, easing: quintOut }}
                class="flex h-10 flex-col overflow-clip"
              >
                <a
                  class="overflow-hidden text-ellipsis whitespace-nowrap"
                  href="/album/{$currentTrack.album.id}"
                >
                  {$currentTrack.title}
                </a>
                <div class="overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                  {#each $currentTrack.artists.sort( (a, b) => (a.name !== $currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                    <a class="hover:underline" href="/artist/{artist.id}">
                      {artist.name}{#if $currentTrack.artists.length > 1 && index != $currentTrack.artists.length - 1},{/if}
                    </a>
                  {/each}
                  <a href="/album/{$currentTrack.album.id}">
                    - {$currentTrack.album.title}
                  </a>
                </div>
              </div>
            {/key}
          {/if}
        </div>
        <div class="flex items-center justify-between gap-2 whitespace-nowrap sm:order-2">
          <div class="timer">{currentString}</div>
          <input
            class="w-full"
            type="range"
            min="0"
            max={duration}
            step="0.01"
            bind:value={currentTime}
            disabled={!duration}
            aria-label="Progress bar"
            on:input={() => {
              if (
                navigator &&
                matchMedia('(prefers-reduced-motion: no-preference)').matches &&
                matchMedia('(hover: none), (pointer: coarse)').matches &&
                Math.abs(currentTime - prevTime) > 0.5
              ) {
                prevTime = currentTime;
                navigator.vibrate(1);
              }
            }}
          />
          <div class="timer">{durationString}</div>
        </div>
        <div class="flex items-center justify-center gap-2 sm:justify-around lg:justify-center">
          <div class="flex gap-4">
            <button
              on:click={() => (shuffle = !shuffle)}
              class="text-2xl opacity-15 transition-colors"
              disabled
              class:text-fuchsia-600={shuffle}
              class:text-zinc-400={!shuffle}
              aria-label="Shuffle"
            >
              <RoundShuffle />
            </button>
            <button
              on:click={playPrevious}
              class="text-3xl text-zinc-400 transition-colors active:text-zinc-600"
              aria-label="Previous"
              use:vibrate
            >
              <RoundSkipPrevious />
            </button>
            <button
              on:click={togglePlay}
              class="text-6xl text-zinc-400 transition-colors active:text-zinc-600"
              aria-label="Toggle play"
              use:vibrate={{ mute: $currentTrack === null }}
            >
              {#if $paused}
                <RoundPlayCircleOutline />
              {:else}
                <RoundPauseCircleOutline />
              {/if}
            </button>
            <button
              on:click={playNext}
              class="text-3xl text-zinc-400 transition-colors active:text-zinc-600"
              aria-label="Next"
              use:vibrate
            >
              <RoundSkipNext />
            </button>
            <button
              on:click={() => (repeat = !repeat)}
              class="text-2xl transition-colors"
              class:text-fuchsia-600={repeat}
              class:text-zinc-400={!repeat}
              aria-label="Repeat"
              use:vibrate
            >
              <RoundRepeat />
            </button>
          </div>
          <div
            class="right-0 hidden items-center gap-2 sm:flex lg:absolute"
            on:wheel={updateVolume}
          >
            <button
              on:click={() => {
                if (volume === 0) {
                  volume = prevVolume;
                } else {
                  prevVolume = volume;
                  volume = 0;
                }
              }}
              aria-label="Mute"
              use:vibrate
            >
              {#if volume === 0}
                <RoundVolumeOff class="text-3xl text-zinc-400" />
              {:else if volume < 0.3}
                <RoundVolumeMute class="text-3xl text-zinc-400" />
              {:else if volume < 0.7}
                <RoundVolumeDown class="text-3xl text-zinc-400" />
              {:else}
                <RoundVolumeUp class="text-3xl text-zinc-400" />
              {/if}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={volume}
              class="w-full"
              aria-label="Volume bar"
            />
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    @apply h-4 cursor-pointer overflow-hidden rounded-full bg-zinc-600 outline-none;
  }

  input[type='range']::-webkit-slider-runnable-track {
    @apply h-4 rounded-full bg-zinc-600;
  }

  input[type='range']::-moz-range-track {
    @apply h-4 rounded-full bg-zinc-600;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    border: 2px solid rgb(192 38 211);
    box-shadow: -10007px 0 0 10000px rgb(192 38 211);
    @apply h-4 w-4 rounded-full bg-zinc-300;
  }

  input[type='range']::-moz-range-thumb {
    border: 2px solid rgb(192 38 211);
    box-shadow: -10007px 0 0 10000px rgb(192 38 211);
    @apply h-3 w-3 rounded-full bg-zinc-300;
  }

  input[type='range']:focus {
    outline: none;
  }

  .timer {
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
</style>
