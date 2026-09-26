<script lang="ts">
  import { tick, type Component } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import type { SVGAttributes } from 'svelte/elements';
  import { fade, scale } from 'svelte/transition';

  import { vibrate } from '$lib/actions/vibrate';
  import { getActiveLrcIndex, parseLrc, type LrcLine } from '$lib/shared/lrc';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  import RoundArrowDropDown from '~icons/ic/round-arrow-drop-down';
  import RoundArrowDropUp from '~icons/ic/round-arrow-drop-up';
  import RoundMusicNote from '~icons/ic/round-music-note';
  import RoundRefresh from '~icons/ic/round-refresh';
  import RoundRestartAlt from '~icons/ic/round-restart-alt';
  import Music1Fill from '~icons/iconamoon/music-1-fill';
  import Music2Fill from '~icons/iconamoon/music-2-fill';

  interface Props {
    trackId: string | null;
    currentTime: number;
    autoScroll?: boolean;
  }

  let { trackId, currentTime, autoScroll = true }: Props = $props();

  const audioPlayer = getAudioPlayer();

  type Status = 'idle' | 'loading' | 'found' | 'instrumental' | 'not_found' | 'error';

  let status: Status = $state('idle');
  let plainLyrics: string | null = $state(null);
  let lrcLines: LrcLine[] = $state([]);
  let delay = $state(0);
  let isSynced = $derived(lrcLines.length > 0);
  let adjustedTime = $derived(currentTime + delay);
  let activeIndex = $derived(isSynced ? getActiveLrcIndex(lrcLines, adjustedTime) : -1);
  let delayLabel = $derived(delay === 0 ? '0s' : `${delay > 0 ? '+' : ''}${delay.toFixed(1)}s`);

  let lyricsContainer: HTMLDivElement | null = $state(null);
  let lineEls: HTMLElement[] = $state([]);

  // Indices of the first and last lines that have actual text (for skipping leading/trailing breaks)
  let firstLyricIndex = $derived(lrcLines.findIndex((l) => l.text));
  let lastLyricIndex = $derived(
    lrcLines.length - 1 - lrcLines.toReversed().findIndex((l) => l.text)
  );

  interface FloatGlyph {
    id: string;
    icon: Component<SVGAttributes<SVGSVGElement>>;
    /** Literal Tailwind classes so the compiler picks up the arbitrary values. */
    classes: string;
  }

  // One floating note each; the custom properties drive the motion defined in the keyframes below.
  const FLOAT_GLYPHS: FloatGlyph[] = [
    {
      id: 'left-outer',
      icon: Music1Fill,
      classes:
        'text-primary/60 text-base [--float-from-x:-4rem] [--float-to-x:-5.5rem] [--float-rise:3rem] [--float-scale:0.8] [--float-opacity:0.45] [--float-sway:0.4rem] [--float-tilt:-12deg] [--float-duration:4.2s] [--float-delay:-2.6s]'
    },
    {
      id: 'left-inner',
      icon: Music2Fill,
      classes:
        'text-primary/80 text-xl [--float-from-x:-2.5rem] [--float-to-x:-2rem] [--float-rise:3.5rem] [--float-scale:1] [--float-opacity:0.55] [--float-sway:0.5rem] [--float-tilt:14deg] [--float-duration:3.6s] [--float-delay:-0.9s]'
    },
    {
      id: 'center-left',
      icon: Music1Fill,
      classes:
        'text-primary text-2xl [--float-from-x:-1rem] [--float-to-x:-1.75rem] [--float-rise:4rem] [--float-scale:1.1] [--float-opacity:0.65] [--float-sway:0.35rem] [--float-tilt:-10deg] [--float-duration:4.8s] [--float-delay:-3.4s]'
    },
    {
      id: 'center-right',
      icon: Music2Fill,
      classes:
        'text-primary text-xl [--float-from-x:1rem] [--float-to-x:1.75rem] [--float-rise:3.25rem] [--float-scale:0.95] [--float-opacity:0.55] [--float-sway:0.45rem] [--float-tilt:12deg] [--float-duration:3.9s] [--float-delay:-1.8s]'
    },
    {
      id: 'right-inner',
      icon: Music1Fill,
      classes:
        'text-primary/80 text-2xl [--float-from-x:2.5rem] [--float-to-x:3.5rem] [--float-rise:3.75rem] [--float-scale:1.05] [--float-opacity:0.5] [--float-sway:0.55rem] [--float-tilt:-15deg] [--float-duration:4.5s] [--float-delay:-4.1s]'
    },
    {
      id: 'right-outer',
      icon: Music2Fill,
      classes:
        'text-primary/60 text-base [--float-from-x:4rem] [--float-to-x:5.5rem] [--float-rise:2.75rem] [--float-scale:0.75] [--float-opacity:0.45] [--float-sway:0.3rem] [--float-tilt:10deg] [--float-duration:3.4s] [--float-delay:-0.2s]'
    }
  ];

  const SHORT_BREAK_GLYPHS = FLOAT_GLYPHS.slice(1, 4);

  let _abortCtrl: AbortController | null = null;
  let _saveTimer: ReturnType<typeof setTimeout> | null = null;

  function setDelay(value: number) {
    delay = Math.round(value * 10) / 10;
    const id = trackId;
    if (!id) return;
    clearTimeout(_saveTimer ?? undefined);
    // ponytail: debounce bursts of ±0.1 taps
    _saveTimer = setTimeout(() => {
      fetch(`/api/lyrics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delay })
      });
    }, 300);
  }

  function nudgeDelay(delta: number) {
    setDelay(delay + delta);
  }

  async function fetchLyrics(force: boolean) {
    const id = trackId;
    if (!id) return;

    _abortCtrl?.abort();
    const ctrl = new AbortController();
    _abortCtrl = ctrl;

    lastScrolledIdx = -1;
    prevAutoScroll = false;
    status = 'loading';
    plainLyrics = null;
    lrcLines = [];
    delay = 0;

    const params = force ? '?force=true' : '';

    try {
      const res = await fetch(`/api/lyrics/${id}${params}`, { signal: ctrl.signal });

      if (res.status === 404) {
        status = 'not_found';
        return;
      }
      if (!res.ok) throw new Error(`${res.status}`);

      const data = await res.json();
      delay = Number(data.delay) || 0;
      if (data.instrumental) {
        status = 'instrumental';
        return;
      }
      if (data.syncedLyrics) {
        lrcLines = parseLrc(data.syncedLyrics);
      } else if (data.plainLyrics) {
        plainLyrics = data.plainLyrics;
      } else {
        status = 'not_found';
        return;
      }
      status = 'found';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Error fetching lyrics:', err);
      status = 'error';
    }
  }

  $effect(() => {
    const id = trackId;
    lastScrolledIdx = -1;
    prevAutoScroll = false;
    clearTimeout(_saveTimer ?? undefined);

    if (!id) {
      status = 'idle';
      plainLyrics = null;
      lrcLines = [];
      delay = 0;
      return;
    }

    fetchLyrics(false);

    return () => {
      _abortCtrl?.abort();
      clearTimeout(_saveTimer ?? undefined);
    };
  });

  let prevAutoScroll = false;
  let lastScrolledIdx = -1;

  $effect(() => {
    const scrolling = autoScroll;
    const idx = activeIndex;

    if (!scrolling || !isSynced || idx < 0) return;
    if (idx === lastScrolledIdx && prevAutoScroll) return;

    const snap = !prevAutoScroll;
    lastScrolledIdx = idx;
    prevAutoScroll = scrolling;

    tick().then(() => {
      const el = lineEls[idx];
      if (el && lyricsContainer) {
        el.scrollIntoView({ block: 'center', behavior: snap ? 'instant' : 'smooth' });
      }
    });
  });
</script>

{#if trackId}
  <button
    onclick={() => fetchLyrics(true)}
    disabled={status === 'loading'}
    class="text-primary/30 hover:text-primary absolute top-2 right-2 z-10 text-xl transition-colors enabled:active:scale-90 disabled:opacity-30"
    class:animate-spin={status === 'loading'}
    aria-label="Refresh lyrics"
    use:vibrate
  >
    <RoundRefresh />
  </button>
{/if}

{#if isSynced}
  <div class="absolute left-1/2 z-10 -translate-x-1/2 max-sm:-bottom-4 sm:bottom-5">
    <div class="bg-surface-container flex items-center rounded-full p-1">
      <button
        onclick={() => nudgeDelay(-0.1)}
        class="bg-surface-variant text-primary flex size-9 items-center justify-center rounded-l-4xl rounded-r-xl text-3xl transition-all"
        aria-label="Delay lyrics by 0.1 seconds"
        use:vibrate
      >
        <RoundArrowDropDown />
      </button>
      <span
        class="text-on-surface min-w-12 text-center text-sm font-semibold tabular-nums select-none"
        aria-live="polite"
      >
        {delayLabel}
      </span>
      <button
        onclick={() => nudgeDelay(0.1)}
        class="bg-surface-variant text-primary flex size-9 items-center justify-center rounded-l-xl rounded-r-4xl text-3xl transition-all"
        aria-label="Advance lyrics by 0.1 seconds"
        use:vibrate
      >
        <RoundArrowDropUp />
      </button>
    </div>
    {#if delay !== 0}
      <button
        onclick={() => setDelay(0)}
        class="bg-surface-variant text-on-surface-variant hover:text-primary absolute top-1/2 left-full ml-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-lg transition-all"
        aria-label="Reset lyrics delay"
        use:vibrate
        transition:scale={{ duration: 150, easing: cubicOut }}
      >
        <RoundRestartAlt />
      </button>
    {/if}
  </div>
{/if}

<div
  bind:this={lyricsContainer}
  class="lyrics-scroll-zone relative flex h-full w-full flex-col overflow-y-auto mask-y-from-90% mask-y-to-98% px-4 py-6 sm:mask-y-from-95%"
  in:fade={{ duration: 150 }}
>
  {#if status === 'loading'}
    <div class="flex flex-col items-center gap-3 pt-8">
      {#each { length: 8 }, i}
        <div
          class="bg-on-surface/10 h-3 animate-pulse rounded-full"
          style="width: {40 + (i % 3) * 12}%"
        ></div>
      {/each}
    </div>
  {:else if status === 'not_found' || status === 'error'}
    <div class="flex h-full flex-col items-center justify-center gap-2 text-center">
      <p class="text-on-surface-variant text-sm">
        {#if status === 'not_found'}
          No lyrics found for this track.
        {:else}
          An error occurred while fetching lyrics.
        {/if}
      </p>
      <button
        onclick={() => fetchLyrics(status !== 'error')}
        class="text-primary flex items-center gap-1 hover:underline"
        use:vibrate
      >
        <RoundRefresh />
        Retry
      </button>
    </div>
  {:else if status === 'instrumental'}
    <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div class="relative [--float-rise-mult:1.8]">
        {@render floatGlyphLayer(FLOAT_GLYPHS)}
        <RoundMusicNote class="text-on-surface/30 text-5xl" />
      </div>
      <p class="text-on-surface-variant text-sm">This track is instrumental.</p>
    </div>
  {:else if status === 'found'}
    {#if isSynced}
      <div class="flex flex-col gap-1 py-8 pb-14">
        {#each lrcLines as line, i (i)}
          {@const isActive = i === activeIndex}
          {@const isPast = i < activeIndex}
          {#if line.text}
            <p
              bind:this={lineEls[i]}
              class={[
                'text-center text-xl leading-relaxed font-bold transition-all duration-300 select-none',
                isActive && 'text-on-surface scale-105',
                !isActive && isPast && 'text-on-surface/30',
                !isActive && !isPast && 'text-on-surface/40'
              ]}
            >
              {line.text}
            </p>
          {:else if i > firstLyricIndex && i < lastLyricIndex}
            {@const nextTime = lrcLines[i + 1]?.time ?? line.time + 5}
            {@const duration = Math.max(0.1, nextTime - line.time)}
            {@const shortBreak = duration < 2.5}
            {@const progress = isActive
              ? Math.min(1, Math.max(0, (adjustedTime - line.time) / duration))
              : isPast
                ? 1
                : 0}
            {#if duration >= 1}
              <div bind:this={lineEls[i]} class="relative flex justify-center py-3">
                {#if isActive}
                  <div
                    class={[
                      'bg-primary/15 pointer-events-none absolute top-1/2 left-1/2 h-3 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full blur-md motion-reduce:animate-none',
                      shortBreak ? 'w-20' : 'w-32',
                      audioPlayer.paused && 'float-paused'
                    ]}
                    aria-hidden="true"
                  ></div>
                  {@render floatGlyphLayer(shortBreak ? SHORT_BREAK_GLYPHS : FLOAT_GLYPHS)}
                {/if}
                <div
                  class={[
                    'relative overflow-hidden rounded-full transition-all duration-300',
                    shortBreak ? 'h-0.5 w-16' : 'h-1 w-28',
                    isActive && 'bg-on-surface/50 scale-105',
                    !isActive && isPast && 'bg-on-surface/20',
                    !isActive && !isPast && 'bg-on-surface/30'
                  ]}
                >
                  {#if progress > 0}
                    <div
                      class={[
                        'h-full rounded-full transition-all duration-75',
                        isActive ? 'bg-primary' : 'bg-transparent'
                      ]}
                      style:width="{progress * 100}%"
                    ></div>
                  {/if}
                </div>
              </div>
            {/if}
          {/if}
        {/each}
      </div>
    {:else if plainLyrics}
      <div class="py-8">
        {#each plainLyrics.split('\n') as line, i (i)}
          <p
            class={[
              'text-on-surface/80 text-center leading-relaxed select-none',
              line.trim() === '' ? 'mb-4' : 'text-base'
            ]}
          >
            {line || '\u00A0'}
          </p>
        {/each}
      </div>
    {/if}
  {/if}
</div>

{#snippet floatGlyphLayer(glyphs: FloatGlyph[])}
  <div
    class={[
      'pointer-events-none absolute inset-0 transition-opacity duration-500',
      audioPlayer.paused && 'float-paused opacity-0'
    ]}
    aria-hidden="true"
  >
    <div class="absolute inset-0" in:fade={{ duration: 250 }} out:fade={{ duration: 350 }}>
      {#each glyphs as glyph (glyph.id)}
        {@const Icon = glyph.icon}
        <span class={['float-glyph absolute bottom-1/2 left-1/2', glyph.classes]}>
          <span class="float-glyph-sway"><Icon /></span>
        </span>
      {/each}
    </div>
  </div>
{/snippet}

<style>
  .float-glyph {
    animation: float-rise var(--float-duration, 3.8s) ease-out infinite;
    animation-delay: var(--float-delay, 0s);
  }

  .float-glyph-sway {
    display: inline-block;
    animation: float-sway calc(var(--float-duration, 3.8s) * 0.5) ease-in-out infinite alternate;
    animation-delay: var(--float-delay, 0s);
  }

  /* animation-play-state is not inherited, so every animated layer has to be paused */
  .float-paused,
  .float-paused .float-glyph,
  .float-paused .float-glyph-sway {
    animation-play-state: paused;
  }

  @keyframes float-rise {
    0% {
      opacity: 0;
      transform: translate3d(var(--float-from-x, 0), 0.5rem, 0)
        scale(calc(var(--float-scale, 1) * 0.5));
    }

    20%,
    55% {
      opacity: var(--float-opacity, 0.6);
    }

    100% {
      opacity: 0;
      transform: translate3d(
          var(--float-to-x, 0),
          calc(-1 * var(--float-rise, 3rem) * var(--float-rise-mult, 1)),
          0
        )
        scale(var(--float-scale, 1));
    }
  }

  @keyframes float-sway {
    from {
      transform: translateX(calc(-1 * var(--float-sway, 0.4rem)))
        rotate(calc(-1 * var(--float-tilt, 10deg)));
    }

    to {
      transform: translateX(var(--float-sway, 0.4rem)) rotate(var(--float-tilt, 10deg));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .float-glyph,
    .float-glyph-sway {
      animation: none;
    }

    .float-glyph {
      opacity: var(--float-opacity, 0.6);
      transform: translateX(var(--float-from-x, 0));
    }
  }
</style>
