<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { resolve } from '$app/paths';
  import { observeVisibility } from '$lib/actions/observeVisibility';

  import type { PageData } from './$types';

  interface Props {
    tag: PageData['tags'][0];
    index: number;
    scrolled: boolean;
  }

  let { tag, index, scrolled }: Props = $props();

  let animate: boolean = $state(false);
  let delay = $derived.by(() => {
    if (scrolled) {
      return 0;
    }
    return 30 * index;
  });

  let albumCount = $derived.by(() => {
    let tmp = '(';
    tmp += `${tag.albumCount} album`;
    if (tag.albumCount !== 1) {
      tmp += 's';
    }
    tmp += ')';
    return tmp;
  });
</script>

{#if animate}
  <a
    class="flex justify-between gap-2 from-zinc-600/10 px-4 py-2 transition-colors hover:bg-linear-to-r"
    in:fly={{ duration: 300, easing: quintOut, x: -20, delay }}
    href={resolve(`/(app)/(authed)/tag/[id]`, { id: tag.id })}
  >
    <div>
      {tag.name}
    </div>
    <div class="text-right text-balance">
      {albumCount}
    </div>
  </a>
{:else}
  <a
    class="flex justify-between gap-2 p-2 pl-4 opacity-0"
    use:observeVisibility={{
      onVisible: () => {
        animate = true;
      }
    }}
    href={resolve(`/(app)/(authed)/tag/[id]`, { id: tag.id })}
  >
    <div>
      {tag.name}
    </div>
    <div>
      {albumCount}
    </div>
  </a>
{/if}
