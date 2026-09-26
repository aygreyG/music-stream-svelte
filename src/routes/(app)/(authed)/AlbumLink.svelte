<script lang="ts">
  import { fromAction } from 'svelte/attachments';
  import { quintOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';

  import { resolve } from '$app/paths';
  import { observeVisibility } from '$lib/actions/observeVisibility';
  import { vibrate } from '$lib/actions/vibrate';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { getExpressiveScheme, schemeToCSS } from '$lib/materialColors';

  import RoundChevronRight from '~icons/ic/round-chevron-right';

  import type { PageData } from './$types';

  const DELAY = 20;

  interface Props {
    album: PageData['albums'][0];
    view?: 'grid' | 'list';
    index?: number;
    first?: number;
  }

  let { album, view = 'grid', index, first }: Props = $props();
  let visible = $state(false);
  let schemeStyle = $state('');
  let delay = $derived.by(() => {
    if (index === undefined) return DELAY;
    return first === undefined ? DELAY * index : Math.abs(index - first) * DELAY;
  });

  async function reveal() {
    if (visible) return;
    visible = true;
    schemeStyle = schemeToCSS(await getExpressiveScheme(album.id, album.albumArtId || ''));
  }
</script>

<div class="h-full w-full">
  <a
    {@attach !visible && fromAction(observeVisibility, () => ({ onVisible: reveal }))}
    {@attach fromAction(vibrate, () => undefined)}
    onfocus={reveal}
    class={[
      'focus-visible:outline-primary relative block h-full w-full transition-opacity duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid',
      !visible && 'opacity-0',
      view === 'grid' && 'aspect-square'
    ]}
    href={resolve(`/(app)/(authed)/album/[id]`, { id: album.id })}
    aria-label={`${album.title} by ${album.albumArtist.name}`}
  >
    {#if visible}
      <div
        class={[
          'bg-surface-container text-on-surface absolute inset-0 overflow-hidden',
          view === 'list' ? 'flex items-center gap-4 rounded-[20px] p-2' : 'rounded-xl',
          !album.albumArtId && 'bg-zinc-900'
        ]}
        style={schemeStyle}
        in:scale={{ duration: 360, delay, easing: quintOut, start: 0.94 }}
      >
        <div class={['pointer-events-none absolute inset-0', view === 'list' && 'opacity-20']}>
          <AlbumImage {album} maxSize={view === 'list' ? 's' : 'l'} blur={view === 'list'} />
        </div>
        {#if view === 'grid'}
          <div
            class="absolute inset-x-0 bottom-0 flex flex-col gap-0.75 px-1 pt-5 pb-2 text-center"
          >
            <div class="relative w-full overflow-hidden rounded-[10px]">
              <div class="pointer-events-none absolute inset-0 [&_img]:object-bottom">
                <AlbumImage {album} maxSize="s" blur />
              </div>
              <div class="bg-surface/80 relative z-10 w-full truncate px-2 font-bold">
                {album.title}
              </div>
            </div>
            <div class="relative w-full overflow-hidden rounded-[9px]">
              <div class="pointer-events-none absolute inset-0 [&_img]:object-bottom">
                <AlbumImage {album} maxSize="s" blur />
              </div>
              <div
                class="bg-surface/80 text-on-surface-variant relative z-10 w-full truncate px-1 text-xs"
              >
                {album.albumArtist.name}
              </div>
            </div>
          </div>
        {:else}
          <div
            class="bg-surface-container relative z-10 size-14.5 shrink-0 overflow-hidden rounded-[14px]"
          >
            <AlbumImage {album} maxSize="s" />
          </div>
          <div class="z-10 min-w-0 flex-1">
            <div class="truncate font-bold">{album.title}</div>
            <div class="text-on-surface-variant truncate text-xs">{album.albumArtist.name}</div>
          </div>
          <RoundChevronRight class="text-on-surface-variant z-10 flex-none text-2xl" />
        {/if}
      </div>
    {/if}
  </a>
</div>
