<script lang="ts">
  import type { ImageSize } from '$lib/shared/types';
  import type { Prisma } from '@prisma/client';

  interface Props {
    album: Prisma.AlbumGetPayload<{
      select: { albumArtAccent: true; albumArtId: true; id: true; title: true };
    }>;
    maxSize?: ImageSize;
    blur?: boolean;
    key?: string | null;
  }

  let { album, maxSize = 'l', blur = false, key = '' }: Props = $props();
</script>

<div
  class="h-full w-full"
  style={album.albumArtAccent && !blur ? `background-color: ${album.albumArtAccent}` : ''}
  class:bg-zinc-900={!album.albumArtAccent && !blur}
>
  <picture class="flex h-full w-full">
    {#key key}
      {#if album.albumArtId}
        {#if maxSize === 's'}
          <source
            type="image/avif"
            srcset="/api/image/{album.id}/{album.albumArtId}/s/avif{blur ? '?blur=true' : ''} 150w"
          />
          <source
            type="image/webp"
            srcset="/api/image/{album.id}/{album.albumArtId}/s/webp{blur ? '?blur=true' : ''} 150w"
          />
          <img
            class="h-full w-full object-cover"
            src="/api/image/{album.id}/{album.albumArtId}/s{blur ? '?blur=true' : ''}"
            alt={album.title}
          />
        {:else if maxSize === 'm'}
          <source
            type="image/avif"
            srcset="/api/image/{album.id}/{album.albumArtId}/s/avif{blur
              ? '?blur=true'
              : ''} 150w, /api/image/{album.id}/{album.albumArtId}/m/avif{blur
              ? '?blur=true'
              : ''} 200w"
          />
          <source
            type="image/webp"
            srcset="/api/image/{album.id}/{album.albumArtId}/s/webp{blur
              ? '?blur=true'
              : ''} 150w, /api/image/{album.id}/{album.albumArtId}/m/webp{blur
              ? '?blur=true'
              : ''} 200w"
          />
          <img
            class="h-full w-full object-cover"
            src="/api/image/{album.id}/{album.albumArtId}/s{blur ? '?blur=true' : ''}"
            srcset="/api/image/{album.id}/{album.albumArtId}/s{blur
              ? '?blur=true'
              : ''} 150w, /api/image/{album.id}/{album.albumArtId}/m{blur ? '?blur=true' : ''} 200w"
            alt={album.title}
          />
        {:else}
          <source
            type="image/avif"
            srcset="/api/image/{album.id}/{album.albumArtId}/s/avif{blur
              ? '?blur=true'
              : ''} 150w, /api/image/{album.id}/{album.albumArtId}/m/avif{blur
              ? '?blur=true'
              : ''} 200w, /api/image/{album.id}/{album.albumArtId}/l/avif{blur
              ? '?blur=true'
              : ''} 300w"
          />
          <source
            type="image/webp"
            srcset="/api/image/{album.id}/{album.albumArtId}/s/webp{blur
              ? '?blur=true'
              : ''} 150w, /api/image/{album.id}/{album.albumArtId}/m/webp{blur
              ? '?blur=true'
              : ''} 200w, /api/image/{album.id}/{album.albumArtId}/l/webp{blur
              ? '?blur=true'
              : ''} 300w"
          />
          <img
            class="h-full w-full object-cover"
            src="/api/image/{album.id}/{album.albumArtId}/s{blur ? '?blur=true' : ''}"
            srcset="/api/image/{album.id}/{album.albumArtId}/s{blur
              ? '?blur=true'
              : ''} 150w, /api/image/{album.id}/{album.albumArtId}/m{blur
              ? '?blur=true'
              : ''} 200w, /api/image/{album.id}/{album.albumArtId}/l{blur ? '?blur=true' : ''} 300w"
            alt={album.title}
          />
        {/if}
      {:else}
        <img
          class="h-full w-full object-cover"
          src={blur ? '/album_sm_blur.png' : '/album.png'}
          alt={album.title}
        />
      {/if}
    {/key}
  </picture>
</div>
