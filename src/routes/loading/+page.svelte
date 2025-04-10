<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import RoundRefresh from '~icons/ic/round-refresh';

  onMount(() => {
    const timeout = setInterval(() => {
      goto('/');
    }, 1000);

    return () => {
      clearInterval(timeout);
    };
  });
</script>

<div class="flex h-full w-full items-center justify-center rounded-md bg-zinc-900/95 text-2xl">
  <RoundRefresh class="ml-2 h-8 w-8 animate-spin" />
  The server is loading please wait...
</div>
