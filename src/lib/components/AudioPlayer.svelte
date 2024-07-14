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
  import { beforeNavigate, invalidate } from '$app/navigation';
  import type { SvelteMediaTimeRange } from 'svelte/elements';
  import { navigating } from '$app/stores';

  export let user: SignedInUser | null = null;

  let player: HTMLAudioElement;
  let currentTime = 0;
  let prevSeekTime = 0;
  let duration: number;
  let volume: number;
  let prevVolume = 0;
  let durationString = '--:--';
  let currentString = '--:--';
  let repeat = false;
  let shuffle = false;
  let listenedDuration = 0;
  let previousTime = 0;
  let previousTrackId: string;
  let seeking = false;
  let bufferedRanges: SvelteMediaTimeRange[] = [];

  async function sendListeningData(trackId: string, duration: number) {
    if (duration < 0.01) return;
    const resp = await fetch(`/api/listened/${trackId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration: duration.toPrecision(3)
      })
    });

    if (!resp.ok) {
      console.error('Error sending listening data for: ', trackId, ', duration: ', duration);
    } else {
      invalidate('listened');
    }
  }

  function isSlowConnection() {
    if ('connection' in navigator) {
      return (
        (navigator.connection?.effectiveType !== '4g' &&
          navigator.connection?.effectiveType !== '5g') || // not sure if it can be 5g yet
        navigator.connection?.downlink < 1.5
      );
    }

    return false;
  }

  function togglePlay() {
    if (!$currentTrack) {
      return;
    }

    $paused = !$paused;
  }

  function onEnded() {
    if (repeat) {
      if (player) {
        player.currentTime = 0;
        prevSeekTime = 0;
        player.play();
      }
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

    if (navigator.mediaSession && player) {
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

  onMount(() => {
    const currentTrackSub = currentTrack.subscribe((val) => {
      if (val) {
        if (navigator.mediaSession) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: val.title,
            artist: val.artists.map((a) => a.name).join(', '),
            album: val.album.title,
            artwork: [
              {
                src: `/api/image/${val.album.id}/${val.album.albumArtId}/l/avif`,
                sizes: '300x300',
                type: 'image/avif'
              },
              {
                src: `/api/image/${val.album.id}/${val.album.albumArtId}/l/webp`,
                sizes: '300x300',
                type: 'image/webp'
              },
              {
                src: `/api/image/${val.album.id}/${val.album.albumArtId}/l`,
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

        if (!previousTrackId) {
          previousTrackId = val.id;
        } else if (previousTrackId !== val.id && listenedDuration > 0.01) {
          sendListeningData(previousTrackId, listenedDuration);
          previousTrackId = val.id;
          listenedDuration = 0;
        }
      }
    });

    const pausedSub = paused.subscribe((val) => {
      if (val && listenedDuration > 0 && $currentTrack) {
        sendListeningData($currentTrack.id, listenedDuration);
        listenedDuration = 0;
      }
    });

    const vol = localStorage.getItem('player-volume');

    if (vol) {
      volume = parseFloat(vol);
    } else {
      volume = 0.3;
    }

    return () => {
      currentTrackSub();
      pausedSub();
    };
  });

  beforeNavigate((navigation) => {
    if (navigation.type === 'leave' && listenedDuration > 0.5) {
      sendListeningData(previousTrackId, listenedDuration);
      listenedDuration = 0;
      navigation.cancel();
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
      on:seeking={() => (seeking = true)}
      on:seeked={() => (seeking = false)}
      on:timeupdate={(e) => {
        if (seeking) return;
        const diff = e.currentTarget.currentTime - previousTime;
        if (diff < 2 && diff > 0) {
          listenedDuration += diff;
          if (
            ((listenedDuration > 1 && !isSlowConnection()) || listenedDuration > 8) &&
            $navigating === null
          ) {
            sendListeningData($currentTrack.id, listenedDuration);
            listenedDuration = 0;
          }
        }
        previousTime = e.currentTarget.currentTime;
      }}
      bind:buffered={bufferedRanges}
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
                  <AlbumImage album={$currentTrack.album} maxSize="s" />
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
          <div class="flex w-full items-center justify-between overflow-clip rounded-full">
            <input
              class="z-10 w-full opacity-85"
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
                  Math.abs(currentTime - prevSeekTime) > 0.5
                ) {
                  prevSeekTime = currentTime;
                  navigator.vibrate(1);
                }
              }}
            />
            {#if !(typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox'))}
              {#each bufferedRanges as range, index (range.start)}
                {@const roundedStart = index > 0 && bufferedRanges[index - 1].end !== range.start}
                {@const roundedEnd =
                  index === bufferedRanges.length - 1 ||
                  bufferedRanges[index + 1].start !== range.end}
                <div
                  class="absolute h-4 bg-primary/50"
                  class:rounded-l-full={roundedStart}
                  class:rounded-r-full={roundedEnd}
                  style="width: {((range.end - range.start) / duration) *
                    100}%; left: {(range.start / duration) * 100}%;"
                />
              {/each}
            {/if}
          </div>
          <div class="timer">{durationString}</div>
        </div>
        <div class="flex items-center justify-center gap-2 sm:justify-around lg:justify-center">
          <div class="flex gap-4">
            <button
              on:click={() => (shuffle = !shuffle)}
              class="text-2xl opacity-15 transition-colors"
              disabled
              class:text-primary={shuffle}
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
              class:text-primary={repeat}
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
              class="w-full max-w-32"
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
    @apply h-4 cursor-pointer overflow-hidden rounded-full bg-zinc-600/60 outline-none backdrop-blur-md;
  }

  input[type='range']::-webkit-slider-runnable-track {
    @apply h-4 rounded-full bg-transparent;
  }

  input[type='range']::-moz-range-track {
    @apply h-4 rounded-full bg-transparent;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    border: 2px solid rgb(var(--color-primary));
    box-shadow: -10007px 0 0 10000px rgb(var(--color-primary));
    @apply h-4 w-4 rounded-full bg-zinc-300;
  }

  input[type='range']::-moz-range-thumb {
    border: 2.5px solid rgb(var(--color-primary));
    box-shadow: -10007px 0 0 10000px rgb(var(--color-primary));
    @apply h-[14px] w-[14px] rounded-full bg-zinc-300;
  }

  input[type='range']:focus {
    outline: none;
  }

  .timer {
    @apply font-mono;
  }
</style>
