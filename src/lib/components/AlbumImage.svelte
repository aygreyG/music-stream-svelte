<script lang="ts">
  import type { ImageSize } from '$lib/shared/types';
  import type { Prisma } from '../../generated/prisma-client/client';

  interface Props {
    album: Prisma.AlbumGetPayload<{
      select: {
        albumArtId: true;
        id: true;
        title: true;
        albumArtDarkMuted: true;
        albumArtVibrant: true;
        albumArtMuted: true;
        albumArtLightVibrant: true;
        albumArtLightMuted: true;
        albumArtDarkVibrant: true;
      };
    }>;
    maxSize?: ImageSize;
    blur?: boolean;
    key?: string | null;
  }

  let { album, maxSize = 'l', blur = false, key = '' }: Props = $props();
</script>

<div class="h-full w-full" class:bg-zinc-900={!album.albumArtDarkMuted && !blur}>
  <!-- Background color when the album art is not loaded in it is smaller to make sure no white lines are visible on rounded corners -->
  <div
    class="absolute inset-0 ml-[0.5px] mt-[0.5px] h-[calc(100%-1px)] w-[calc(100%-1px)] rounded-xl"
    style={album.albumArtDarkMuted && !blur ? `background-color: ${album.albumArtDarkMuted}` : ''}
  ></div>
  <picture class="h-full w-full">
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
