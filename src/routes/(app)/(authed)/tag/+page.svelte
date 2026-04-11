<script lang="ts">
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import SearchBar from '$lib/components/SearchBar.svelte';

  import type { PageData } from './$types';
  import TagInfo from './TagInfo.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let searchString = $state('');
  let scrolledFromTop = $state(false);
  let container: HTMLDivElement | null = $state(null);

  let filtered = $derived(
    data.tags.filter((tag) => tag.name.toLowerCase().includes(searchString.toLowerCase()))
  );
</script>

<div class="@container absolute top-0 left-0 flex h-full w-full flex-col overflow-hidden">
  <div
    class="p-4 pb-0 text-center text-xl font-bold"
    in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
  >
    Tags
  </div>

  {#if data.tags.length === 0}
    <div class="p-4 pt-1 text-center text-xl font-bold">There are no tags.</div>
  {:else}
    <div
      class={[
        'flex w-full flex-col px-8 py-1 transition-shadow duration-300',
        scrolledFromTop && 'shadow-md'
      ]}
    >
      <SearchBar bind:value={searchString} />
    </div>

    <div
      class="grid grid-cols-1 gap-3 overflow-auto p-2 @xs:grid-cols-2 @2xl:grid-cols-4 @4xl:grid-cols-5 @7xl:grid-cols-6"
      bind:this={container}
      onscroll={() => {
        if (container) scrolledFromTop = container.scrollTop > 0;
      }}
    >
      {#each filtered as tag, index (tag.id)}
        <div animate:flip={{ duration: 100 }}>
          <TagInfo {tag} {index} />
        </div>
      {/each}
    </div>
  {/if}
</div>
