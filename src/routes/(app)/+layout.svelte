<script lang="ts">
  import AudioPlayer from '$lib/components/AudioPlayer';
  import NavBar from '$lib/components/NavBar.svelte';
  import type { Snippet } from 'svelte';
  import type { PageData } from './(authed)/$types';

  interface Props {
    data: PageData;
    children?: Snippet;
  }

  let { data, children }: Props = $props();
</script>

<div class="flex h-full w-full gap-1">
  <NavBar user={data.user} />
  <div
    class="sm:h-sm:max-w-[calc(100%-12.25rem)] flex h-full w-full flex-col gap-1 sm:max-w-[calc(100%-12.25rem)] md:max-w-[calc(100%-15.25rem)]"
  >
    <div class="bg-surface h-full w-full overflow-hidden rounded-xl transition-colors duration-500">
      {@render children?.()}
    </div>
    <div class="h-44 flex-none sm:h-28">
      <AudioPlayer user={data.user} />
    </div>
  </div>
</div>
