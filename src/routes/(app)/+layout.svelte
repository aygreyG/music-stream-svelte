<script lang="ts">
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import NavBar from '$lib/components/NavBar.svelte';
  import { fade } from 'svelte/transition';

  export let data;
  let transitionduration = 200;
</script>

<div class="flex gap-1 h-[calc(100%-11rem)] pb-1">
  <NavBar user={data.user} />
  <div class="sm:w-8/12 xl:w-9/12 w-full bg-zinc-900/95 rounded-md h-full overflow-hidden">
    {#key data.url}
      <div
        class="w-full h-full"
        in:fade={{ delay: transitionduration, duration: transitionduration }}
        out:fade={{ duration: transitionduration }}
      >
        <slot />
      </div>
    {/key}
  </div>
</div>
<div class="h-44">
  <AudioPlayer user={data.user} />
</div>
