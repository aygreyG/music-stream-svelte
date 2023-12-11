<script lang="ts">
  import { page } from '$app/stores';
  import RoundKeyboardBackspace from 'virtual:icons/ic/round-keyboard-backspace';
</script>

<div class="flex gap-4 flex-col items-center justify-center bg-zinc-900/95 h-full rounded-md">
  <h1 class="text-2xl font-bold">Ooops, something went wrong...</h1>
  <div class="flex flex-col items-center">
    <div>Error code: <span class="font-bold text-fuchsia-600">{$page.status}</span></div>
    {#if $page.error?.message}
      <div>
        Error message: <span class="font-bold text-fuchsia-600">{$page.error.message}</span>
      </div>
    {/if}
  </div>
  <a
    class="group flex gap-1 items-center hover:text-fuchsia-600 focus-visible:text-fuchsia-600 transition-colors hover:bg-zinc-600/10 focus-visible:bg-zinc-600/10 p-2 rounded-md"
    href="/"
  >
    <RoundKeyboardBackspace class="group-hover:translate-x-1 transition-transform" />
    Back to homepage
  </a>
</div>
