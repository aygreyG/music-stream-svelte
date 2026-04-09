<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { cubicOut, quintOut } from 'svelte/easing';
  import { fade, fly, slide } from 'svelte/transition';
  import Swiper from 'swiper';
  import { EffectCoverflow } from 'swiper/modules';

  import { vibrate } from '$lib/actions/vibrate';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  import RoundKeyboardArrowDown from '~icons/ic/round-keyboard-arrow-down';
  import RoundPlaylistPlay from '~icons/ic/round-playlist-play';
  import RoundQueueMusic from '~icons/ic/round-queue-music';
  import RoundVolumeDown from '~icons/ic/round-volume-down';
  import RoundVolumeMute from '~icons/ic/round-volume-mute';
  import RoundVolumeOff from '~icons/ic/round-volume-off';
  import RoundVolumeUp from '~icons/ic/round-volume-up';

  import AlbumImage from '../AlbumImage.svelte';

  import 'swiper/css';
  import 'swiper/css/effect-coverflow';

  import { beforeNavigate, goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { handleVibrate } from '$lib/utils';

  import MarqueeText from '../MarqueeText.svelte';
  import Controls from './Controls.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import Visualizer from './Visualizer.svelte';

  interface Props {
    onclose: () => void;
    onstop: () => void;
    currentTime?: number;
    duration?: number;
    currentString?: string;
    durationString?: string;
    repeat?: boolean;
    volume?: number;
    analyser?: AnalyserNode | null;
    bufferedRanges?: { start: number; end: number }[];
  }

  let {
    onclose,
    onstop,
    currentTime = $bindable(0),
    duration = 0,
    currentString = '--:--',
    durationString = '--:--',
    repeat = $bindable(false),
    volume = $bindable(0.3),
    analyser = null,
    bufferedRanges = []
  }: Props = $props();

  const audioPlayer = getAudioPlayer();

  let swiperContainer: HTMLDivElement | null = $state(null);
  let swiperInstance: Swiper | null = $state(null);
  let prevSeekTime = $state(0);
  let lastPlayedIndex = $state(audioPlayer.queueContextIndex);
  let queueListEl: HTMLDivElement | null = $state(null);
  let prevVolume = $state(0.3);

  function updateVolume(e: WheelEvent) {
    volume = Math.max(0, Math.min(1, volume + (e.deltaY < 0 ? 0.05 : -0.05)));
  }

  function scrollToCurrentTrack(behavior: ScrollBehavior = 'smooth') {
    if (!queueListEl) return;
    const activeItem = queueListEl.querySelector('[data-active="true"]');
    activeItem?.scrollIntoView({ block: 'center', behavior });
  }

  onMount(() => {
    const initialIndex = audioPlayer.queueContextIndex;
    if (!swiperContainer) return;

    swiperInstance = new Swiper(swiperContainer, {
      modules: [EffectCoverflow],
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 1.4,
      spaceBetween: 8,
      coverflowEffect: {
        rotate: 15,
        stretch: 0,
        depth: 100,
        modifier: 2,
        slideShadows: false
      },
      initialSlide: initialIndex,
      speed: 400,
      on: {
        slideChangeTransitionEnd: (sw) => {
          const newIndex = sw?.activeIndex ?? 0;
          if (newIndex !== lastPlayedIndex) {
            lastPlayedIndex = newIndex;
            audioPlayer.playAtIndex(newIndex);
            handleVibrate(1);
          }
        },
        touchEnd: (sw) => {
          const newIndex = sw?.activeIndex ?? 0;
          if (newIndex !== lastPlayedIndex) {
            lastPlayedIndex = newIndex;
            audioPlayer.playAtIndex(newIndex);
            handleVibrate(1);
          }
        }
      }
    });

    if (swiperInstance.activeIndex !== initialIndex) {
      swiperInstance.slideTo(initialIndex, 0, false);
    }

    tick().then(() => scrollToCurrentTrack());

    return () => {
      if (swiperInstance) {
        swiperInstance.destroy();
      }
    };
  });

  // Sync swiper when track changes externally (e.g., from controls or media session)
  $effect(() => {
    if (!swiperInstance) return;
    const targetIndex = audioPlayer.queueContextIndex;
    if (swiperInstance.activeIndex !== targetIndex) {
      lastPlayedIndex = targetIndex;
      swiperInstance.slideTo(targetIndex, 400);
    }
    tick().then(() => scrollToCurrentTrack());
  });

  $effect(() => {
    if (audioPlayer.fullScreenQueueOpen) {
      scrollToCurrentTrack('instant');
    }
  });

  beforeNavigate((navigation) => {
    if (navigation.type === 'popstate') {
      navigation.cancel();
      onclose();
    }
  });
</script>

<div
  class="bg-surface fixed inset-0 z-100 flex flex-col"
  in:fly={{ y: 100, duration: 300, easing: cubicOut }}
  out:fly={{ y: 100, duration: 300, easing: cubicOut }}
>
  <div class="z-10 flex items-center justify-between p-4 pb-0">
    <div class="flex items-center max-sm:max-w-1/3">
      <button
        onclick={() => (audioPlayer.fullScreenQueueOpen = !audioPlayer.fullScreenQueueOpen)}
        class="text-on-surface-variant active:text-primary hidden p-2 text-xl transition-colors sm:flex"
        aria-label="Toggle queue"
        use:vibrate
      >
        <RoundQueueMusic />
      </button>
      {#if audioPlayer.playlistInfo}
        <button
          onclick={() => {
            goto(resolve(`/(app)/(authed)/playlist/[id]`, { id: audioPlayer.playlistInfo!.id }));
            onclose();
          }}
          class="text-on-surface-variant line-clamp-1 text-sm tracking-wide sm:hidden"
          use:vibrate
          title={audioPlayer.playlistInfo.title}
        >
          <RoundPlaylistPlay class="inline align-top text-lg" />
          {audioPlayer.playlistInfo.title}
        </button>
      {/if}
    </div>
    <div
      class="text-on-surface absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-wide"
    >
      Now Playing
    </div>
    <button
      onclick={onclose}
      class="text-on-surface-variant active:text-primary rounded-full p-2 text-3xl transition-colors"
      aria-label="Close full screen player"
      use:vibrate
    >
      <RoundKeyboardArrowDown />
    </button>
  </div>

  <div class="flex min-h-0 flex-1">
    {#if audioPlayer.fullScreenQueueOpen}
      <div
        class="bg-surface z-10 hidden min-h-0 w-1/3 max-w-sm flex-none rounded-tr-xl sm:flex"
        transition:slide={{ axis: 'x', duration: 300, easing: quintOut }}
      >
        <div class="flex h-full w-full flex-col pb-4 pl-4">
          <div
            bind:this={queueListEl}
            class="bg-surface-container/60 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto rounded-xl p-2"
          >
            {#if audioPlayer.playlistInfo}
              <button
                onclick={() => {
                  goto(
                    resolve(`/(app)/(authed)/playlist/[id]`, { id: audioPlayer.playlistInfo!.id })
                  );
                  onclose();
                }}
                class="text-on-surface-variant line-clamp-1 flex-none text-sm tracking-wide"
                use:vibrate
                title={audioPlayer.playlistInfo.title}
              >
                <RoundPlaylistPlay class="inline align-top text-lg" />
                {audioPlayer.playlistInfo.title}
              </button>
            {/if}
            {#each audioPlayer.queueContext as track, index (track.id)}
              {@const isActive = index === audioPlayer.queueContextIndex}
              <button
                data-active={isActive}
                onclick={() => audioPlayer.playAtIndex(index)}
                title={track.title}
                class={[
                  'flex items-center gap-2 rounded-xl p-2 text-left transition-colors duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                ]}
                use:vibrate
              >
                <div class="size-10 flex-none overflow-clip rounded-lg">
                  <AlbumImage album={track.album} maxSize="s" />
                </div>
                <div
                  class={[
                    'flex min-w-0 flex-1 flex-col',
                    isActive ? 'text-primary' : 'text-on-surface'
                  ]}
                >
                  <span class="truncate text-sm font-bold">
                    {track.title}
                  </span>
                  <span class="truncate text-xs font-medium">
                    {track.artists
                      .toSorted((a) => (a.name !== track.album.albumArtist.name ? 1 : -1))
                      .map((a) => a.name)
                      .join(', ')}
                  </span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <div class="flex min-w-0 flex-1 flex-col">
      <Visualizer
        {analyser}
        class="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full opacity-15 motion-reduce:hidden"
      />

      <div class="flex flex-1 flex-col items-center justify-center px-4">
        <div bind:this={swiperContainer} class="swiper fullscreen-swiper w-full max-w-lg">
          <div class="swiper-wrapper items-center">
            {#each audioPlayer.queueContext as track, index (track.id)}
              <div class="swiper-slide">
                <!-- Glow effect behind album art -->
                {#if index === audioPlayer.queueContextIndex}
                  <div
                    in:fade|global={{ duration: 300, easing: quintOut, delay: 200 }}
                    out:fade|global={{ duration: 200, easing: quintOut }}
                    class="bg-primary absolute inset-0 m-auto aspect-square w-full max-w-70 scale-100 rounded-3xl opacity-40 blur-2xl sm:max-w-80"
                  ></div>
                {/if}
                <div
                  class={[
                    'album-slide mx-auto aspect-square w-full max-w-70 overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 sm:max-w-80',
                    index !== audioPlayer.queueContextIndex && 'scale-90 opacity-40'
                  ]}
                >
                  <AlbumImage album={track.album} />
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="mt-8 h-24 w-full max-w-sm px-4">
          {#if audioPlayer.currentTrack}
            {#key audioPlayer.currentTrack.id}
              <div
                class="absolute inset-x-0 text-center"
                in:fade|global={{ duration: 300, easing: quintOut, delay: 150 }}
                out:fade|global={{ duration: 200, easing: quintOut }}
              >
                <MarqueeText indefinite speed={40} class="text-2xl">
                  <h1 class="text-on-surface text-2xl font-bold">
                    {audioPlayer.currentTrack.title}
                  </h1>
                </MarqueeText>
                <div class="text-on-surface-variant mt-2 truncate text-lg">
                  {#each audioPlayer.currentTrack.artists.toSorted( (a) => (a.name !== audioPlayer.currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                    {@const shouldHaveComma =
                      audioPlayer.currentTrack.artists.length > 1 &&
                      index != audioPlayer.currentTrack.artists.length - 1}
                    <button
                      onclick={() => {
                        goto(resolve(`/(app)/(authed)/artist/[id]`, { id: artist.id }));
                        onclose();
                      }}
                      class={[shouldHaveComma && 'mr-1']}
                    >
                      {artist.name}{#if shouldHaveComma},{/if}
                    </button>
                  {/each}
                </div>

                <button
                  onclick={() => {
                    goto(
                      resolve(`/(app)/(authed)/album/[id]`, {
                        id: audioPlayer.currentTrack!.album.id
                      })
                    );
                    onclose();
                  }}
                  class="text-on-surface-variant mt-1 block w-full truncate text-base"
                >
                  {audioPlayer.currentTrack.album.title}
                </button>
              </div>
            {/key}
          {/if}
        </div>
      </div>

      <div class="w-full px-6 pb-2">
        <ProgressBar
          class="mx-auto max-w-3xl"
          {currentString}
          {bufferedRanges}
          {duration}
          {durationString}
          bind:currentTime
          bind:prevSeekTime
        />
      </div>

      <div class="@container relative z-10 flex items-center justify-center pt-4 pb-12 sm:pb-8">
        <Controls bind:repeat {onstop} />
        <div
          class="hidden w-24 items-center gap-2 @md:absolute @lg:right-4 @lg:flex @xl:right-12 @3xl:w-40"
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
              <RoundVolumeOff class="text-primary text-2xl transition-colors duration-500" />
            {:else if volume < 0.3}
              <RoundVolumeMute class="text-primary text-2xl transition-colors duration-500" />
            {:else if volume < 0.7}
              <RoundVolumeDown class="text-primary text-2xl transition-colors duration-500" />
            {:else}
              <RoundVolumeUp class="text-primary text-2xl transition-colors duration-500" />
            {/if}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={volume}
            class="styled-range h-4! w-24"
            aria-label="Volume bar"
          />
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference "../../../app.css";

  .fullscreen-swiper {
    overflow: visible;
  }

  .fullscreen-swiper :global(.swiper-wrapper) {
    align-items: center;
  }

  .fullscreen-swiper :global(.swiper-slide) {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .fullscreen-swiper :global(.swiper-slide-active) {
    z-index: 10;
  }

  .album-slide {
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
</style>
