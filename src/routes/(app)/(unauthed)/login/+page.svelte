<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate.js';
  import RoundRefresh from '~icons/ic/round-refresh';
  import type { ActionData, PageData } from './$types';

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let loading = $state(false);
</script>

<div class="flex h-full flex-col items-center overflow-auto px-4">
  <h1 class="p-4 text-center text-xl font-bold">Login</h1>

  <form
    class="flex w-full max-w-lg flex-col gap-2 rounded-md bg-zinc-600/10 p-4 transition-all"
    method="POST"
    action="?&redirect_to={data.redirectTo ?? ''}"
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        await update({ reset: false });
        loading = false;
      };
    }}
  >
    <label class="flex flex-col gap-1">
      <div class="text-sm font-bold text-zinc-400">Username</div>
      <input
        class="w-full rounded-md border-none bg-zinc-600/20 px-2 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        name="username"
        required
      />
    </label>
    <label class="flex flex-col gap-1">
      <div class="text-sm font-bold text-zinc-400">Password</div>
      <input
        class="w-full rounded-md border-none bg-zinc-600/20 px-2 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
        type="password"
        name="password"
        required
      />
    </label>

    <button
      class="mt-2 w-full self-center rounded-md bg-primary px-4 py-1 font-semibold transition-colors hover:bg-primary/80 disabled:opacity-50 disabled:hover:bg-primary"
      type="submit"
      use:vibrate
      disabled={loading}
    >
      {#if loading}
        <div class="flex items-center justify-center">
          <RoundRefresh class="animate-spin text-xl" />
        </div>
      {:else}
        Login
      {/if}
    </button>
    {#if form?.error}
      <div class="text-sm font-bold text-red-500">
        {`${form.error.charAt(0).toUpperCase()}${form.error.slice(1)}.`}
      </div>
    {/if}
  </form>
</div>
