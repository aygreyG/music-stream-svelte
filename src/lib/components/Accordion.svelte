<script lang="ts">
  import { vibrate } from '$lib/actions/vibrate';
  import { quintOut } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';
  import RoundArrowDropDown from 'virtual:icons/ic/round-arrow-drop-down';
  import RoundArrowDropUp from 'virtual:icons/ic/round-arrow-drop-up';

  export let title = 'Open!';
  export let delay = 0;
  let show = false;
</script>

<button
  class="mt-4 flex w-full items-center justify-between rounded-t-md bg-zinc-600/20 p-2 pl-4 text-xl font-bold transition-all hover:bg-zinc-600/30"
  class:rounded-b-md={!show}
  class:shadow-md={show}
  class:delay-100={!show}
  in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay }}
  on:click={() => {
    show = !show;
  }}
  use:vibrate
>
  {title}
  {#if show}
    <RoundArrowDropUp class="text-3xl" />
  {:else}
    <RoundArrowDropDown class="text-3xl" />
  {/if}
</button>

{#if show}
  <div
    transition:slide={{ duration: 300, easing: quintOut }}
    class="w-full flex-none rounded-b-md bg-zinc-600/10"
  >
    <slot />
  </div>
{/if}
