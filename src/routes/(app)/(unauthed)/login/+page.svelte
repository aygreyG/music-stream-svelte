<script lang="ts">
  import { enhance } from '$app/forms';

  export let data;
</script>

<div class="h-full flex flex-col items-center px-4 overflow-auto">
  <h1 class="text-xl text-center font-bold p-4">Login</h1>

  <form
    class="w-full max-w-lg flex flex-col gap-2 bg-zinc-600/10 rounded-md p-4"
    method="POST"
    action="?&redirect_to={data.redirectTo ?? ''}"
    use:enhance
  >
    <label class="flex gap-1 flex-col">
      <div class="text-zinc-400 font-bold text-sm">Username</div>
      <input
        class="bg-zinc-600 rounded-md px-2 py-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600"
        name="username"
        required
      />
    </label>
    <label class="flex flex-col gap-1">
      <div class="text-zinc-400 font-bold text-sm">Password</div>
      <input
        class="bg-zinc-600 rounded-md px-2 py-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600"
        type="password"
        name="password"
        required
      />
    </label>
    <button
      class="mt-2 self-center bg-fuchsia-600 hover:bg-fuchsia-700 rounded-md py-1 px-4 w-full font-semibold"
      type="submit"
    >
      Login
    </button>
  </form>
</div>
