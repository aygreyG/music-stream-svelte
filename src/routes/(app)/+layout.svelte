<script lang="ts">
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import NavBar from '$lib/components/NavBar.svelte';

  export let data;
</script>

<div class="flex h-[calc(100%-11rem)] gap-1 pb-1">
  <NavBar user={data.user} />
  <div class="h-full w-full overflow-hidden rounded-md bg-zinc-900/95 sm:w-8/12 xl:w-9/12">
    <slot />
  </div>
</div>
<div class="h-44">
  <AudioPlayer user={data.user} />
</div>
