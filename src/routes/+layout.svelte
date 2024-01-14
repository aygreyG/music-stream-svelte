<script lang="ts">
  import { page } from '$app/stores';
  import '../app.css';
</script>

<svelte:head>
  <title>{$page.data.title ? $page.data.title + ' | ' : ''}Svelte Music Streamer</title>
</svelte:head>

<div class="flex h-[100dvh] w-full justify-center">
  <div class="flex h-full w-full flex-col overflow-hidden p-1">
    <slot />
  </div>
</div>
