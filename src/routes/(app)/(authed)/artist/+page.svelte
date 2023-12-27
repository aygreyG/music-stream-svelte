<script lang="ts">
  import { onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let data;
  let animate: boolean = false;

  onMount(() => {
    animate = true;
  });
</script>

<div class="h-full flex flex-col overflow-hidden">
  <div class="text-center font-bold text-2xl px-4 pt-4">Artists</div>

  {#if data.artists.length === 0}
    <div class="text-center font-bold text-xl p-4">There are no artists 🫤</div>
  {/if}

  <div class="flex flex-col h-full overflow-auto text-lg">
    {#each data.artists as artist, index (artist.id)}
      {#if animate}
        <a
          class="hover:bg-gradient-to-r transition-colors from-zinc-600/10 p-2 pl-4"
          in:fly={{ duration: 300, easing: quintOut, x: -20, delay: 50 * index }}
          href="/artist/{artist.id}">{artist.name}</a
        >
      {/if}
    {/each}
  </div>
</div>
