<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { resolve } from '$app/paths';

  import RoundLabel from '~icons/ic/round-label';

  import type { PageData } from './$types';

  interface Props {
    tag: PageData['tags'][0];
    index: number;
  }

  let { tag, index }: Props = $props();
</script>

<a
  class="bg-surface-container hover:bg-surface-container/60 flex items-center gap-2 rounded-xl p-4 transition-colors"
  href={resolve(`/(app)/(authed)/tag/[id]`, { id: tag.id })}
  in:fly|global={{ duration: 300, easing: quintOut, x: -20, delay: 30 * index }}
>
  <RoundLabel class="flex-none text-2xl" />
  <div class="flex flex-col">
    <div class="font-bold">
      {tag.name}
    </div>
    <div class="text-xs text-balance">
      {tag.albumCount} album{tag.albumCount !== 1 ? 's' : ''}
    </div>
  </div>
</a>
