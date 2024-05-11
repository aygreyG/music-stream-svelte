<script lang="ts">
  import { fade } from 'svelte/transition';
  import { cubicIn } from 'svelte/easing';
  import { createEventDispatcher, onMount } from 'svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import RoundClose from 'virtual:icons/ic/round-close';

  export let title: string = '';
  let scrolled = false;
  let container: HTMLDivElement;

  const dispatch = createEventDispatcher();

  onMount(() => {
    document.onkeydown = (e) => {
      if (e.key === 'Escape') {
        dispatch('close');
      }
    };

    return () => {
      document.onkeydown = null;
    };
  });
</script>

<div
  transition:fade={{ duration: 200, easing: cubicIn }}
  class="absolute left-0 top-0 z-10 h-full w-full bg-zinc-900/40 backdrop-blur-sm"
  aria-modal
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="absolute left-0 top-0 h-full w-full" on:click={() => dispatch('close')} />
  <div
    bind:this={container}
    on:scroll={() => {
      scrolled = container.scrollTop > 0;
    }}
    class="absolute left-0 top-0 m-6 flex h-[calc(100%-3rem)] w-[calc(100%-3rem)] flex-col overflow-auto rounded-md bg-zinc-900 md:m-12 md:h-[calc(100%-6rem)] md:w-[calc(100%-6rem)]"
  >
    <div
      class="sticky left-0 top-0 z-20 flex w-full items-center justify-between {scrolled
        ? 'bg-zinc-900/95 shadow-md backdrop-blur-sm'
        : ''}"
    >
      <div class="w-full text-center text-xl font-bold">{title}</div>
      <div
        class="flex items-center justify-center place-self-start rounded-bl-md rounded-tr-md hover:bg-zinc-600/20"
      >
        <!-- svelte-ignore a11y-autofocus -->
        <button aria-label="Close modal" autofocus use:vibrate on:click={() => dispatch('close')}>
          <RoundClose class="p-1 text-3xl text-primary/70 transition-colors hover:text-primary" />
        </button>
      </div>
    </div>
    <slot />
  </div>
</div>
