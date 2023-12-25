<script lang="ts">
  import { page } from '$app/stores';
  import '../app.css';
</script>

<svelte:head>
  <title>{$page.data.title ? $page.data.title + ' | ' : ''}Svelte Music Streamer</title>
</svelte:head>

<div class="h-[100dvh] w-full flex justify-center">
  <div class="h-full w-full flex flex-col overflow-hidden p-1">
    <slot />
  </div>
</div>
