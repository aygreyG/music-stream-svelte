<script lang="ts">
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import NavBar from '$lib/components/NavBar.svelte';

  export let data;
</script>

<div class="flex h-full w-full gap-1">
  <NavBar user={data.user} />
  <div
    class="flex h-full w-full flex-col gap-1 sm:max-w-[calc(100%-12.25rem)] md:max-w-[calc(100%-15.25rem)] sm:h-sm:max-w-[calc(100%-12.25rem)]"
  >
    <div class="h-full w-full overflow-hidden rounded-md bg-zinc-900/95">
      <slot />
    </div>
    <div class="max-sm:h-44 flex-none sm:h-28">
      <AudioPlayer user={data.user} />
    </div>
  </div>
</div>
