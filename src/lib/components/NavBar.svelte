<script lang="ts">
  import type { SignedInUser } from '$lib/shared/types';
  import { fade, fly, slide } from 'svelte/transition';
  import RoundMenu from 'virtual:icons/ic/round-menu';
  import RoundClose from 'virtual:icons/ic/round-close';
  import NavigationElements from './NavigationElements.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { vibrate } from '$lib/actions/vibrate';

  export let user: SignedInUser | null = null;
  let open: boolean = false;
  let animate = false;

  onMount(() => {
    animate = true;
  });
</script>

<div class="hidden h-full w-4/12 flex-col gap-1 sm:flex xl:w-3/12">
  <div class="flex flex-col gap-2 rounded-md bg-zinc-900/95 p-4">
    <NavigationElements {user} />
  </div>
  <div class="flex h-full min-h-fit flex-col overflow-auto rounded-md bg-zinc-900/95 p-4">
    {#if user && user.playlists.length > 0}
      <div class="flex flex-none flex-col">
        <div class="font-bold">Playlists</div>
        {#each user.playlists as playlist, index (playlist.id)}
          {#if animate}
            <a
              href="/playlist/{playlist.id}"
              transition:fly|global={{ duration: 300, x: -20, delay: 30 * index }}
              class="transition-colors"
              class:text-fuchsia-600={$page.url.pathname.replaceAll('/', '') ===
                `playlist${playlist.id}`}
            >
              {playlist.name}
            </a>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>

<div
  class="absolute -right-1 top-24 z-50 flex items-center justify-center rounded-s-md bg-zinc-800/90 shadow-md backdrop-blur-md sm:hidden"
>
  <button use:vibrate on:click={() => (open = !open)}>
    {#if open}
      <RoundClose class="text-4xl text-fuchsia-600/70 transition-colors hover:text-fuchsia-600" />
    {:else}
      <RoundMenu class="text-4xl text-fuchsia-600/70 transition-colors hover:text-fuchsia-600" />
    {/if}
  </button>
</div>

<div
  class="absolute top-0 z-40 flex h-full justify-center overflow-y-auto overflow-x-clip rounded-md bg-zinc-900/80 backdrop-blur-md transition-all duration-300"
  class:w-full={open}
  class:left-0={open}
  class:w-0={!open}
  class:left-full={!open}
>
  {#if open}
    <div
      class="flex h-full flex-col items-stretch justify-center"
      transition:fade|global={{ duration: 300 }}
    >
      <NavigationElements on:clickedelement={() => (open = false)} {user} />
    </div>
  {/if}
</div>
