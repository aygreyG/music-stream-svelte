<script lang="ts">
  import type { ImageSize } from '$lib/shared/types';

  export let id: string;
  export let artId: string | null;
  export let alt: string;
  export let maxSize: ImageSize = 'l';
  export let blur: boolean = false;
  export let key: string | null = '';
</script>

<picture class="flex h-full w-full">
  {#key key}
    {#if artId}
      {#if maxSize === 's'}
        <source
          type="image/avif"
          srcset="/api/image/{id}/{artId}/s/avif{blur ? '?blur=true' : ''} 150w"
        />
        <source
          type="image/webp"
          srcset="/api/image/{id}/{artId}/s/webp{blur ? '?blur=true' : ''} 150w"
        />
        <img
          class="h-full w-full object-cover"
          src="/api/image/{id}/{artId}/s{blur ? '?blur=true' : ''}"
          {alt}
        />
      {:else if maxSize === 'm'}
        <source
          type="image/avif"
          srcset="/api/image/{id}/{artId}/s/avif{blur
            ? '?blur=true'
            : ''} 150w, /api/image/{id}/{artId}/m/avif{blur ? '?blur=true' : ''} 200w"
        />
        <source
          type="image/webp"
          srcset="/api/image/{id}/{artId}/s/webp{blur
            ? '?blur=true'
            : ''} 150w, /api/image/{id}/{artId}/m/webp{blur ? '?blur=true' : ''} 200w"
        />
        <img
          class="h-full w-full object-cover"
          src="/api/image/{id}/{artId}/s{blur ? '?blur=true' : ''}"
          srcset="/api/image/{id}/{artId}/s{blur
            ? '?blur=true'
            : ''} 150w, /api/image/{id}/{artId}/m{blur ? '?blur=true' : ''} 200w"
          {alt}
        />
      {:else}
        <source
          type="image/avif"
          srcset="/api/image/{id}/{artId}/s/avif{blur
            ? '?blur=true'
            : ''} 150w, /api/image/{id}/{artId}/m/avif{blur
            ? '?blur=true'
            : ''} 200w, /api/image/{id}/{artId}/l/avif{blur ? '?blur=true' : ''} 300w"
        />
        <source
          type="image/webp"
          srcset="/api/image/{id}/{artId}/s/webp{blur
            ? '?blur=true'
            : ''} 150w, /api/image/{id}/{artId}/m/webp{blur
            ? '?blur=true'
            : ''} 200w, /api/image/{id}/{artId}/l/webp{blur ? '?blur=true' : ''} 300w"
        />
        <img
          class="h-full w-full object-cover"
          src="/api/image/{id}/{artId}/s{blur ? '?blur=true' : ''}"
          srcset="/api/image/{id}/{artId}/s{blur
            ? '?blur=true'
            : ''} 150w, /api/image/{id}/{artId}/m{blur
            ? '?blur=true'
            : ''} 200w, /api/image/{id}/{artId}/l{blur ? '?blur=true' : ''} 300w"
          {alt}
        />
      {/if}
    {:else}
      <img
        class="h-full w-full object-cover"
        src={blur ? '/album_sm_blur.png' : '/album.png'}
        {alt}
      />
    {/if}
  {/key}
</picture>
