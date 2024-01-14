<script lang="ts">
  import { enhance } from '$app/forms';

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
        class="rounded-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
        name="username"
        required
      />
    </label>
    <label class="flex flex-col gap-1">
      <div class="text-sm font-bold text-zinc-400">Password</div>
      <input
        class="rounded-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
        type="password"
        name="password"
        required
      />
    </label>
    <button
      class="mt-2 w-full self-center rounded-md bg-fuchsia-600 px-4 py-1 font-semibold hover:bg-fuchsia-700"
      type="submit"
    >
      Login
    </button>
  </form>
</div>
