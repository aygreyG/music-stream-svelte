<script lang="ts">
  import { onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import type { SvelteMediaTimeRange } from 'svelte/elements';
  import { fade, slide } from 'svelte/transition';

  import { beforeNavigate, goto, invalidate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { navigating, page } from '$app/state';
  import { vibrate } from '$lib/actions/vibrate';
  import type { SignedInUser } from '$lib/shared/types';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  import RoundKeyboardArrowUp from '~icons/ic/round-keyboard-arrow-up';
  import RoundPlaylistPlay from '~icons/ic/round-playlist-play';
  import RoundVolumeDown from '~icons/ic/round-volume-down';
  import RoundVolumeMute from '~icons/ic/round-volume-mute';
  import RoundVolumeOff from '~icons/ic/round-volume-off';
  import RoundVolumeUp from '~icons/ic/round-volume-up';

  import AlbumImage from '../AlbumImage.svelte';
  import MarqueeText from '../MarqueeText.svelte';
  import Controls from './Controls.svelte';
  import FullScreenPlayer from './FullScreenPlayer.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import Visualizer from './Visualizer.svelte';

  interface Props {
    user?: SignedInUser | null;
  }

  let { user = null }: Props = $props();

  const audioPlayer = getAudioPlayer();

  let player: HTMLAudioElement | null = $state(null);
  let visualizer: ReturnType<typeof Visualizer> | null = $state(null);
  let audioContext: AudioContext | null = $state(null);
  let source: MediaElementAudioSourceNode | null = $state(null);
  let analyser: AnalyserNode | null = $state(null);
  let currentTime: number | undefined = $state(0);
  let prevSeekTime = $state(0);
  let duration: number | undefined = $state();
  let volume: number = $state(0);
  let prevVolume = $state(0);
  let durationString = $derived(
    duration ? new Date(duration * 1000).toISOString().slice(14, 19) : '--:--'
  );
  let currentString = $derived(
    currentTime ? new Date(currentTime * 1000).toISOString().slice(14, 19) : '--:--'
  );
  let repeat = $state(false);
  let listenedDuration = $state(0);
  let previousTime = $state(0);
  let previousTrackId: string;
  let seeking = $state(false);
  let bufferedRanges: SvelteMediaTimeRange[] = $state([]);
  let fullScreenOpen = $state(false);
  let trackInfoContainer: HTMLDivElement = $state(null!);
  let prevContainerWidth = 0;

  // Animating the width of the track info container when the track changes and the width is different than before
  $effect.pre(() => {
    if (!trackInfoContainer || !audioPlayer.currentTrack) return;
    void audioPlayer.currentTrack.id;
    prevContainerWidth = trackInfoContainer.offsetWidth;
  });

  $effect(() => {
    if (!trackInfoContainer || !audioPlayer.currentTrack) return;
    void audioPlayer.currentTrack.id;
    const newWidth = trackInfoContainer.offsetWidth;
    if (prevContainerWidth > 0 && prevContainerWidth !== newWidth) {
      trackInfoContainer.animate(
        [{ width: `${prevContainerWidth}px` }, { width: `${newWidth + 2}px` }],
        { duration: 150, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
  });

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
    if (currentTime && navigator.mediaSession && player) {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: player.playbackRate,
        position: currentTime
      });
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
    visualizer?.clearCanvas();
  };

  $effect(() => {
    if (!player) return;

    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      source = audioContext.createMediaElementSource(player);
      analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.connect(audioContext.destination);
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
  <div class="bg-surface h-full w-full rounded-xl p-2 transition-colors duration-500">
    {#if user}
      {#if !fullScreenOpen}
        <Visualizer
          bind:this={visualizer}
          {analyser}
          class="pointer-events-none absolute bottom-0 left-0 h-32 w-full rounded-xl p-1 opacity-15 motion-reduce:hidden sm:h-full"
        />
      {/if}
      <div class="flex h-full w-full flex-col justify-between pr-2">
        <button
          onclick={() => (fullScreenOpen = true)}
          aria-label="Open full screen player"
          class={[
            'flex h-10 w-full items-center justify-between gap-2 sm:hidden',
            !audioPlayer.currentTrack && 'cursor-default'
          ]}
          use:vibrate
        >
          {#if audioPlayer.currentTrack}
            {#key audioPlayer.currentTrack.id}
              <div class="flex min-w-0 flex-1 items-center gap-2">
                <div
                  class="size-10 flex-none overflow-clip rounded-md"
                  in:fade|global={{ duration: 500, easing: quintOut }}
                >
                  <AlbumImage album={audioPlayer.currentTrack.album} maxSize="s" />
                </div>
                <div
                  class="flex h-10 min-w-0 flex-1 flex-col text-left"
                  in:fade|global={{ duration: 500, easing: quintOut }}
                >
                  <span
                    class="overflow-hidden font-bold text-ellipsis whitespace-nowrap"
                    title={audioPlayer.currentTrack.title}
                  >
                    {audioPlayer.currentTrack.title}
                  </span>
                  <span class="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap">
                    {audioPlayer.currentTrack.artists
                      .toSorted((a) =>
                        a.name !== audioPlayer.currentTrack?.album.albumArtist.name ? 1 : -1
                      )
                      .map((a) => a.name)
                      .join(', ')}
                  </span>
                </div>
              </div>
            {/key}
            <div
              class="text-on-surface-variant active:text-primary flex-none text-2xl transition-colors"
              in:fade|global={{ duration: 500, easing: quintOut }}
            >
              <RoundKeyboardArrowUp />
            </div>
          {/if}
        </button>
        <ProgressBar
          {currentString}
          {bufferedRanges}
          {duration}
          {durationString}
          bind:currentTime
          bind:prevSeekTime
          class="pl-2"
        />
        <div class="flex items-center justify-center gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr]">
          <div class="hidden h-16 min-w-0 sm:block">
            {#if audioPlayer.currentTrack}
              <div
                bind:this={trackInfoContainer}
                class="bg-surface-container/60 group flex h-full w-fit max-w-full items-center gap-2 justify-self-start rounded-full p-1 pr-4 backdrop-blur-xs transition-colors duration-500"
                transition:slide={{ axis: 'x', duration: 300, easing: quintOut }}
              >
                {#key audioPlayer.currentTrack.id}
                  <a
                    href={resolve(`/(app)/(authed)/album/[id]`, {
                      id: audioPlayer.currentTrack.album.id
                    })}
                    class="aspect-square h-full flex-none overflow-clip rounded-full"
                    title={audioPlayer.currentTrack.album.title}
                  >
                    <AlbumImage album={audioPlayer.currentTrack.album} maxSize="s" />
                  </a>
                  <div class="flex min-w-0 flex-col">
                    {#if audioPlayer.playlistInfo}
                      <div class="flex items-center">
                        <RoundPlaylistPlay
                          class="text-on-surface-variant flex-none text-sm transition-colors duration-500"
                        />
                        <MarqueeText class="text-xs">
                          <a
                            href={resolve(`/(app)/(authed)/playlist/[id]`, {
                              id: audioPlayer.playlistInfo.id
                            })}
                            title={audioPlayer.playlistInfo.title}
                            class="text-on-surface-variant pr-1 tracking-wide transition-colors duration-500 hover:underline"
                          >
                            {audioPlayer.playlistInfo.title}
                          </a>
                        </MarqueeText>
                      </div>
                    {/if}
                    <MarqueeText>
                      <a
                        class="font-bold whitespace-nowrap hover:underline"
                        title={audioPlayer.currentTrack.title}
                        href={resolve(`/(app)/(authed)/album/[id]`, {
                          id: audioPlayer.currentTrack.album.id
                        })}
                      >
                        {audioPlayer.currentTrack.title}
                      </a>
                    </MarqueeText>
                    <MarqueeText class="text-xs font-medium">
                      {#each audioPlayer.currentTrack.artists.toSorted( (a) => (a.name !== audioPlayer.currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                        {@const shouldHaveComma =
                          audioPlayer.currentTrack.artists.length > 1 &&
                          index != audioPlayer.currentTrack.artists.length - 1}
                        <button
                          title={artist.name}
                          class={['whitespace-nowrap hover:underline', shouldHaveComma && 'mr-1']}
                          onclick={() =>
                            goto(resolve(`/(app)/(authed)/artist/[id]`, { id: artist.id }))}
                        >
                          {artist.name}{#if shouldHaveComma},{/if}
                        </button>
                      {/each}
                    </MarqueeText>
                  </div>
                {/key}
                <button
                  onclick={() => (fullScreenOpen = true)}
                  aria-label="Open full screen player"
                  class="bg-surface-container text-on-surface-variant hover:text-primary absolute top-1/2 -right-3 z-10 flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-xl opacity-0 transition-all duration-200 group-hover:opacity-100"
                  use:vibrate
                >
                  <RoundKeyboardArrowUp />
                </button>
              </div>
            {/if}
          </div>

          <Controls bind:repeat onstop={cleanupAfterStop} />

          <div
            class="hidden min-w-0 items-center gap-2 justify-self-end sm:flex"
            onwheel={updateVolume}
          >
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
                <RoundVolumeOff class="text-primary text-3xl transition-colors duration-500" />
              {:else if volume < 0.3}
                <RoundVolumeMute class="text-primary text-3xl transition-colors duration-500" />
              {:else if volume < 0.7}
                <RoundVolumeDown class="text-primary text-3xl transition-colors duration-500" />
              {:else}
                <RoundVolumeUp class="text-primary text-3xl transition-colors duration-500" />
              {/if}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={volume}
              class="styled-range volume-bar w-full md:w-24"
              aria-label="Volume bar"
            />
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if fullScreenOpen && audioPlayer.currentTrack}
  <FullScreenPlayer
    onclose={() => (fullScreenOpen = false)}
    onstop={() => {
      fullScreenOpen = false;
      cleanupAfterStop();
      audioPlayer.stopAndClear();
    }}
    bind:currentTime
    {duration}
    {currentString}
    {durationString}
    bind:repeat
    bind:volume
    {analyser}
    {bufferedRanges}
  />
{/if}

<style lang="postcss">
  @reference "../../../app.css";

  .volume-bar {
    @apply h-4!;
  }
</style>
