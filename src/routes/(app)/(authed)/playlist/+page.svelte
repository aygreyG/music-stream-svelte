<script lang="ts">
  import { flip } from 'svelte/animate';
  import RoundSearch from 'virtual:icons/ic/round-search';
  import RoundAdd from 'virtual:icons/ic/round-add';
  import { enhance } from '$app/forms';
  import PlaylistElement from './PlaylistElement.svelte';

  export let data;
  export let form;

  let searchString = '';
  let scrolled = false;
  let container: HTMLDivElement;

  $: filtered = data.playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchString.toLowerCase())
  );
</script>

<div class="absolute left-0 top-0 flex h-full w-full flex-col overflow-hidden">
  <div class="px-4 pt-1 text-center text-xl font-bold">Playlists</div>

  <div
    class="flex w-full flex-col px-8 py-1 transition-shadow duration-300"
    class:shadow-md={scrolled}
  >
    <label class="flex w-full items-center rounded-md backdrop-blur-md">
      <input
        class="w-full rounded-md border-none bg-zinc-600 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
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
    on:scroll={() => (scrolled = container.scrollTop > 0)}
  >
    <form action="?/add" method="POST" use:enhance>
      <button
        type="submit"
        class="flex h-36 w-36 items-center justify-center rounded-md bg-zinc-950/20 md:h-40 md:w-40 xl:h-52 xl:w-52"
      >
        <RoundAdd class="text-3xl text-zinc-600" />
      </button>
    </form>

    {#each filtered as playlist (playlist.id)}
      <div class="h-36 w-36 md:h-40 md:w-40 xl:h-52 xl:w-52" animate:flip={{ duration: 100 }}>
        <PlaylistElement selected={form?.playlist.id === playlist.id} {playlist} />
      </div>
    {/each}
  </div>
</div>
