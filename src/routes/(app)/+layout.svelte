<script lang="ts">
  import type { Snippet } from 'svelte';

  import AudioPlayer from '$lib/components/AudioPlayer';
  import NavBar from '$lib/components/NavBar.svelte';

  import type { PageData } from './(authed)/$types';

  interface Props {
    data: PageData;
    children?: Snippet;
  }

  let { data, children }: Props = $props();
</script>

<div class="flex h-full w-full flex-col gap-1">
  <div class="flex min-h-0 flex-1 gap-1">
    <NavBar user={data.user} />
    <div
      class="bg-surface h-full min-w-0 flex-1 overflow-hidden rounded-xl transition-colors duration-500"
    >
      {@render children?.()}
    </div>
  </div>
  <div class="h-44 flex-none sm:h-32">
    <AudioPlayer user={data.user} />
  </div>
</div>
