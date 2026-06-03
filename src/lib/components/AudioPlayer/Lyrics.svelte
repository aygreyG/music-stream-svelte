<script lang="ts">
  import { tick } from 'svelte';
  import { fade } from 'svelte/transition';

  import { vibrate } from '$lib/actions/vibrate';
  import { getActiveLrcIndex, parseLrc, type LrcLine } from '$lib/shared/lrc';

  import RoundMusicNote from '~icons/ic/round-music-note';
  import RoundRefresh from '~icons/ic/round-refresh';

  interface Props {
    trackId: string | null;
    currentTime: number;
    autoScroll?: boolean;
  }

  let { trackId, currentTime, autoScroll = true }: Props = $props();

  type Status = 'idle' | 'loading' | 'found' | 'instrumental' | 'not_found' | 'error';

  let status: Status = $state('idle');
  let plainLyrics: string | null = $state(null);
  let lrcLines: LrcLine[] = $state([]);
  let isSynced = $derived(lrcLines.length > 0);
  let activeIndex = $derived(isSynced ? getActiveLrcIndex(lrcLines, currentTime) : -1);

  let lyricsContainer: HTMLDivElement | null = $state(null);
  let lineEls: HTMLElement[] = $state([]);

  // Indices of the first and last lines that have actual text (for skipping leading/trailing breaks)
  let firstLyricIndex = $derived(lrcLines.findIndex((l) => l.text));
  let lastLyricIndex = $derived(
    lrcLines.length - 1 - lrcLines.toReversed().findIndex((l) => l.text)
  );

  let _abortCtrl: AbortController | null = null;

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

    const params = force ? '?force=true' : '';

    try {
      const res = await fetch(`/api/lyrics/${id}${params}`, { signal: ctrl.signal });

      if (res.status === 404) {
        status = 'not_found';
        return;
      }
      if (!res.ok) throw new Error(`${res.status}`);

      const data = await res.json();
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

    if (!id) {
      status = 'idle';
      plainLyrics = null;
      lrcLines = [];
      return;
    }

    fetchLyrics(false);

    return () => {
      _abortCtrl?.abort();
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
      <RoundMusicNote class="text-on-surface/30 text-5xl" />
      <p class="text-on-surface-variant text-sm">This track is instrumental.</p>
    </div>
  {:else if status === 'found'}
    {#if isSynced}
      <div class="flex flex-col gap-1 py-8">
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
            {@const shortBreak = duration < 2}
            {@const progress = isActive
              ? Math.min(1, Math.max(0, (currentTime - line.time) / duration))
              : isPast
                ? 1
                : 0}
            <div bind:this={lineEls[i]} class="flex justify-center py-3">
              <div
                class={[
                  'overflow-hidden rounded-full transition-all duration-300',
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
