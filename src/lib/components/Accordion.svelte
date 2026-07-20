<script lang="ts">
  import type { Snippet } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';

  import { vibrate } from '$lib/actions/vibrate';

  import RoundArrowDropUp from '~icons/ic/round-arrow-drop-up';

  interface Props {
    title?: string;
    delay?: number;
    children?: Snippet;
    /**
     * This makes transitions weird, only use if necessary
     */
    defaultOpen?: boolean;
    class?: string;
  }

  let {
    title = 'Open!',
    delay = 0,
    children,
    defaultOpen = false,
    class: className = ''
  }: Props = $props();
  // svelte-ignore state_referenced_locally
  let show = $state(defaultOpen);
</script>

<button
  class={[
    'bg-surface-container hover:bg-surface-container/60 mt-4 flex w-full items-center justify-between rounded-t-xl p-2 pl-4 text-xl font-bold transition-all',
    show ? 'shadow-md' : 'rounded-b-xl',
    className
  ]}
  in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay }}
  onclick={() => {
    show = !show;
  }}
  use:vibrate
>
  {title}
  <RoundArrowDropUp class={['text-3xl transition-transform duration-300', !show && 'rotate-180']} />
</button>

{#if show}
  <div
    transition:slide={{ duration: 300, easing: quintOut }}
    class="w-full flex-none rounded-b-xl bg-zinc-600/10"
  >
    {@render children?.()}
  </div>
{/if}
