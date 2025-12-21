<script lang="ts">
  import RoundPlayCircleOutline from '~icons/ic/round-play-circle-outline';
  import RoundPauseCircleOutline from '~icons/ic/round-pause-circle-outline';
  import RoundSkipPrevious from '~icons/ic/round-skip-previous';
  import RoundSkipNext from '~icons/ic/round-skip-next';
  import RoundVolumeUp from '~icons/ic/round-volume-up';
  import RoundVolumeDown from '~icons/ic/round-volume-down';
  import RoundVolumeMute from '~icons/ic/round-volume-mute';
  import RoundVolumeOff from '~icons/ic/round-volume-off';
  import RoundRepeat from '~icons/ic/round-repeat';
  import RoundStop from '~icons/ic/round-stop';
  import type { SignedInUser } from '$lib/shared/types';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import AlbumImage from './AlbumImage.svelte';
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import { beforeNavigate, invalidate } from '$app/navigation';
  import type { SvelteMediaTimeRange } from 'svelte/elements';
  import { navigating, page } from '$app/state';

  interface Props {
    user?: SignedInUser | null;
  }

  let { user = null }: Props = $props();

  const audioPlayer = getAudioPlayer();

  let player: HTMLAudioElement | null = $state(null);
  let canvas: HTMLCanvasElement | null = $state(null);
  let audioContext: AudioContext | null = $state(null);
  let source: MediaElementAudioSourceNode | null = $state(null);
  let analyser: AnalyserNode | null = $state(null);
  let currentTime: number | undefined = $state(0);
  let prevSeekTime = $state(0);
  let duration: number | undefined = $state();
  let volume: number = $state(0);
  let prevVolume = $state(0);
  let durationString = $state('--:--');
  let currentString = $state('--:--');
  let repeat = $state(false);
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
      const connection = navigator.connection as any;
      return (
        (connection?.effectiveType !== '4g' && connection?.effectiveType !== '5g') || // not sure if it can be 5g yet
        connection?.downlink < 1.5
      );
    }

    return false;
  }

  function onEnded() {
    if (repeat) {
      if (player) {
        player.currentTime = 0;
        prevSeekTime = 0;
        player.play();
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

    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  });

  const cleanupAfterStop = () => {
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    if (source) {
      source.disconnect();
      source = null;
    }
    if (analyser) {
      analyser.disconnect();
      analyser = null;
    }
    currentTime = 0;
    duration = undefined;
    player = null;
    previousTrackId = '';
    prevSeekTime = 0;
    listenedDuration = 0;
    seeking = false;
    previousTime = 0;
    bufferedRanges = [];
    repeat = false;
    // cleaning up the canvas
    if (canvas) {
      const ctx = canvas.getContext('2d');

      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  $effect(() => {
    if (!player || !canvas) return;

    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      source = audioContext.createMediaElementSource(player);
      analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    const getCanvasSize = (canvasWidth: number) => {
      if (canvasWidth > 1250) {
        return 1;
      } else if (canvasWidth > 500) {
        return 2;
      } else {
        return 4;
      }
    };

    if (!analyser) return;

    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight || 100;
    const ctx = canvas.getContext('2d')!;

    // Draw loop
    let animationId: number;

    function draw() {
      if (!analyser || !canvas || !ctx) {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }

        return;
      }
      animationId = requestAnimationFrame(draw);

      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight || 100;

      const canvasSize = getCanvasSize(canvas.width);

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let x = 0;
      const barWidth = (canvas.width / bufferLength) * canvasSize * 1.8;
      for (let i = 0; i < (bufferLength / 2) * canvasSize; i++) {
        const value = dataArray[i * canvasSize];

        if (!value) {
          x += barWidth + 2;
          continue;
        }

        const barHeight = value / 2;

        if (barHeight < 1) {
          x += barWidth + 2;
          continue;
        }

        if (x + barWidth > canvas.width) {
          break;
        }

        ctx.fillStyle =
          audioPlayer.currentTrack?.album.albumArtLightVibrant ||
          getComputedStyle(document.body).getPropertyValue('--color-primary') ||
          '#71717a';

        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 60);
        ctx.fill();

        x += barWidth + 2;
      }
    }

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
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

<div id="audio-player" class="flex h-full w-full gap-1">
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
            // Only send in a second if we are on the profile page
            ((listenedDuration > 1 &&
              page.url.pathname === '/profile' &&
              !isSlowConnection() &&
              navigating.to === null) ||
              listenedDuration > 8) &&
            navigating.to === null &&
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
  <div class="h-full w-full rounded-xl bg-zinc-900/95 p-2">
    {#if user}
      <canvas
        bind:this={canvas}
        class="pointer-events-none absolute bottom-0 left-0 h-full w-full rounded-xl p-2 opacity-15 motion-reduce:hidden"
      >
      </canvas>
      <div class="flex h-full w-full flex-col justify-around px-2">
        <div class="flex w-full gap-2 sm:hidden">
          <div class="h-10 w-10 flex-none overflow-clip rounded-md">
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
                class="flex h-10 w-[calc(100%-var(--spacing)*10)] flex-col overflow-clip"
              >
                <a
                  class="overflow-hidden text-ellipsis whitespace-nowrap"
                  href="/album/{audioPlayer.currentTrack.album.id}"
                  title={audioPlayer.currentTrack.title}
                >
                  {audioPlayer.currentTrack.title}
                </a>
                <div class="overflow-hidden text-xs text-ellipsis whitespace-nowrap">
                  {#each audioPlayer.currentTrack.artists.sort( (a, _) => (a.name !== audioPlayer.currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
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
          <div class={['timer transition-opacity', !audioPlayer.currentTrack && 'opacity-0']}>
            {currentString}
          </div>
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
                  'vibrate' in navigator &&
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
            {#if duration}
              {#each bufferedRanges as range (range.start)}
                <div
                  class="bg-primary/50 absolute h-4"
                  style="width: {((range.end - range.start) / duration) *
                    100}%; left: {(range.start / duration) * 100}%;"
                ></div>
              {/each}
            {/if}
          </div>
          <div class={['timer transition-opacity', !audioPlayer.currentTrack && 'opacity-0']}>
            {durationString}
          </div>
        </div>
        <div class="flex items-center justify-center gap-2 sm:justify-around lg:justify-center">
          <div class="flex gap-4">
            <button
              onclick={() => {
                cleanupAfterStop();
                audioPlayer.stopAndClear();
              }}
              class="text-primary-dark active:text-primary text-2xl transition-colors"
              aria-label="Shuffle"
            >
              <RoundStop />
            </button>
            <button
              onclick={audioPlayer.playPrevious}
              class="active:text-primary text-primary-dark text-3xl transition-colors"
              aria-label="Previous"
              use:vibrate={{ mute: audioPlayer.currentTrack === null }}
            >
              <RoundSkipPrevious />
            </button>
            <button
              onclick={() => audioPlayer.togglePlay()}
              class="active:text-primary text-primary-dark text-6xl transition-colors"
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
              class="active:text-primary text-primary-dark text-3xl transition-colors"
              aria-label="Next"
              use:vibrate={{ mute: audioPlayer.currentTrack === null }}
            >
              <RoundSkipNext />
            </button>
            <button
              onclick={() => (repeat = !repeat)}
              class={[
                'text-2xl transition-colors',
                repeat && 'text-primary',
                !repeat && 'text-primary-dark'
              ]}
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
                <RoundVolumeOff class="text-primary text-3xl" />
              {:else if volume < 0.3}
                <RoundVolumeMute class="text-primary text-3xl" />
              {:else if volume < 0.7}
                <RoundVolumeDown class="text-primary text-3xl" />
              {:else}
                <RoundVolumeUp class="text-primary text-3xl" />
              {/if}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={volume}
              class="volume-bar w-full max-w-32"
              aria-label="Volume bar"
            />
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference "../../app.css";

  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    @apply h-4 cursor-pointer overflow-hidden rounded-full bg-zinc-600/60 outline-hidden backdrop-blur-md sm:h-2;
  }

  input[type='range'].volume-bar {
    @apply h-4;
  }

  input[type='range']::-webkit-slider-runnable-track {
    @apply h-4 rounded-full bg-transparent sm:h-2;
  }

  input[type='range']::-moz-range-track {
    @apply h-4 rounded-full bg-transparent sm:h-2;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    border: none;
    outline: none;
    box-shadow: -10000px 0 0 10000px theme(--color-primary);
    @apply size-0 transition-shadow duration-500;
  }

  input[type='range']::-moz-range-thumb {
    border: none;
    outline: none;
    box-shadow: -10000px 0 0 10000px theme(--color-primary);
    @apply size-0 transition-shadow duration-500;
  }

  input[type='range']:focus {
    outline: none;
  }

  .timer {
    @apply font-mono;
  }
</style>
