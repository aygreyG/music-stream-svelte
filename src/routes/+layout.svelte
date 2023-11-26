<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import NavBar from '$lib/components/NavBar.svelte';
  import '../app.css';

  onNavigate((navigation) => {
    if (!document.startViewTransition || navigation.from?.route.id === navigation.to?.route.id)
      return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  export let data;
</script>

<div class="h-[100dvh] w-full flex justify-center">
  <div class="h-full w-full flex flex-col overflow-hidden p-1">
    <div class="flex gap-1 h-[calc(100%-11rem)] pb-1">
      <NavBar user={data.user} />
      <div class="sm:w-8/12 xl:w-9/12 w-full bg-zinc-900/95 rounded-md h-full overflow-hidden">
        <slot />
      </div>
    </div>
    <div class="h-44">
      <AudioPlayer user={data.user} />
    </div>
  </div>
</div>
