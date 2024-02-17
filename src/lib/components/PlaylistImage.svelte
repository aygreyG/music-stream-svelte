<script lang="ts">
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import type { Album } from '@prisma/client';

  export let albumSet: Album[];
</script>

{#if albumSet.length > 0}
  {#if albumSet.length === 1}
    <div class="aspect-square h-full">
      <AlbumImage alt={albumSet[0].title} id={albumSet[0].id} maxSize="l" />
    </div>
  {:else}
    <div class="flex aspect-square h-full flex-wrap">
      <div class="aspect-square w-1/2 bg-zinc-600/20 bg-clip-content pb-0.5 pr-0.5">
        <AlbumImage alt={albumSet[0].title} id={albumSet[0].id} maxSize="s" />
      </div>
      <div class="aspect-square w-1/2 bg-zinc-600/20 bg-clip-content pb-0.5 pl-0.5">
        {#if albumSet.length > 1}
          <AlbumImage alt={albumSet[1].title} id={albumSet[1].id} maxSize="s" />
        {/if}
      </div>
      <div class="aspect-square w-1/2 bg-zinc-600/20 bg-clip-content pr-0.5 pt-0.5">
        {#if albumSet.length > 2}
          <AlbumImage alt={albumSet[2].title} id={albumSet[2].id} maxSize="s" />
        {/if}
      </div>
      <div class="aspect-square w-1/2 bg-zinc-600/20 bg-clip-content pl-0.5 pt-0.5">
        {#if albumSet.length > 3}
          <AlbumImage alt={albumSet[3].title} id={albumSet[3].id} maxSize="s" />
        {/if}
      </div>
    </div>
  {/if}
{:else}
  <div class="aspect-square h-full bg-zinc-600/20"></div>
{/if}
