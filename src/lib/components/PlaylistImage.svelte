<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import type { Prisma } from '../../generated/prisma-client/client';

  interface Props {
    albumSet: Prisma.AlbumGetPayload<{
      select: {
        id: true;
        title: true;
        albumArtId: true;
        albumArtDarkMuted: true;
        albumArtVibrant: true;
        albumArtMuted: true;
        albumArtLightVibrant: true;
        albumArtLightMuted: true;
        albumArtDarkVibrant: true;
      };
    }>[];
  }

  let { albumSet }: Props = $props();
</script>

{#if albumSet.length > 0}
  {#if albumSet.length === 1}
    <div class="aspect-square h-full bg-zinc-600/20">
      <AlbumImage album={albumSet[0]} maxSize="l" />
    </div>
  {:else}
    <div class="flex aspect-square h-full flex-wrap">
      <div class="aspect-square w-1/2 bg-zinc-600/20 bg-clip-content pr-0.5 pb-0.5">
        <AlbumImage album={albumSet[0]} maxSize="s" />
      </div>
      <div class="aspect-square w-1/2 bg-zinc-600/20 bg-clip-content pb-0.5 pl-0.5">
        {#if albumSet.length > 1}
          <AlbumImage album={albumSet[1]} maxSize="s" />
        {/if}
      </div>
      <div class="aspect-square w-1/2 bg-zinc-600/20 bg-clip-content pt-0.5 pr-0.5">
        {#if albumSet.length > 2}
          <AlbumImage album={albumSet[2]} maxSize="s" />
        {/if}
      </div>
      <div class="aspect-square w-1/2 bg-zinc-600/20 bg-clip-content pt-0.5 pl-0.5">
        {#if albumSet.length > 3}
          <AlbumImage album={albumSet[3]} maxSize="s" />
        {/if}
      </div>
    </div>
  {/if}
{:else}
  <div class="aspect-square h-full bg-zinc-600/20"></div>
{/if}
