<script lang="ts">
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import NavBar from '$lib/components/NavBar.svelte';
  import { fly } from 'svelte/transition';

  export let data;
</script>

<div class="flex gap-1 h-[calc(100%-11rem)] pb-1">
  <NavBar user={data.user} />
  <div class="sm:w-8/12 xl:w-9/12 w-full bg-zinc-900/95 rounded-md h-full overflow-hidden">
    {#key data.url}
      <div
        class="w-full h-full"
        in:fly={{ opacity: 0, delay: 200, duration: 200 }}
        out:fly={{ opacity: 0, duration: 200 }}
      >
        <slot />
      </div>
    {/key}
  </div>
</div>
<div class="h-44">
  <AudioPlayer user={data.user} />
</div>
