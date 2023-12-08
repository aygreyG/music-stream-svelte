<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';

  onMount(() => {
    const timeout = setInterval(() => {
      goto('/');
    }, 1000);

    return () => {
      clearInterval(timeout);
    };
  });
</script>

<div class="h-full w-full bg-zinc-900/95 rounded-md flex items-center justify-center text-2xl">
  <RoundRefresh class="animate-spin w-8 h-8 ml-2" />
  The server is loading please wait...
</div>
