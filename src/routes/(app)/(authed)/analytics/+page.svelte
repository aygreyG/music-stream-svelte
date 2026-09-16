<script lang="ts">
  import { slide } from 'svelte/transition';

  import { resolve } from '$app/paths';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { getExpressiveScheme, schemeToCSS } from '$lib/materialColors';
  import { getCompactDuration } from '$lib/utils';

  import RoundCalendarToday from '~icons/ic/round-calendar-today';
  import RoundInsights from '~icons/ic/round-insights';
  import RoundMusicNote from '~icons/ic/round-music-note';
  import RoundPlaylistPlay from '~icons/ic/round-playlist-play';
  import HistoryFill from '~icons/iconamoon/history-fill';
  import MusicAlbumFill from '~icons/iconamoon/music-album-fill';
  import MusicArtistFill from '~icons/iconamoon/music-artist-fill';

  import type { PageData } from './$types';
  import RankedRow from './RankedRow.svelte';

  type AvailablePeriod = PageData['availablePeriods'][number];
  type HeatmapDay = PageData['heatmap'][number];
  type TrackMetric = 'plays' | 'listeningTime';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let trackMetric: TrackMetric = $state('listeningTime');
  let schemeStyles = $state<string[]>([]);
  let selectedDate = $state<string | null>(null);

  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long' });
  const shortMonthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' });
  const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatBackgrounds = [
    'bg-[color-mix(in_srgb,var(--on-surface)_8%,transparent)]',
    'bg-[color-mix(in_srgb,var(--primary)_25%,var(--surface-container))]',
    'bg-[color-mix(in_srgb,var(--primary)_45%,var(--surface-container))]',
    'bg-[color-mix(in_srgb,var(--primary)_70%,var(--surface-container))]',
    'bg-primary'
  ];

  let periodsForYear = $derived(
    data.availablePeriods.filter((period) => period.year === data.period.year)
  );
  let selectedMonth = $derived(data.period.month ?? periodsForYear.at(-1)?.month);
  let selectedRange = $derived.by(() => {
    const { view, year, month } = data.period;
    if (view === 'year') {
      const start = new Date(year, 0, 1).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric'
      });
      const end = new Date(year, 11, 31).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      return `${start} – ${end}`;
    }
    if (month) return `${monthFormatter.format(new Date(year, month - 1))} ${year}`;
    return String(year);
  });
  let availableYears = $derived.by(() => {
    const years: number[] = [];
    for (const period of data.availablePeriods) {
      if (years.at(-1) !== period.year) years.push(period.year);
    }
    return years.toReversed();
  });
  let monthQuery = $derived(analyticsQuery('month', data.period.year, selectedMonth));
  let yearQuery = $derived(analyticsQuery('year', data.period.year));
  let monthlyMaximum = $derived(
    Math.max(...data.monthlyBreakdown.map((month) => month[trackMetric]), 1)
  );
  let sortedTracks = $derived(data.topTracks.toSorted((a, b) => b[trackMetric] - a[trackMetric]));
  let heatmapMaximum = $derived(Math.max(...data.heatmap.map((day) => day[trackMetric]), 1));
  let heatmapCells = $derived.by(() => {
    const first = data.heatmap[0];
    if (!first) return [] as (HeatmapDay | null)[];
    const leading = (parseDate(first.date).getDay() + 6) % 7;
    const trailing = (7 - ((leading + data.heatmap.length) % 7)) % 7;
    return [
      ...Array<HeatmapDay | null>(leading).fill(null),
      ...data.heatmap,
      ...Array<HeatmapDay | null>(trailing).fill(null)
    ];
  });
  let heatmapMonths = $derived.by(() => {
    const months: { label: string; column: number }[] = [];
    let previousKey = '';
    for (const [index, day] of heatmapCells.entries()) {
      if (!day) continue;
      const date = parseDate(day.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (key === previousKey) continue;
      previousKey = key;
      months.push({ label: shortMonthFormatter.format(date), column: Math.floor(index / 7) });
    }
    return months;
  });
  let playsComparison = $derived(comparison(data.summary.plays, data.previousSummary.plays));
  let listeningTimeComparison = $derived(
    comparison(data.summary.listeningTime, data.previousSummary.listeningTime)
  );
  let selectedDay = $derived(data.heatmap.find((day) => day.date === selectedDate) ?? null);
  let peakDay = $derived.by(() => {
    let peak: HeatmapDay | null = null;
    for (const day of data.heatmap) {
      if (day[trackMetric] > (peak?.[trackMetric] ?? 0)) peak = day;
    }
    return peak;
  });
  let featured = $derived(sortedTracks[0]);
  let otherTracks = $derived(sortedTracks.slice(1, 10));
  let rankedLists = $derived([
    {
      title: 'Top artists',
      id: 'top-artists',
      kind: 'artist' as const,
      icon: MusicArtistFill,
      items: data.topArtists
    },
    {
      title: 'Top albums',
      id: 'top-albums',
      kind: 'album' as const,
      icon: MusicAlbumFill,
      items: data.topAlbums
    }
  ]);

  function parseDate(value: string) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function hours(seconds: number) {
    return `${(seconds / 3600).toFixed(seconds >= 36000 ? 0 : 1)} h`;
  }

  function periodLabel(period: AvailablePeriod) {
    return monthFormatter.format(new Date(period.year, period.month - 1));
  }

  function analyticsQuery(view: 'month' | 'year', year: number, month?: number) {
    if (view === 'month' && month) return `view=${view}&year=${year}&month=${month}`;
    return `view=${view}&year=${year}`;
  }

  function formatDate(value: string) {
    return dateFormatter.format(parseDate(value));
  }

  function comparison(value: number, previous: number) {
    if (!previous) return null;
    const change = ((value - previous) / previous) * 100;
    return {
      label: `${change > 0 ? '+' : ''}${Math.round(change)}%`,
      tone: change >= 0 ? 'text-primary' : 'text-error'
    };
  }

  function heatLevel(value: number) {
    if (value === 0) return 0;
    return Math.max(1, Math.ceil((value / heatmapMaximum) * 4));
  }

  function heatCellClass(level: number, selected = false) {
    return [
      'size-3 flex-none rounded-[0.2rem] sm:size-3.5',
      heatBackgrounds[level],
      'focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      selected && 'outline-on-surface outline-2 outline-offset-2'
    ];
  }

  function selectDay(day: HeatmapDay) {
    selectedDate = selectedDate === day.date ? null : day.date;
  }

  $effect(() => {
    const tracks = sortedTracks.slice(0, 3);
    let cancelled = false;

    Promise.all(
      tracks.map(async (track) => {
        try {
          return schemeToCSS(await getExpressiveScheme(track.albumId, track.albumArtId));
        } catch {
          return '';
        }
      })
    ).then((styles) => {
      if (!cancelled) schemeStyles = styles;
    });

    return () => {
      cancelled = true;
    };
  });
</script>

{#snippet viewTab(view: 'month' | 'year', query: string, label: string)}
  <a
    class={[
      'flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold transition-colors @lg:flex-none',
      data.period.view === view ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low'
    ]}
    href={resolve(`/analytics?${query}` as '/analytics')}
    aria-current={data.period.view === view ? 'page' : undefined}>{label}</a
  >
{/snippet}

{#snippet comparisonBadge(result: { label: string; tone: string } | null)}
  {#if result}
    <span
      class={[
        'bg-surface-container-low ring-on-surface-variant/15 inline-flex rounded-full px-2 py-1 text-center text-xs font-semibold ring-1 ring-inset',
        result.tone
      ]}>{result.label} vs previous</span
    >
  {/if}
{/snippet}

{#snippet metricButton(metric: TrackMetric, label: string)}
  <button
    type="button"
    class={['rounded-lg px-2 py-1', trackMetric === metric && 'bg-primary text-on-primary']}
    aria-pressed={trackMetric === metric}
    onclick={() => (trackMetric = metric)}>{label}</button
  >
{/snippet}

<div class="flex h-full min-h-0 w-full flex-col overflow-y-auto">
  <div class="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6 px-4 py-6 sm:px-8">
    <header class="flex flex-col gap-4">
      <div>
        <div
          class="text-primary mb-1 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase"
        >
          <RoundInsights /> Your listening
        </div>
        <h1 class="text-3xl font-bold tracking-tight">Analytics</h1>
        <p class="text-on-surface-variant mt-1">
          {selectedRange} · See what has been playing in your library.
        </p>
      </div>
      <div class="@container w-full">
        <div class="flex w-full flex-col gap-2 @lg:flex-row @lg:flex-wrap @lg:items-center">
          <div
            class="bg-surface-container flex w-full rounded-2xl p-1 @lg:w-auto"
            aria-label="Analytics view"
          >
            {@render viewTab('month', monthQuery, 'Month')}
            {@render viewTab('year', yearQuery, 'Year')}
          </div>
          {#if data.period.view === 'month'}
            <form
              method="GET"
              class="bg-surface-container grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-3xl p-1 @lg:flex @lg:w-auto"
            >
              <input type="hidden" name="view" value="month" />
              <select
                name="year"
                aria-label="Analytics year"
                class="bg-primary-container text-on-primary-container focus-visible:ring-primary w-full min-w-0 rounded-2xl border-none px-3 py-2 text-sm font-semibold outline-hidden focus-visible:ring-2 @lg:w-32"
                value={data.period.year}
              >
                {#each availableYears as year (year)}
                  <option value={year}>{year}</option>
                {/each}
              </select>
              <select
                name="month"
                aria-label="Analytics month"
                class="bg-primary-container text-on-primary-container focus-visible:ring-primary w-full min-w-0 rounded-2xl border-none px-3 py-2 text-sm font-semibold outline-hidden focus-visible:ring-2 @lg:w-40"
                value={selectedMonth}
              >
                {#each periodsForYear as period (period.month)}
                  <option value={period.month}>{periodLabel(period)}</option>
                {/each}
              </select>
              <button
                class="bg-primary text-on-primary rounded-2xl px-4 py-2 text-sm font-bold"
                type="submit">Apply</button
              >
            </form>
          {/if}
        </div>
      </div>
    </header>

    <section
      class="bg-surface-container relative isolate rounded-2xl p-4 sm:p-5"
      aria-labelledby="summary-heading"
    >
      <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div
          class="absolute -top-16 -right-10 size-48 rounded-full bg-(--primary) opacity-20 blur-3xl transition-colors duration-700 ease-in-out"
          style={schemeStyles[0] ?? undefined}
        ></div>
        <div
          class="absolute -bottom-5 -left-15 size-60 rounded-full bg-(--primary) opacity-20 blur-3xl transition-colors duration-700 ease-in-out"
          style={schemeStyles[1] ?? undefined}
        ></div>
        <div
          class="absolute right-0 -bottom-20 size-48 rounded-full bg-(--primary) opacity-20 blur-3xl transition-colors duration-700 ease-in-out lg:top-1/2 lg:right-1/3 lg:-translate-y-4"
          style={schemeStyles[2] ?? undefined}
        ></div>
      </div>
      <div class="relative z-10 flex h-auto flex-col">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="summary-heading" class="flex items-center gap-2 text-lg font-bold">
            <RoundInsights class="text-primary" /> Listening summary
          </h2>
          <div
            class="bg-surface-container-low flex rounded-xl p-1 text-xs font-semibold"
            role="group"
            aria-label="Metric used for the summary, heatmap, and featured rankings"
          >
            <span class="text-on-surface-variant px-2 py-1">Rank by</span>
            {@render metricButton('listeningTime', 'Listening time')}
            {@render metricButton('plays', 'Plays')}
          </div>
        </div>
        <div class="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div class="lg:min-h-24">
            <div class="text-on-surface-variant flex items-center gap-2 text-sm">
              <RoundPlaylistPlay class="text-primary" /> Plays
            </div>
            <p class="mt-1 text-2xl font-bold">{data.summary.plays.toLocaleString()}</p>
            {@render comparisonBadge(playsComparison)}
          </div>
          <div class="lg:min-h-24">
            <div class="text-on-surface-variant flex items-center gap-2 text-sm">
              <HistoryFill class="text-primary" /> Listening time
            </div>
            <p class="mt-1 text-2xl font-bold">{hours(data.summary.listeningTime)}</p>
            {@render comparisonBadge(listeningTimeComparison)}
          </div>
          <div>
            <div class="text-on-surface-variant flex items-center gap-2 text-sm">
              <RoundCalendarToday class="text-primary" /> Peak day
            </div>
            <p class="mt-1 text-lg font-bold">
              {peakDay ? formatDate(peakDay.date) : '—'}
            </p>
            <span class="text-on-surface-variant text-xs">
              {#if !peakDay}
                No listening yet
              {:else if trackMetric === 'plays'}
                {peakDay.plays.toLocaleString()} plays
              {:else}
                {getCompactDuration(peakDay.listeningTime)} listened
              {/if}
            </span>
          </div>
          <div>
            <div class="text-on-surface-variant flex items-center gap-2 text-sm">
              <RoundMusicNote class="text-primary" /> Tracks
            </div>
            <p class="mt-1 text-2xl font-bold">{data.summary.uniqueTracks.toLocaleString()}</p>
            <span class="text-on-surface-variant text-xs">unique tracks</span>
          </div>
          <div>
            <div class="text-on-surface-variant flex items-center gap-2 text-sm">
              <MusicArtistFill class="text-primary" /> Artists · Albums
            </div>
            <p class="mt-1 text-2xl font-bold">
              {data.summary.uniqueArtists.toLocaleString()} · {data.summary.uniqueAlbums.toLocaleString()}
            </p>
            <span class="text-on-surface-variant text-xs">unique each</span>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-surface-container rounded-2xl p-4 sm:p-5" aria-labelledby="heatmap-heading">
      <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 id="heatmap-heading" class="flex items-center gap-2 text-lg font-bold">
            <RoundCalendarToday class="text-primary" /> Listening activity
          </h2>
          <p class="text-on-surface-variant mt-1 text-sm">
            Daily {trackMetric === 'plays' ? 'plays' : 'listening time'}
          </p>
        </div>
        <div class="text-on-surface-variant flex items-center gap-2 text-xs">
          <span>Less</span>
          {#each [0, 1, 2, 3, 4] as level (level)}
            <span class={heatCellClass(level)}></span>
          {/each}
          <span>More</span>
        </div>
      </div>
      <div class="flex gap-2" aria-label="Listening activity calendar">
        <div
          class="flex flex-col items-center justify-end pb-2.5 sm:gap-0.5 sm:pb-2"
          aria-hidden="true"
        >
          {#each weekdays as weekday (weekday)}
            <span class="text-on-surface-variant flex items-center text-[0.65rem]">{weekday}</span>
          {/each}
        </div>
        <div class="overflow-x-auto pb-1">
          <div
            class="mb-1 grid min-w-max auto-cols-[0.75rem] grid-flow-col gap-1 px-1 sm:auto-cols-[0.9rem]"
            aria-hidden="true"
          >
            {#each heatmapMonths as month (month.column)}
              <span
                class="text-on-surface-variant text-[0.65rem] whitespace-nowrap"
                style:grid-column-start={month.column + 3}>{month.label}</span
              >
            {/each}
          </div>
          <div
            class="grid min-w-max auto-cols-[0.75rem] grid-flow-col grid-rows-7 gap-1 p-1 sm:auto-cols-[0.9rem]"
          >
            {#each heatmapCells as day, index (day?.date ?? `empty-${index}`)}
              {#if day}
                {@const value = day[trackMetric]}
                {@const dayDate = formatDate(day.date)}
                {@const dayPlays = day.plays.toLocaleString()}
                {@const dayDuration = getCompactDuration(day.listeningTime)}
                <button
                  type="button"
                  class={heatCellClass(heatLevel(value), selectedDay?.date === day.date)}
                  title={`${dayDate} · ${dayPlays} plays · ${dayDuration}`}
                  aria-label={`${dayDate}, ${dayPlays} plays, ${dayDuration}`}
                  aria-pressed={selectedDay?.date === day.date}
                  onclick={() => selectDay(day)}
                ></button>
              {:else}
                <span class="invisible size-3 flex-none sm:size-3.5"></span>
              {/if}
            {/each}
          </div>
        </div>
      </div>
      {#if selectedDay}
        <div
          transition:slide
          class="bg-surface-container-low mt-4 rounded-xl p-3"
          aria-live="polite"
        >
          <p class="text-sm font-semibold">{formatDate(selectedDay.date)}</p>
          <div class="text-on-surface-variant mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>{selectedDay.plays.toLocaleString()} plays</span>
            <span>{getCompactDuration(selectedDay.listeningTime)} listened</span>
          </div>
        </div>
      {/if}
    </section>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,min(24rem,50%))_minmax(0,1fr)]">
      <section
        class="bg-surface-container text-on-surface relative isolate min-w-0 rounded-2xl p-4 transition-colors duration-700 ease-in-out sm:p-5 lg:w-full lg:max-w-sm"
        style={schemeStyles[0] ?? undefined}
        aria-labelledby="featured-heading"
      >
        <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div
            class="bg-primary absolute -top-16 -right-10 size-48 rounded-full opacity-10 blur-3xl transition-colors duration-700 ease-in-out"
          ></div>
          <div
            class="bg-secondary absolute -bottom-20 -left-10 size-56 rounded-full opacity-10 blur-3xl transition-colors duration-700 ease-in-out"
          ></div>
        </div>
        <div class="relative z-10 mb-4 flex items-center justify-between gap-3">
          <h2 id="featured-heading" class="flex items-center gap-2 text-lg font-bold">
            <RoundMusicNote class="text-primary transition-colors duration-700 ease-in-out" /> Most listened
          </h2>
        </div>
        {#if featured}
          {@const featuredAlbum = {
            id: featured.albumId,
            title: featured.album,
            albumArtId: featured.albumArtId
          }}
          <div class="relative z-10 flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-5 lg:flex-col">
            <div
              class="size-28 flex-none overflow-hidden rounded-xl sm:size-44 lg:aspect-square lg:h-auto lg:max-h-80 lg:w-full lg:mask-[linear-gradient(to_bottom,black_0%,black_68%,transparent_100%)] lg:[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_68%,transparent_100%)] lg:[&_img]:object-top"
            >
              <AlbumImage album={featuredAlbum} maxSize="l" />
            </div>
            <div
              class="w-full min-w-0 flex-1 self-start sm:w-auto sm:self-end lg:w-full lg:self-start"
            >
              <p
                class="text-on-surface truncate text-xl font-bold transition-colors duration-700 ease-in-out sm:text-2xl"
              >
                {featured.name}
              </p>
              <p
                class="text-on-surface-variant mt-1 truncate transition-colors duration-700 ease-in-out"
              >
                {#if featured.artistId}
                  <a
                    class="hover:underline"
                    href={resolve(`/(app)/(authed)/artist/[id]`, { id: featured.artistId })}
                    >{featured.artist}</a
                  >
                {:else}
                  {featured.artist}
                {/if}
              </p>
              <p
                class="text-on-surface-variant truncate text-sm transition-colors duration-700 ease-in-out"
              >
                {#if featured.albumId}
                  <a
                    class="hover:underline"
                    href={resolve(`/(app)/(authed)/album/[id]`, { id: featured.albumId })}
                    >{featured.album}</a
                  >
                {:else}
                  {featured.album}
                {/if}
              </p>
              <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
                <span>{featured.plays.toLocaleString()} plays</span>
                <span>{getCompactDuration(featured.listeningTime)}</span>
              </div>
            </div>
          </div>
        {:else}
          <p class="text-on-surface-variant py-8 text-sm">No listening data for this period.</p>
        {/if}
      </section>

      <section
        class="bg-surface-container min-w-0 rounded-2xl p-4 sm:p-5 lg:w-full"
        aria-labelledby="tracks-heading"
      >
        <div class="mb-4 flex items-center gap-2">
          <RoundPlaylistPlay class="text-primary text-xl" />
          <h2 id="tracks-heading" class="text-lg font-bold">Top tracks</h2>
        </div>
        {#if otherTracks.length}
          <ol class="divide-on-surface-variant/10 divide-y">
            {#each otherTracks as item, index (item.id)}
              <RankedRow {item} kind="track" index={index + 1} metric={trackMetric} />
            {/each}
          </ol>
        {:else}
          <p class="text-on-surface-variant py-4 text-sm">No other tracks for this period.</p>
        {/if}
      </section>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      {#each rankedLists as list (list.id)}
        {@const Icon = list.icon}
        <section class="bg-surface-container rounded-2xl p-4 sm:p-5" aria-labelledby={list.id}>
          <div class="mb-4 flex items-center gap-2">
            <Icon class="text-primary text-xl" />
            <h2 id={list.id} class="text-lg font-bold">{list.title}</h2>
          </div>
          {#if list.items.length}
            <ol class="divide-on-surface-variant/10 divide-y">
              {#each list.items as item, index (item.id)}
                <RankedRow {item} kind={list.kind} {index} />
              {/each}
            </ol>
          {:else}
            <p class="text-on-surface-variant py-4 text-sm">No listening data for this period.</p>
          {/if}
        </section>
      {/each}
    </div>

    {#if data.period.view === 'year'}
      <section
        class="bg-surface-container @container w-full rounded-2xl p-4 sm:p-5"
        aria-labelledby="monthly-heading"
      >
        <div class="mb-5 flex items-center gap-2">
          <RoundInsights class="text-primary text-xl" />
          <h2 id="monthly-heading" class="text-lg font-bold">{data.period.year} at a glance</h2>
        </div>
        <div class="grid grid-cols-4 gap-2 @lg:grid-cols-6 @xl:grid-cols-12">
          {#each data.monthlyBreakdown as month (month.month)}
            {@const monthValue = month[trackMetric]}
            {@const monthHeight = `${Math.max((monthValue / monthlyMaximum) * 100, 2)}%`}
            {@const monthLabel = shortMonthFormatter.format(
              new Date(data.period.year, month.month - 1)
            )}
            {@const monthMetricLabel =
              trackMetric === 'plays'
                ? `${month.plays.toLocaleString()} plays`
                : getCompactDuration(month.listeningTime)}
            <div class="min-w-0">
              <div
                class="bg-surface-container-low mb-2 flex h-24 items-end rounded-lg p-1 @lg:h-32"
              >
                <div
                  class="bg-primary w-full rounded-md"
                  style:height={monthHeight}
                  title={monthMetricLabel}
                ></div>
              </div>
              <p class="text-center text-xs font-semibold">
                {monthLabel}
              </p>
              <p class="text-on-surface-variant text-center text-xs">
                {monthMetricLabel}
              </p>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>
