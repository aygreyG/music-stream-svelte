<script lang="ts">
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import SearchBar from '$lib/components/SearchBar.svelte';

  import RoundAdd from '~icons/ic/round-add';
  import RoundRefresh from '~icons/ic/round-refresh';

  import type { ActionData, PageData } from './$types';
  import PlaylistElement from './PlaylistElement.svelte';

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let searchString = $state('');
  let scrolled = $state(false);
  let loading = $state(false);
  let container: HTMLDivElement;

  let filtered = $derived(
    data.playlists.filter((playlist) =>
      playlist.name.toLowerCase().includes(searchString.toLowerCase())
    )
  );
</script>

<div class="absolute top-0 left-0 flex h-full w-full flex-col overflow-hidden">
  <div
    in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
    class="p-4 pb-0 text-center text-xl font-bold"
  >
    Playlists
  </div>

  <div
    class={[
      'flex w-full flex-col px-8 py-1 transition-shadow duration-300',
      scrolled && 'shadow-md'
    ]}
  >
    <SearchBar bind:value={searchString} />
  </div>

  <div
    class="flex flex-wrap justify-center gap-2 overflow-auto p-2"
    bind:this={container}
    onscroll={() => (scrolled = container.scrollTop > 0)}
  >
    <form
      action="?/add"
      method="POST"
      use:enhance={() => {
        loading = true;
        searchString = '';

        return async ({ update }) => {
          await update();
          loading = false;
        };
      }}
    >
      <button
        in:fly|global={{ duration: 500, easing: quintOut, x: -20 }}
        type="submit"
        class="bg-surface-variant/40 text-on-surface-variant flex size-36 items-center justify-center rounded-xl md:size-40 xl:size-52"
        use:vibrate
        disabled={loading}
      >
        {#if loading}
          <RoundRefresh class="animate-spin text-3xl" />
        {:else}
          <RoundAdd class="text-3xl" />
        {/if}
      </button>
    </form>

    {#each filtered as playlist, index (playlist.id)}
      <div
        in:fly|global={{ duration: 500, delay: 30 * index + 30, easing: quintOut, x: -20 }}
        class="size-36 md:size-40 xl:size-52"
        animate:flip={{ duration: 200 }}
      >
        <PlaylistElement selected={form?.playlist.id === playlist.id} {playlist} />
      </div>
    {/each}
  </div>
</div>
