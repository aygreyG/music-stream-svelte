<script lang="ts">
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { vibrate } from '$lib/actions/vibrate';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let showDev = $state(false);
  let animate = $state(false);

  onMount(() => {
    animate = true;
  });
</script>

{#if animate}
  <div class="flex h-full flex-col gap-2 overflow-auto p-2">
    <div
      in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
      class="p-2 text-center text-xl font-bold"
    >
      Changelog ({data.APP_VERSION})
    </div>

    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 50 }}
      class="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-4"
    >
      {#if !data.isProduction}
        <div class="flex items-center justify-center gap-3">
          <button
            class={[
              'rounded-full px-4 py-1 font-semibold transition-colors',
              !showDev
                ? 'bg-primary text-on-primary'
                : 'bg-on-primary/30 text-primary hover:bg-on-primary/50'
            ]}
            onclick={() => (showDev = false)}
            use:vibrate
          >
            Stable
          </button>
          <button
            class={[
              'rounded-full px-4 py-1 font-semibold transition-colors',
              showDev
                ? 'bg-primary text-on-primary'
                : 'bg-on-primary/30 text-primary hover:bg-on-primary/50'
            ]}
            onclick={() => (showDev = true)}
            use:vibrate
          >
            All
          </button>
        </div>
      {/if}

      <div class="changelog-content max-w-none px-4">
        {#if showDev && data.fullHtml}
          {@html data.fullHtml}
        {:else}
          {@html data.stableHtml}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .changelog-content :global(h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(113, 113, 122, 0.3);
  }

  .changelog-content :global(h2) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(113, 113, 122, 0.3);
  }

  .changelog-content :global(h3) {
    font-size: 1rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.25rem;
  }

  .changelog-content :global(ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .changelog-content :global(li) {
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    opacity: 0.85;
  }

  .changelog-content :global(a) {
    color: var(--primary);
    text-decoration: none;
  }

  .changelog-content :global(a:hover) {
    text-decoration: underline;
  }
</style>
