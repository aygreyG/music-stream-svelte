<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';

  import { vibrate } from '$lib/actions/vibrate';

  import RoundClose from '~icons/ic/round-close';

  interface Props {
    title?: string;
    children?: Snippet;
    onclose?: () => void;
  }

  let { title = '', children, onclose }: Props = $props();

  $effect(() => {
    function keyDownListener(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onclose?.();
      }
    }
    document.addEventListener('keydown', keyDownListener);
    return () => document.removeEventListener('keydown', keyDownListener);
  });
</script>

<div
  transition:fade={{ duration: 200 }}
  class="bg-surface/50 absolute inset-0 z-10 flex items-center justify-center p-4 backdrop-blur-sm sm:p-8"
  aria-modal="true"
>
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="absolute inset-0" onclick={() => onclose?.()}></div>

  <!-- Dialog -->
  <div
    in:fly={{ y: 20, duration: 250, easing: cubicOut }}
    out:fly={{ y: 10, duration: 150, easing: cubicIn }}
    class="bg-surface-container relative z-10 flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl"
  >
    <!-- Header -->
    <div class="border-outline-variant/50 flex flex-none items-center gap-3 border-b px-5 py-4">
      <h2 class="text-on-surface min-w-0 flex-1 text-lg font-semibold">{title}</h2>
      {#if onclose}
        <!-- svelte-ignore a11y_autofocus -->
        <button
          aria-label="Close"
          autofocus
          use:vibrate
          onclick={() => onclose?.()}
          class="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 flex shrink-0 items-center justify-center rounded-full p-1 transition-colors"
        >
          <RoundClose class="text-xl" />
        </button>
      {/if}
    </div>

    <!-- Scrollable content -->
    <div class="min-h-0 flex-1 overflow-auto">
      {@render children?.()}
    </div>
  </div>
</div>
