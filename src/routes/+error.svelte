<script lang="ts">
  import { page } from '$app/stores';
  import RoundKeyboardBackspace from '~icons/ic/round-keyboard-backspace';
</script>

<div class="flex h-full flex-col items-center justify-center gap-4 rounded-md bg-zinc-900/95">
  <h1 class="text-2xl font-bold">Ooops, something went wrong...</h1>
  <div class="flex flex-col items-center">
    <div>Error code: <span class="font-bold text-primary">{$page.status}</span></div>
    {#if $page.error?.message}
      <div>
        Error message: <span class="font-bold text-primary">{$page.error.message}</span>
      </div>
    {/if}
  </div>
  <a
    class="group flex items-center gap-1 rounded-md p-2 transition-colors hover:bg-zinc-600/10 hover:text-primary focus-visible:bg-zinc-600/10 focus-visible:text-primary"
    href="/"
  >
    <RoundKeyboardBackspace class="transition-transform group-hover:translate-x-1" />
    Back to homepage
  </a>
</div>
