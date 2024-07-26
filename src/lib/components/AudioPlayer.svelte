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
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import AlbumImage from './AlbumImage.svelte';
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import { beforeNavigate, invalidate } from '$app/navigation';
  import type { SvelteMediaTimeRange } from 'svelte/elements';
  import { navigating } from '$app/stores';

  interface Props {
    user?: SignedInUser | null;
  }

  let { user = null }: Props = $props();

  const audioPlayer = getAudioPlayer();

  let player: HTMLAudioElement | null = $state(null);
  let currentTime: number | undefined = $state(0);
  let prevSeekTime = $state(0);
  let duration: number | undefined = $state();
  let volume: number = $state(0);
  let prevVolume = $state(0);
  let durationString = $state('--:--');
  let currentString = $state('--:--');
  let repeat = $state(false);
  let shuffle = $state(false);
  let listenedDuration = $state(0);
  let previousTime = $state(0);
  let previousTrackId: string;
  let seeking = $state(false);
  let bufferedRanges: SvelteMediaTimeRange[] = $state([]);

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

  function onEnded() {
    if (repeat) {
      if (player) {
        player.currentTime = 0;
        prevSeekTime = 0;
        audioPlayer.paused = false;
      }
    } else {
      audioPlayer.playNext();
    }
  }

  function updateVolume(e: WheelEvent) {
    volume = Math.max(0, Math.min(1, volume + (e.deltaY < 0 ? 0.05 : -0.05)));
  }

  $effect(() => {
    if (duration) {
      durationString = new Date(duration * 1000).toISOString().slice(14, 19);
      if (currentTime === 0) {
        currentString = '00:00';
      }
    } else {
      durationString = '--:--';
    }
  });

  $effect(() => {
    if (currentTime) {
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
  });

  $effect(() => {
    if (audioPlayer.currentTrack) {
      if (navigator.mediaSession) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: audioPlayer.currentTrack.title,
          artist: audioPlayer.currentTrack.artists.map((a) => a.name).join(', '),
          album: audioPlayer.currentTrack.album.title,
          artwork: [
            {
              src: `/api/image/${audioPlayer.currentTrack.album.id}/${audioPlayer.currentTrack.album.albumArtId}/l/avif`,
              sizes: '300x300',
              type: 'image/avif'
            },
            {
              src: `/api/image/${audioPlayer.currentTrack.album.id}/${audioPlayer.currentTrack.album.albumArtId}/l/webp`,
              sizes: '300x300',
              type: 'image/webp'
            },
            {
              src: `/api/image/${audioPlayer.currentTrack.album.id}/${audioPlayer.currentTrack.album.albumArtId}/l`,
              sizes: '300x300',
              type: `image/${audioPlayer.currentTrack.album.albumArt?.split('.').pop()}`
            }
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
          audioPlayer.togglePlay();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          audioPlayer.togglePlay();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          audioPlayer.playPrevious();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          audioPlayer.playNext();
        });
      }

      if (!previousTrackId) {
        previousTrackId = audioPlayer.currentTrack.id;
      } else if (previousTrackId !== audioPlayer.currentTrack.id && listenedDuration > 0.01) {
        sendListeningData(previousTrackId, listenedDuration);
        previousTrackId = audioPlayer.currentTrack.id;
        listenedDuration = 0;
      }
    }
  });

  $effect(() => {
    if (audioPlayer.paused && listenedDuration > 0 && audioPlayer.currentTrack) {
      sendListeningData(audioPlayer.currentTrack.id, listenedDuration);
      listenedDuration = 0;
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

  $effect(() => {
    if (volume) {
      localStorage.setItem('player-volume', volume.toString());
    }
  });

  beforeNavigate((navigation) => {
    if (navigation.type === 'leave' && listenedDuration > 0.5) {
      sendListeningData(previousTrackId, listenedDuration);
      listenedDuration = 0;
      navigation.cancel();
    }
  });

  $effect(() => {
    if (audioPlayer.paused && player && audioPlayer.currentTrack) {
      player.pause();
    } else if (player && audioPlayer.currentTrack) {
      player.play();
    }
  });
</script>

<div class="flex h-full w-full gap-1">
  {#if audioPlayer.currentTrack && user}
    <audio
      preload="metadata"
      src="/api/play/{audioPlayer.currentTrack.id}"
      bind:currentTime
      bind:duration
      bind:this={player}
      bind:volume
      autoplay={true}
      onended={onEnded}
      onseeking={() => (seeking = true)}
      onseeked={() => (seeking = false)}
      ontimeupdate={(e) => {
        if (seeking) return;
        const diff = e.currentTarget.currentTime - previousTime;
        if (diff < 2 && diff > 0) {
          listenedDuration += diff;
          if (
            ((listenedDuration > 1 && !isSlowConnection()) || listenedDuration > 8) &&
            $navigating === null &&
            audioPlayer.currentTrack
          ) {
            sendListeningData(audioPlayer.currentTrack.id, listenedDuration);
            listenedDuration = 0;
          }
        }
        previousTime = e.currentTarget.currentTime;
      }}
      bind:buffered={bufferedRanges}
    ></audio>
  {/if}
  <div class="h-full w-full rounded-md bg-zinc-900/95 p-2">
    {#if user}
      <div class="flex h-full w-full flex-col justify-around px-2">
        <div class="flex w-full gap-2 sm:hidden">
          <div class="h-10 w-10 flex-none overflow-clip rounded-md bg-zinc-900">
            {#if audioPlayer.currentTrack}
              {#key audioPlayer.currentTrack.id}
                <a
                  in:fade|global={{ duration: 300, easing: quintOut, delay: 300 }}
                  out:fade|global={{ duration: 300, easing: quintOut }}
                  href="/album/{audioPlayer.currentTrack.album.id}"
                  class="flex h-10 w-10"
                >
                  <AlbumImage album={audioPlayer.currentTrack.album} maxSize="s" />
                </a>
              {/key}
            {/if}
          </div>
          {#if audioPlayer.currentTrack}
            {#key audioPlayer.currentTrack.id}
              <div
                in:fade|global={{ duration: 300, easing: quintOut, delay: 300 }}
                out:fade|global={{ duration: 300, easing: quintOut }}
                class="flex h-10 flex-col overflow-clip"
              >
                <a
                  class="overflow-hidden text-ellipsis whitespace-nowrap"
                  href="/album/{audioPlayer.currentTrack.album.id}"
                >
                  {audioPlayer.currentTrack.title}
                </a>
                <div class="overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                  {#each audioPlayer.currentTrack.artists.sort( (a, b) => (a.name !== audioPlayer.currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                    <a class="hover:underline" href="/artist/{artist.id}">
                      {artist.name}{#if audioPlayer.currentTrack.artists.length > 1 && index != audioPlayer.currentTrack.artists.length - 1},{/if}
                    </a>
                  {/each}
                  <a href="/album/{audioPlayer.currentTrack.album.id}">
                    - {audioPlayer.currentTrack.album.title}
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
              max={duration || 0}
              step="0.01"
              bind:value={currentTime}
              disabled={!duration}
              aria-label="Progress bar"
              oninput={() => {
                if (
                  navigator &&
                  matchMedia('(prefers-reduced-motion: no-preference)').matches &&
                  matchMedia('(hover: none), (pointer: coarse)').matches &&
                  currentTime &&
                  Math.abs(currentTime - prevSeekTime) > 0.5
                ) {
                  prevSeekTime = currentTime;
                  navigator.vibrate(1);
                }
              }}
            />
            {#if !(typeof navigator !== 'undefined' && !navigator.userAgent.includes('Chrome')) && duration}
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
                ></div>
              {/each}
            {/if}
          </div>
          <div class="timer">{durationString}</div>
        </div>
        <div class="flex items-center justify-center gap-2 sm:justify-around lg:justify-center">
          <div class="flex gap-4">
            <button
              onclick={() => (shuffle = !shuffle)}
              class="text-2xl opacity-15 transition-colors"
              disabled
              class:text-primary={shuffle}
              class:text-zinc-400={!shuffle}
              aria-label="Shuffle"
            >
              <RoundShuffle />
            </button>
            <button
              onclick={audioPlayer.playPrevious}
              class="text-3xl text-zinc-400 transition-colors active:text-zinc-600"
              aria-label="Previous"
              use:vibrate
            >
              <RoundSkipPrevious />
            </button>
            <button
              onclick={() => audioPlayer.togglePlay()}
              class="text-6xl text-zinc-400 transition-colors active:text-zinc-600"
              aria-label="Toggle play"
              use:vibrate={{ mute: audioPlayer.currentTrack === null }}
            >
              {#if audioPlayer.paused}
                <RoundPlayCircleOutline />
              {:else}
                <RoundPauseCircleOutline />
              {/if}
            </button>
            <button
              onclick={audioPlayer.playNext}
              class="text-3xl text-zinc-400 transition-colors active:text-zinc-600"
              aria-label="Next"
              use:vibrate
            >
              <RoundSkipNext />
            </button>
            <button
              onclick={() => (repeat = !repeat)}
              class="text-2xl transition-colors"
              class:text-primary={repeat}
              class:text-zinc-400={!repeat}
              aria-label="Repeat"
              use:vibrate
            >
              <RoundRepeat />
            </button>
          </div>
          <div class="right-0 hidden items-center gap-2 sm:flex lg:absolute" onwheel={updateVolume}>
            <button
              onclick={() => {
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
