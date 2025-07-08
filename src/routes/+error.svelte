<script lang="ts">
  import { page } from '$app/stores';
  import RoundKeyboardBackspace from '~icons/ic/round-keyboard-backspace';
</script>

<div class="flex h-full flex-col items-center justify-center gap-4 rounded-xl bg-zinc-900/95">
  <h1 class="text-2xl font-bold">Ooops, something went wrong...</h1>
  <div class="flex flex-col items-center">
    <div>Error code: <span class="text-primary font-bold">{$page.status}</span></div>
    {#if $page.error?.message}
      <div>
        Error message: <span class="text-primary font-bold">{$page.error.message}</span>
      </div>
    {/if}
  </div>
  <a
    class="group hover:text-primary focus-visible:text-primary flex items-center gap-1 rounded-xl p-2 transition-colors hover:bg-zinc-600/10 focus-visible:bg-zinc-600/10"
    href="/"
  >
    <RoundKeyboardBackspace class="transition-transform group-hover:translate-x-1" />
    Back to homepage
  </a>
</div>
