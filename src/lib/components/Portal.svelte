<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
    targetSelector?: string;
    style?: string;
    class?: string;
  }

  let {
    children,
    targetSelector = '#app-main-panel',
    style = '',
    class: className = ''
  }: Props = $props();
  let portalEl: HTMLDivElement | null = $state(null);

  onMount(() => {
    const target = document.querySelector(targetSelector) ?? document.body;

    if (portalEl) {
      target.appendChild(portalEl);
    }

    return () => {
      if (portalEl && portalEl.parentNode) {
        portalEl.parentNode.removeChild(portalEl);
      }
    };
  });
</script>

<div bind:this={portalEl} class={['contents', className]} {style}>
  {@render children?.()}
</div>
