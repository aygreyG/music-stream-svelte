<script lang="ts">
  import { fade } from 'svelte/transition';
  import { cubicIn } from 'svelte/easing';
  import { onMount, type Snippet } from 'svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import RoundClose from '~icons/ic/round-close';

  interface Props {
    title?: string;
    children?: Snippet;
    onclose?: () => void;
  }

  let { title = '', children, onclose }: Props = $props();
  let scrolled = $state(false);
  let container: HTMLDivElement;

  onMount(() => {
    function keyDownListener(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onclose?.();
      }
    }

    document.addEventListener('keydown', keyDownListener);

    return () => {
      document.removeEventListener('keydown', keyDownListener);
    };
  });
</script>

<div
  transition:fade={{ duration: 200, easing: cubicIn }}
  class="absolute top-0 left-0 z-10 h-full w-full bg-zinc-900/40 backdrop-blur-xs"
  aria-modal="true"
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="absolute top-0 left-0 h-full w-full" onclick={() => onclose?.()}></div>
  <div
    bind:this={container}
    onscroll={() => {
      scrolled = container.scrollTop > 0;
    }}
    class="absolute top-0 left-0 m-6 flex h-[calc(100%-3rem)] w-[calc(100%-3rem)] flex-col overflow-auto rounded-xl bg-zinc-900 md:m-12 md:h-[calc(100%-6rem)] md:w-[calc(100%-6rem)]"
  >
    <div
      class="sticky top-0 left-0 z-20 flex w-full items-center justify-between {scrolled
        ? 'bg-zinc-900/95 shadow-md backdrop-blur-xs'
        : ''}"
    >
      <div class="w-full text-center text-xl font-bold">{title}</div>
      {#if onclose}
        <div
          class="flex items-center justify-center place-self-start rounded-tr-md rounded-bl-md hover:bg-zinc-600/20"
        >
          <!-- svelte-ignore a11y_autofocus -->
          <button aria-label="Close modal" autofocus use:vibrate onclick={() => onclose?.()}>
            <RoundClose
              class="text-primary-dark hover:text-primary p-1 text-3xl transition-colors"
            />
          </button>
        </div>
      {/if}
    </div>
    {@render children?.()}
  </div>
</div>
