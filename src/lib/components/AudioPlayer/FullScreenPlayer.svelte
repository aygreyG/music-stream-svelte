<script lang="ts">
  import { Pane, PaneGroup, PaneResizer, type PaneAPI } from 'paneforge';
  import { onMount, tick } from 'svelte';
  import { cubicOut, quintOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import Swiper from 'swiper';
  import { EffectCoverflow } from 'swiper/modules';

  import { vibrate } from '$lib/actions/vibrate';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import { deviceInfo } from '$lib/states/deviceInfo.svelte';

  import RoundKeyboardArrowDown from '~icons/ic/round-keyboard-arrow-down';
  import RoundLyrics from '~icons/ic/round-lyrics';
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
  import { handleVibrate, sortArtists } from '$lib/utils';

  import MarqueeText from '../MarqueeText.svelte';
  import Controls from './Controls.svelte';
  import Lyrics from './Lyrics.svelte';
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
  let verticalSwiperEl: HTMLDivElement | null = $state(null);
  let verticalSwiper: Swiper | null = null; // non-reactive; only read inside effects/callbacks
  let prevSeekTime = $state(0);
  let lastPlayedIndex = $state(audioPlayer.queueContextIndex);
  let queueListEl: HTMLDivElement | null = $state(null);
  let prevVolume = $state(0.3);

  // Lyrics panel state
  let lyricsOpen = $state(false); // desktop right panel
  let mobileLyricsView = $state(false); // mobile: true = lyrics slide visible

  let queuePane = $state<PaneAPI>();
  let lyricsPane = $state<PaneAPI>();

  function toggleQueue() {
    if (queuePane?.isCollapsed()) {
      queuePane?.expand();
      audioPlayer.fullScreenQueueOpen = true;
    } else {
      queuePane?.collapse();
      audioPlayer.fullScreenQueueOpen = false;
    }
  }

  function toggleLyrics() {
    if (lyricsPane?.isCollapsed()) {
      lyricsPane?.expand();
      lyricsOpen = true;
    } else {
      lyricsPane?.collapse();
      lyricsOpen = false;
    }
  }

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

    tick().then(() => {
      scrollToCurrentTrack();
    });

    // Initialize vertical swiper on mobile only (avoids clipping coverflow depth on desktop)
    if (window.matchMedia('(max-width: 639px)').matches && verticalSwiperEl) {
      verticalSwiper = new Swiper(verticalSwiperEl, {
        direction: 'vertical',
        slidesPerView: 1,
        speed: 280,
        resistanceRatio: 0.5,
        wrapperClass: 'v-swiper-wrapper',
        slideClass: 'v-swiper-slide',
        spaceBetween: 50,
        noSwipingSelector: '.lyrics-scroll-zone',
        on: {
          slideChangeTransitionEnd: (sw) => {
            const isLyrics = sw.activeIndex === 1;
            if (isLyrics !== mobileLyricsView) {
              mobileLyricsView = isLyrics;
              handleVibrate(1);
            }
          }
        }
      });
    }

    return () => {
      if (swiperInstance) swiperInstance.destroy();
      if (verticalSwiper) verticalSwiper.destroy();
    };
  });

  // Sync swiper when track changes externally
  $effect(() => {
    if (!swiperInstance) return;
    const targetIndex = audioPlayer.queueContextIndex;
    if (swiperInstance.activeIndex !== targetIndex) {
      lastPlayedIndex = targetIndex;
      swiperInstance.slideTo(targetIndex, 400);
    }
    tick().then(() => scrollToCurrentTrack());
  });

  // Keep vertical swiper in sync when mobileLyricsView is changed programmatically
  $effect(() => {
    const target = mobileLyricsView ? 1 : 0;
    if (verticalSwiper && verticalSwiper.activeIndex !== target) {
      verticalSwiper.slideTo(target, 280);
    }
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
  <!-- Header -->
  <div class="z-10 flex items-center justify-between p-4 pb-0">
    <!-- Left: queue toggle (desktop) + playlist info (mobile) -->
    <div class="flex items-center max-sm:max-w-1/3">
      <button
        onclick={toggleQueue}
        class={[
          'active:text-primary hidden p-2 text-xl transition-colors sm:flex',
          audioPlayer.fullScreenQueueOpen ? 'text-primary' : 'text-on-surface-variant'
        ]}
        aria-label="Toggle queue"
        use:vibrate
      >
        <RoundQueueMusic />
      </button>
      {#if audioPlayer.playlistInfo}
        <button
          onclick={() => {
            const url =
              audioPlayer.playlistInfo?.id === 'favourites'
                ? resolve(`/(app)/(authed)/favourite`)
                : resolve(`/(app)/(authed)/playlist/[id]`, { id: audioPlayer.playlistInfo!.id });
            goto(url);
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

    <!-- Right: lyrics toggle (desktop) + close -->
    <div class="flex items-center gap-1">
      <button
        onclick={toggleLyrics}
        class={[
          'active:text-primary hidden p-2 text-lg transition-colors sm:flex',
          lyricsOpen ? 'text-primary' : 'text-on-surface-variant'
        ]}
        aria-label="Toggle lyrics"
        use:vibrate
      >
        <RoundLyrics />
      </button>
      <button
        onclick={onclose}
        class="text-on-surface-variant active:text-primary rounded-full p-2 text-3xl transition-colors"
        aria-label="Close full screen player"
        use:vibrate
      >
        <RoundKeyboardArrowDown />
      </button>
    </div>
  </div>

  <PaneGroup direction="horizontal" autoSaveId="fullscreen-player" class="min-h-0 flex-1">
    <!-- Left: queue panel (desktop) -->
    {#if !deviceInfo.isMobile.current}
      <Pane
        bind:this={queuePane}
        defaultSize={0}
        minSize={15}
        maxSize={40}
        collapsible={true}
        collapsedSize={0}
        order={1}
        onCollapse={() => (audioPlayer.fullScreenQueueOpen = false)}
        onExpand={() => (audioPlayer.fullScreenQueueOpen = true)}
        class="min-h-0 min-w-0 overflow-hidden"
      >
        <div class="bg-surface z-10 flex h-full w-full flex-col rounded-tr-xl pb-4 pl-4">
          <div
            bind:this={queueListEl}
            class="bg-surface-container/60 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto rounded-xl p-2"
          >
            {#if audioPlayer.playlistInfo}
              <button
                onclick={() => {
                  const url =
                    audioPlayer.playlistInfo?.id === 'favourites'
                      ? resolve(`/(app)/(authed)/favourite`)
                      : resolve(`/(app)/(authed)/playlist/[id]`, {
                          id: audioPlayer.playlistInfo!.id
                        });
                  goto(url);
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
                    {sortArtists(track.artists, track.album.albumArtist.name)
                      .map((a) => a.name)
                      .join(', ')}
                  </span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      </Pane>
      <PaneResizer
        class="hover:after:bg-primary/40 data-active:after:bg-primary/80 z-10 after:absolute after:inset-0 after:w-1 after:rounded-full after:transition-colors after:content-['']"
      />
    {/if}

    <!-- Center: main content -->
    <Pane defaultSize={50} minSize={33} order={2} class="min-h-0 min-w-0">
      <div class="flex h-full min-w-0 flex-1 flex-col">
        <Visualizer
          {analyser}
          class="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full opacity-15 motion-reduce:hidden"
        />

        <div class="flex flex-1 flex-col items-center justify-center">
          <div class="flex w-full max-w-lg items-center">
            <!-- Vertical dot indicators — left outer side, mobile only -->
            <div
              class="bg-surface/50 absolute left-1 z-10 flex flex-col items-center justify-center gap-2 self-center rounded-full p-2 backdrop-blur-md sm:hidden"
            >
              <button
                onclick={() => (mobileLyricsView = false)}
                class={[
                  'flex-none rounded-full transition-all duration-300',
                  !mobileLyricsView ? 'bg-primary h-5 w-1.5' : 'bg-on-surface/30 size-1.5'
                ]}
                aria-label="Show album art"
              ></button>
              <button
                onclick={() => (mobileLyricsView = true)}
                class={[
                  'flex-none rounded-full transition-all duration-300',
                  mobileLyricsView ? 'bg-primary h-5 w-1.5' : 'bg-on-surface/30 size-1.5'
                ]}
                aria-label="Show lyrics"
              ></button>
            </div>

            <div class="relative min-w-0 flex-1">
              <!--
              Vertical Swiper on mobile (album art ↔ lyrics); plain div on desktop.
              aspect-[1.4] matches slidesPerView:1.4 so the container height equals the
              active slide.
            -->
              <div
                bind:this={verticalSwiperEl}
                role="region"
                aria-label={mobileLyricsView
                  ? 'Lyrics (swipe down for album art)'
                  : 'Album art (swipe up for lyrics)'}
                class="w-full max-sm:aspect-[1.4] max-sm:max-h-85 max-sm:overflow-y-clip max-sm:rounded-2xl max-sm:py-8"
              >
                <div class="v-swiper-wrapper">
                  <!-- Slide 0: coverflow album art -->
                  <div class="v-swiper-slide">
                    <div
                      bind:this={swiperContainer}
                      class="swiper fullscreen-swiper w-full max-w-lg"
                    >
                      <div class="swiper-wrapper items-center">
                        {#each audioPlayer.queueContext as track, index (track.id)}
                          <div class="swiper-slide">
                            <div class="relative mx-auto aspect-square w-full max-w-70 sm:max-w-80">
                              <div
                                class={[
                                  'bg-primary pointer-events-none absolute -inset-1 rounded-3xl blur-lg transition-all duration-500',
                                  index === audioPlayer.queueContextIndex && !mobileLyricsView
                                    ? 'opacity-25'
                                    : 'opacity-0'
                                ]}
                              ></div>
                              <div
                                class={[
                                  'relative aspect-square w-full overflow-hidden rounded-2xl transition-all duration-300',
                                  index !== audioPlayer.queueContextIndex && 'scale-90 opacity-40'
                                ]}
                              >
                                <AlbumImage album={track.album} />
                              </div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  </div>

                  <!-- Slide 1: lyrics — mobile only -->
                  {#if deviceInfo.isMobile.current}
                    <div class="v-swiper-slide relative pl-4.5 sm:hidden">
                      <div class="absolute inset-x-0 top-0 z-10 h-1/3"></div>
                      {#if mobileLyricsView}
                        <Lyrics
                          trackId={audioPlayer.currentTrack?.id ?? null}
                          {currentTime}
                          autoScroll={mobileLyricsView}
                        />
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>

          <!-- Track info -->
          <div class="mt-4 h-24 w-full max-w-sm px-4 sm:mt-8">
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
                  <div class="text-on-surface-variant truncate text-lg">
                    {#each sortArtists(audioPlayer.currentTrack.artists, audioPlayer.currentTrack.album.albumArtist.name) as artist, index (artist.id)}
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

        <div class="w-full px-6 py-2">
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

        <div
          class="@container relative z-10 flex items-center justify-center pb-12 sm:pt-4 sm:pb-8"
        >
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
    </Pane>

    {#if !deviceInfo.isMobile.current}
      <!-- Right: lyrics panel (desktop) -->
      <PaneResizer
        class="hover:after:bg-primary/40 data-active:after:bg-primary/80 z-10 after:absolute after:inset-0 after:w-1 after:-translate-x-full after:rounded-full after:transition-colors after:content-['']"
      />
      <Pane
        bind:this={lyricsPane}
        defaultSize={0}
        minSize={25}
        maxSize={60}
        collapsible={true}
        collapsedSize={0}
        order={3}
        onCollapse={() => (lyricsOpen = false)}
        onExpand={() => (lyricsOpen = true)}
        class="min-h-0 min-w-0 overflow-hidden"
      >
        <div class="bg-surface z-10 flex h-full w-full flex-col rounded-tl-xl pr-4 pb-4">
          <div class="bg-surface-container/60 flex min-h-0 flex-1 overflow-hidden rounded-xl">
            {#if lyricsOpen}
              <Lyrics
                trackId={audioPlayer.currentTrack?.id ?? null}
                {currentTime}
                autoScroll={true}
              />
            {/if}
          </div>
        </div>
      </Pane>
    {/if}
  </PaneGroup>
</div>

<style lang="postcss">
  @reference "../../../app.css";

  .fullscreen-swiper {
    overflow: visible;
  }

  .fullscreen-swiper :global(.swiper-wrapper) {
    align-items: center;
    overflow: visible !important;
  }

  .fullscreen-swiper :global(.swiper-slide) {
    overflow: visible !important;
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .fullscreen-swiper :global(.swiper-slide-active) {
    z-index: 10;
  }

  /*
    Custom classes for the vertical Swiper to avoid colliding with Swiper's
    built-in .swiper-wrapper / .swiper-slide rules.
  */
  :global(.v-swiper-wrapper) {
    display: flex;
    flex-direction: column;
    width: 100%;
    will-change: transform;
  }

  :global(.v-swiper-slide) {
    flex-shrink: 0;
    width: 100%;
    position: relative;
  }
</style>
