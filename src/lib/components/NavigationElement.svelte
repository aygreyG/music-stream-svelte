<script lang="ts">
  import { page } from '$app/stores';
  import { vibrate } from '$lib/actions/vibrate';
  import { createEventDispatcher } from 'svelte';

  export let href: string;
  export let text: string;
  export let icon: any;

  $: currentPage = $page.url.pathname;

  const dispatch = createEventDispatcher();
</script>

<div>
  <a
    on:click={() => dispatch('clickedelement')}
    class="flex items-center gap-2 px-16 text-2xl transition-colors sm:px-0 sm:text-base"
    class:text-primary={currentPage.replaceAll('/', '') === href.replaceAll('/', '')}
    {href}
    use:vibrate
  >
    <svelte:component this={icon} />
    {text}
  </a>
</div>
