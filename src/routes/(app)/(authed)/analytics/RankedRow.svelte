<script lang="ts">
  import { resolve } from '$app/paths';
  import { vibrate } from '$lib/actions/vibrate';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import type { RankedItem } from '$lib/shared/types';
  import { getCompactDuration } from '$lib/utils';

  interface Props {
    item: RankedItem;
    kind: 'track' | 'artist' | 'album';
    index: number;
    metric?: 'plays' | 'listeningTime';
  }

  let { item, kind, index, metric = 'plays' }: Props = $props();

  let album = $derived({
    id: item.albumId ?? item.id,
    title: item.album ?? item.name,
    albumArtId: item.albumArtId ?? null
  });
  let metricValue = $derived(
    metric === 'plays' ? item.plays.toLocaleString() : getCompactDuration(item.listeningTime)
  );
  let metricLabel = $derived(metric === 'plays' ? 'plays' : 'listened');
</script>

<li
  class={[
    'grid min-w-0 items-center gap-2 sm:gap-3',
    kind === 'artist'
      ? 'grid-cols-[auto_minmax(0,1fr)_auto] py-3 first:pt-0 last:pb-0'
      : 'grid-cols-[auto_auto_minmax(0,1fr)_auto] py-2 first:pt-0 last:pb-0'
  ]}
>
  <span class="text-primary w-5 text-sm font-bold">{index + 1}</span>
  {#if kind !== 'artist'}
    <div class="size-10 flex-none overflow-hidden rounded-md sm:size-12">
      <AlbumImage {album} maxSize="s" />
    </div>
  {/if}
  <div class="min-w-0 flex-1">
    {#if kind === 'artist'}
      <a
        use:vibrate
        class="text-on-surface hover:text-primary block truncate font-semibold hover:underline"
        href={resolve(`/(app)/(authed)/artist/[id]`, { id: item.id })}>{item.name}</a
      >
    {:else if kind === 'album'}
      <a
        use:vibrate
        class="text-on-surface hover:text-primary block truncate font-semibold hover:underline"
        href={resolve(`/(app)/(authed)/album/[id]`, { id: item.id })}>{item.name}</a
      >
    {:else}
      <p class="text-on-surface block truncate font-semibold">{item.name}</p>
    {/if}
    {#if kind === 'track'}
      <div class="text-on-surface-variant flex min-w-0 gap-1 text-sm">
        {#if item.artistId}
          <a
            use:vibrate
            class="min-w-0 truncate hover:underline"
            href={resolve(`/(app)/(authed)/artist/[id]`, { id: item.artistId })}>{item.artist}</a
          >
        {:else}
          <span class="min-w-0 truncate">{item.artist}</span>
        {/if}
        <span aria-hidden="true">·</span>
        {#if item.albumId}
          <a
            use:vibrate
            class="min-w-0 truncate hover:underline"
            href={resolve(`/(app)/(authed)/album/[id]`, { id: item.albumId })}>{item.album}</a
          >
        {:else}
          <span class="min-w-0 truncate">{item.album}</span>
        {/if}
      </div>
    {:else if item.artistId}
      <a
        use:vibrate
        class="text-on-surface-variant block truncate text-sm hover:underline"
        href={resolve(`/(app)/(authed)/artist/[id]`, { id: item.artistId })}>{item.artist}</a
      >
    {:else if item.artist}
      <p class="text-on-surface-variant truncate text-sm">{item.artist}</p>
    {/if}
  </div>
  <div class="text-on-surface text-right text-sm">
    <p class="font-bold">{metricValue}</p>
    <p class="text-on-surface-variant">{metricLabel}</p>
  </div>
</li>
