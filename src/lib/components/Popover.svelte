<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  interface Props {
    open: boolean;
    onclose: () => void;
    anchor: HTMLElement | null;
    children?: Snippet;
    offset?: { top?: number; left?: number };
    side?: 'bottom' | 'right';
    excludeFromClickOutside?: HTMLElement | null;
  }

  let {
    open,
    onclose,
    anchor,
    children,
    offset = { top: 4, left: 0 },
    side = 'bottom',
    excludeFromClickOutside = null
  }: Props = $props();
  let menuEl: HTMLDivElement | null = $state(null);
  let position = $state({ top: 0, left: 0, above: false });

  function updatePosition() {
    if (!anchor || !menuEl) return;
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top: number;
    let left: number;
    let above = false;

    if (side === 'right') {
      // Position to the right of the anchor; fall back to left if not enough space
      const spaceRight = viewportWidth - anchorRect.right;
      const useLeft = spaceRight < menuRect.width + 8;
      left = useLeft
        ? anchorRect.left - menuRect.width - (offset.left ?? 0)
        : anchorRect.right + (offset.left ?? 0);
      top = anchorRect.top + (offset.top ?? 0);
    } else {
      // Default: below (or above) the anchor
      const spaceBelow = viewportHeight - anchorRect.bottom;
      above = spaceBelow < menuRect.height && anchorRect.top > spaceBelow;
      top = above
        ? anchorRect.top - menuRect.height - (offset.top ?? 0)
        : anchorRect.bottom + (offset.top ?? 0);
      left = anchorRect.left - menuRect.width + anchorRect.width + (offset.left ?? 0);
    }

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + menuRect.width > viewportWidth - 8) left = viewportWidth - menuRect.width - 8;
    if (top < 8) top = 8;
    if (top + menuRect.height > viewportHeight - 8) top = viewportHeight - menuRect.height - 8;

    position = { top, left, above };
  }

  $effect(() => {
    if (open && anchor && menuEl) {
      updatePosition();
    }
  });

  $effect(() => {
    if (!open || !menuEl) return;
    const observer = new ResizeObserver(() => updatePosition());
    observer.observe(menuEl);
    return () => observer.disconnect();
  });

  $effect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onclose();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        menuEl &&
        !menuEl.contains(e.target as Node) &&
        !anchor?.contains(e.target as Node) &&
        !excludeFromClickOutside?.contains(e.target as Node)
      ) {
        onclose();
      }
    }

    function handleScroll() {
      onclose();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('scroll', handleScroll, true);
    };
  });
</script>

{#if open}
  <div
    bind:this={menuEl}
    class="bg-surface-container fixed z-50 min-w-48 overflow-hidden rounded-xl shadow-xl"
    style="top: {position.top}px; left: {position.left}px;"
    transition:fly={{
      x: side === 'right' ? -8 : 0,
      y: side === 'right' ? 0 : position.above ? 8 : -8,
      duration: 150,
      easing: cubicOut
    }}
  >
    {@render children?.()}
  </div>
{/if}
