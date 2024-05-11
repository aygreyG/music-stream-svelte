<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate.js';

  export let data;
</script>

<div class="flex h-full flex-col items-center overflow-auto px-4">
  <h1 class="p-4 text-center text-xl font-bold">Login</h1>

  <form
    class="flex w-full max-w-lg flex-col gap-2 rounded-md bg-zinc-600/10 p-4"
    method="POST"
    action="?&redirect_to={data.redirectTo ?? ''}"
    use:enhance
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
      class="mt-2 w-full self-center rounded-md bg-primary px-4 py-1 font-semibold hover:bg-primary/80"
      type="submit"
      use:vibrate
    >
      Login
    </button>
  </form>
</div>
