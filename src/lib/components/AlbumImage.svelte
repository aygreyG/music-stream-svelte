<script lang="ts">
  import type { ImageSize } from '$lib/shared/types';

  export let id: string;
  export let alt: string;
  export let maxSize: ImageSize = 'l';
</script>

<picture class="w-full h-full flex">
  {#if maxSize === 's'}
    <source type="image/avif" srcset="/api/image/{id}/s/avif 150w" />
    <source type="image/webp" srcset="/api/image/{id}/s/webp 150w" />
    <img class="w-full h-full object-cover" src="/api/image/{id}/s" {alt} />
  {:else if maxSize === 'm'}
    <source type="image/avif" srcset="/api/image/{id}/s/avif 150w, /api/image/{id}/m/avif 200w" />
    <source type="image/webp" srcset="/api/image/{id}/s/webp 150w, /api/image/{id}/m/webp 200w" />
    <img
      class="w-full h-full object-cover"
      src="/api/image/{id}/s"
      srcset="/api/image/{id}/s 150w, /api/image/{id}/m 200w"
      {alt}
    />
  {:else}
    <source
      type="image/avif"
      srcset="/api/image/{id}/s/avif 150w, /api/image/{id}/m/avif 200w, /api/image/{id}/l/avif 300w"
    />
    <source
      type="image/webp"
      srcset="/api/image/{id}/s/webp 150w, /api/image/{id}/m/webp 200w, /api/image/{id}/l/webp 300w"
    />
    <img
      class="w-full h-full object-cover"
      src="/api/image/{id}/s"
      srcset="/api/image/{id}/s 150w, /api/image/{id}/m 200w, /api/image/{id}/l 300w"
      {alt}
    />
  {/if}
</picture>
