<script lang="ts">
  import { enhance } from '$app/forms';
  import UserElement from './UserElement.svelte';

  export let data;
  let message: string | null = null;
</script>

<div class="flex flex-col gap-2 p-2 overflow-auto h-full">
  <div class="text-center text-xl font-bold p-2">Admin dashboard</div>

  <div class="flex justify-between items-center p-4 rounded-md bg-zinc-600/10">
    <div>Start library sync</div>
    {#if message}
      <div class="text-fuchsia-600">{message}</div>
    {/if}
    <button
      class="bg-sky-600 hover:bg-sky-700 rounded-md py-1 px-4 font-semibold transition-colors"
      on:click={async () => {
        const re = await fetch('/api/admin/sync', {
          method: 'POST'
        });

        const response = await re.json();
        message = response.message;
        setTimeout(() => {
          message = null;
        }, 2000);
      }}
    >
      Start
    </button>
  </div>
  <div class="text-center text-xl font-bold p-2">Users</div>

  <div class="flex justify-center w-full">
    <form
      class="select-none w-full max-w-lg flex flex-col gap-2 bg-zinc-600/10 rounded-md p-4"
      method="POST"
      action="?/create"
      use:enhance
    >
      <label>
        <div class="text-zinc-400 font-bold text-sm">Username</div>
        <input
          class="bg-zinc-600 rounded-md px-2 py-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 w-full"
          name="username"
          required
        />
      </label>
      <label>
        <div class="text-zinc-400 font-bold text-sm">Email</div>
        <input
          class="bg-zinc-600 rounded-md px-2 py-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 w-full"
          type="email"
          name="email"
          required
        />
      </label>
      <label>
        <div class="text-zinc-400 font-bold text-sm">Password</div>
        <input
          class="w-full bg-zinc-600 rounded-md px-2 py-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600"
          type="password"
          name="password"
          required
        />
      </label>
      <label class="flex gap-2">
        <div class="text-zinc-400 font-bold text-sm">Admin</div>
        <input
          class="my-auto rounded border-zinc-300/50 bg-zinc-600 text-fuchsia-600 transition-colors focus:ring-transparent focus-visible:ring-2 focus-visible:ring-fuchsia-600/50 focus:ring-offset-transparent"
          type="checkbox"
          name="admin"
          id="admin"
        />
      </label>
      <button
        class="mt-2 self-center bg-fuchsia-600 hover:bg-fuchsia-700 rounded-md py-1 px-4 w-full font-semibold transition-colors"
        type="submit">Create</button
      >
    </form>
  </div>

  {#if data.users}
    <div class="flex flex-col bg-zinc-600/10 rounded-md">
      {#each data.users as usr (usr.id)}
        <UserElement user={usr} />
      {/each}
    </div>
  {/if}
</div>
