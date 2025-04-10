<script lang="ts">
  import { flip } from 'svelte/animate';
  import RoundSearch from '~icons/ic/round-search';
  import RoundAdd from '~icons/ic/round-add';
  import { enhance } from '$app/forms';
  import PlaylistElement from './PlaylistElement.svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { vibrate } from '$lib/actions/vibrate';
  import RoundRefresh from '~icons/ic/round-refresh';
  import type { ActionData, PageData } from './$types';

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

<div
  out:fade|global={{ duration: 150 }}
  class="absolute left-0 top-0 flex h-full w-full flex-col overflow-hidden"
>
  <div out:fade|global={{ duration: 250 }} class="p-4 pb-0 text-center text-xl font-bold">
    Playlists
  </div>

  <div
    out:fade|global={{ duration: 250 }}
    class="flex w-full flex-col px-8 py-1 transition-shadow duration-300"
    class:shadow-md={scrolled}
  >
    <label class="flex w-full items-center rounded-md backdrop-blur-md">
      <input
        class="w-full rounded-md border-none bg-zinc-600/30 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        type="text"
        bind:value={searchString}
        name="search"
        autocomplete="off"
        placeholder="Search"
      />
      <RoundSearch class="absolute right-2 text-xl" />
    </label>
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
        class="flex h-36 w-36 items-center justify-center rounded-md bg-zinc-950/20 md:h-40 md:w-40 xl:h-52 xl:w-52"
        use:vibrate
        disabled={loading}
      >
        {#if loading}
          <RoundRefresh class="animate-spin text-3xl text-zinc-600" />
        {:else}
          <RoundAdd class="text-3xl text-zinc-600" />
        {/if}
      </button>
    </form>

    {#each filtered as playlist, index (playlist.id)}
      <div
        in:fly|global={{ duration: 500, delay: 30 * index + 30, easing: quintOut, x: -20 }}
        out:fade={{ duration: 200 }}
        class="h-36 w-36 md:h-40 md:w-40 xl:h-52 xl:w-52"
        animate:flip={{ duration: 200 }}
      >
        <PlaylistElement selected={form?.playlist.id === playlist.id} {playlist} />
      </div>
    {/each}
  </div>
</div>
