<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { beforeNavigate } from '$app/navigation';
  import { vibrate } from '$lib/actions/vibrate';
  import SearchBar from '$lib/components/SearchBar.svelte';

  import RoundGridView from '~icons/ic/round-grid-view';
  import RoundViewList from '~icons/ic/round-view-list';

  import type { PageData } from './$types';
  import AlbumLink from './AlbumLink.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let container: HTMLDivElement | null = $state(null);
  let searchString = $state('');
  let debouncedSearch = $state('');
  let view = $state<'grid' | 'list'>('grid');
  let scrolledFromTop = $state(false);
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

  let filtered = $derived(
    data.albums.filter((album) => {
      const query = debouncedSearch.trim().toLowerCase();
      return (
        !query ||
        album.title.toLowerCase().includes(query) ||
        album.albumArtist.name.toLowerCase().includes(query)
      );
    })
  );

  function onSearchInput() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      debouncedSearch = searchString;
      resetScroll();
    }, 250);
  }

  function resetScroll() {
    scrolledFromTop = false;
    if (container) container.scrollTop = 0;
  }

  function setView(nextView: 'grid' | 'list') {
    if (view === nextView) return;
    view = nextView;
    resetScroll();
    if (typeof localStorage !== 'undefined') localStorage.setItem('dashboard-album-view', nextView);
  }

  function onScroll() {
    if (!container) return;
    scrolledFromTop = container.scrollTop > 0;
  }

  function attachContainer(node: HTMLDivElement) {
    container = node;
    return () => {
      if (container === node) container = null;
    };
  }

  onMount(() => {
    const savedView = localStorage.getItem('dashboard-album-view');
    if (savedView === 'grid' || savedView === 'list') view = savedView;
    const savedScroll = Number.parseInt(localStorage.getItem('dashboard-scroll') ?? '0', 10);
    const scrollRestoreFrame = requestAnimationFrame(() => {
      if (!container) return;
      container.scrollTop = Number.isNaN(savedScroll) ? 0 : savedScroll;
      onScroll();
    });
    return () => {
      cancelAnimationFrame(scrollRestoreFrame);
      clearTimeout(debounceTimeout);
    };
  });

  beforeNavigate(() => {
    if (container) localStorage.setItem('dashboard-scroll', String(container.scrollTop));
  });
</script>

<div class="bg-surface absolute inset-0 flex flex-col overflow-hidden">
  <div
    class="flex items-center justify-center px-5 py-2 sm:px-8"
    in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
  >
    <div class="text-center text-xl font-bold">Albums</div>
    <div
      class="bg-surface-container absolute top-2 right-2 flex rounded-full p-1 text-sm"
      role="group"
      aria-label="Album view"
    >
      <button
        class={[
          'grid size-6 place-items-center rounded-full transition-colors',
          view === 'grid' && 'bg-primary-container text-on-primary-container',
          view === 'list' && 'hover:text-primary text-on-surface-variant'
        ]}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        onclick={() => setView('grid')}
        use:vibrate
      >
        <RoundGridView />
      </button>
      <button
        class={[
          'grid size-6 place-items-center rounded-full transition-colors',
          view === 'list' && 'bg-primary-container text-on-primary-container',
          view === 'grid' && 'hover:text-primary text-on-surface-variant'
        ]}
        aria-label="List view"
        aria-pressed={view === 'list'}
        onclick={() => setView('list')}
        use:vibrate
      >
        <RoundViewList />
      </button>
    </div>
  </div>

  <div
    class={[
      'flex w-full flex-col px-8 py-1 transition-shadow duration-300',
      scrolledFromTop && 'shadow-md'
    ]}
  >
    <SearchBar bind:value={searchString} oninput={onSearchInput} placeholder="Search" />
  </div>

  <div
    class="@container min-h-0 overflow-auto overscroll-contain px-5 pt-2 pb-8 sm:px-8"
    {@attach attachContainer}
    onscroll={onScroll}
  >
    <div
      class={[
        'mx-auto grid w-full max-w-[1800px] justify-center',
        view === 'grid'
          ? 'grid-cols-[repeat(auto-fill,minmax(min(100%,clamp(120px,18vw,220px)),1fr))] gap-4 @md:gap-6'
          : 'grid-cols-1 gap-2'
      ]}
    >
      {#each filtered as album (album.id)}
        <div
          animate:flip={{ easing: quintOut, duration: 150 }}
          class={['min-w-0', view === 'list' ? 'h-18.5' : 'aspect-square']}
        >
          <AlbumLink {album} {view} />
        </div>
      {/each}
    </div>
    {#if filtered.length === 0}
      <div class="text-on-surface-variant grid h-40 place-items-center text-center">
        No albums found
      </div>
    {/if}
  </div>
</div>
