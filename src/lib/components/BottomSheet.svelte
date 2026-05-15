<script lang="ts">
  import { type Snippet } from 'svelte';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';

  interface Props {
    open: boolean;
    onclose: () => void;
    title?: string;
    children?: Snippet;
    onscroll?: (e: Event) => void;
  }

  let { open, onclose, title = '', children, onscroll }: Props = $props();

  let startY = $state(0);
  let currentY = $state(0);
  let dragging = $state(false);

  function handleTouchStart(e: TouchEvent) {
    startY = e.touches[0].clientY;
    currentY = 0;
    dragging = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!dragging) return;
    e.preventDefault();
    const diff = e.touches[0].clientY - startY;
    currentY = Math.max(0, diff);
  }

  function handleTouchEnd() {
    if (!dragging) return;
    dragging = false;
    if (currentY > 100) {
      onclose();
    }
    currentY = 0;
  }

  $effect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onclose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-50"
    transition:fade={{ duration: 200, easing: cubicIn }}
    aria-modal="true"
    role="dialog"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      style="opacity: {dragging ? Math.max(1 - currentY / startY, 0) : 1};"
      class="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs"
      onclick={() => onclose()}
    ></div>
    <div
      class="bg-surface-container absolute bottom-0 left-1/2 mx-auto w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-t-2xl"
      style={dragging ? `transform: translateY(${currentY}px)` : ''}
      transition:fly|global={{ y: 300, duration: 250, easing: cubicOut }}
      role="dialog"
    >
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="flex cursor-grab touch-none justify-center py-3 active:cursor-grabbing"
        ontouchstart={handleTouchStart}
        ontouchmove={handleTouchMove}
        ontouchend={handleTouchEnd}
      >
        <div class="bg-outline-variant h-1 w-10 rounded-full"></div>
      </div>
      {#if title}
        <div class="px-4 pb-2 text-center text-lg font-bold">{title}</div>
      {/if}
      <div class="max-h-[60vh] overflow-auto overscroll-contain pb-6" {onscroll}>
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
