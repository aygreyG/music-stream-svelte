<script lang="ts">
  import RoundKeyboardArrowDown from '~icons/ic/round-keyboard-arrow-down';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import AlbumImage from '../AlbumImage.svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut, cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import Swiper from 'swiper';
  import { EffectCoverflow } from 'swiper/modules';
  import 'swiper/css';
  import 'swiper/css/effect-coverflow';
  import { beforeNavigate, goto } from '$app/navigation';
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
    analyser = null,
    bufferedRanges = []
  }: Props = $props();

  const audioPlayer = getAudioPlayer();

  let swiperContainer: HTMLDivElement | null = $state(null);
  let swiperInstance: Swiper | null = $state(null);
  let prevSeekTime = $state(0);
  let lastPlayedIndex = $state(audioPlayer.queueContextIndex);

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
          }
        },
        touchEnd: (sw) => {
          const newIndex = sw?.activeIndex ?? 0;
          if (newIndex !== lastPlayedIndex) {
            lastPlayedIndex = newIndex;
            audioPlayer.playAtIndex(newIndex);
          }
        }
      }
    });

    if (swiperInstance.activeIndex !== initialIndex) {
      swiperInstance.slideTo(initialIndex, 0, false);
    }

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
  });

  beforeNavigate((navigation) => {
    if (navigation.type === 'popstate') {
      navigation.cancel();
      onclose();
    }
  });
</script>

<div
  class="fixed inset-0 z-100 flex flex-col bg-zinc-950/85 backdrop-blur-xl sm:hidden"
  in:fly={{ y: 100, duration: 300, easing: cubicOut }}
  out:fly={{ y: 100, duration: 300, easing: cubicOut }}
>
  <Visualizer
    {analyser}
    sizeMultiplier={4}
    class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 w-full opacity-15 motion-reduce:hidden"
  />

  <div class="z-10 flex items-center justify-end p-4">
    <div
      class="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-wide text-zinc-400"
    >
      Now Playing
    </div>
    <button
      onclick={onclose}
      class="text-primary-dark active:text-primary rounded-full p-2 text-3xl transition-colors"
      aria-label="Close full screen player"
      use:vibrate
    >
      <RoundKeyboardArrowDown />
    </button>
  </div>

  <!-- Album Art Swiper -->
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
                class="absolute inset-0 m-auto aspect-square w-full max-w-70 scale-110 rounded-3xl opacity-30 blur-3xl sm:max-w-80"
                style="background-color: var(--primary);"
              ></div>
            {/if}
            <div
              class="album-slide mx-auto aspect-square w-full max-w-70 overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 sm:max-w-80"
              class:opacity-40={index !== audioPlayer.queueContextIndex}
              class:scale-90={index !== audioPlayer.queueContextIndex}
            >
              <AlbumImage album={track.album} maxSize="l" />
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Track Info -->
    <div class="mt-8 h-24 w-full max-w-sm px-4">
      {#if audioPlayer.currentTrack}
        {#key audioPlayer.currentTrack.id}
          <div
            class="absolute inset-x-0 text-center"
            in:fade|global={{ duration: 300, easing: quintOut, delay: 150 }}
            out:fade|global={{ duration: 200, easing: quintOut }}
          >
            <h1 class="truncate text-2xl font-bold text-zinc-100">
              {audioPlayer.currentTrack.title}
            </h1>
            <div class="mt-2 truncate text-lg text-zinc-400">
              {#each audioPlayer.currentTrack.artists.toSorted( (a, _) => (a.name !== audioPlayer.currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                {@const shouldHaveComma =
                  audioPlayer.currentTrack.artists.length > 1 &&
                  index != audioPlayer.currentTrack.artists.length - 1}
                <button
                  onclick={() => {
                    goto(`/artist/${artist.id}`);
                    onclose();
                  }}
                  class={{ 'mr-1': shouldHaveComma }}
                >
                  {artist.name}{#if shouldHaveComma},{/if}
                </button>
              {/each}
            </div>

            <button
              onclick={() => {
                goto(`/album/${audioPlayer.currentTrack?.album.id}`);
                onclose();
              }}
              class="mt-1 block w-full truncate text-base text-zinc-500"
            >
              {audioPlayer.currentTrack.album.title}
            </button>
          </div>
        {/key}
      {/if}
    </div>
  </div>

  <!-- Progress Bar -->
  <div class="px-6 pb-2">
    <ProgressBar
      {currentString}
      {bufferedRanges}
      {duration}
      {durationString}
      bind:currentTime
      bind:prevSeekTime
    />
  </div>

  <Controls bind:repeat {onstop} class="z-10 justify-center pt-4 pb-12" />
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
