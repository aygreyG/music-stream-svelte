<script lang="ts">
  import { enhance } from '$app/forms';
  import type { User } from '@prisma/client';
  type UserWithoutPassword = Omit<User, 'password'>;
  import { fade } from 'svelte/transition';

  export let user: UserWithoutPassword;
  let deleteClicked = false;
  let admin = user.role === 'ADMIN';
  let username = user.username;
  let email = user.email;
</script>

<form
  action="?/update"
  class="p-1 flex gap-1 items-center hover:bg-zinc-600/10 rounded-md"
  method="POST"
  use:enhance={({ action, cancel }) => {
    if (action.search === '?/delete') {
      if (deleteClicked) {
        deleteClicked = false;
      } else {
        deleteClicked = true;

        setTimeout(() => {
          deleteClicked = false;
        }, 2000);

        cancel();
      }
    }

    return async ({ update }) => {
      await update({ reset: false });
    };
  }}
>
  <input
    class="focus-visible:bg-zinc-600 bg-transparent border-none rounded-md px-2 py-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 w-1/2"
    type="text"
    bind:value={username}
    name="username"
  />
  <input
    class="focus-visible:bg-zinc-600 bg-transparent border-none rounded-md px-2 py-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 w-1/2"
    type="email"
    bind:value={email}
    name="email"
  />
  <label class="flex items-center gap-1">
    <div>Admin:</div>
    <input
      class="rounded border-zinc-300/50 bg-zinc-600 text-fuchsia-600 transition-colors focus:ring-transparent focus-visible:ring-2 focus-visible:ring-fuchsia-600/50 focus:ring-offset-transparent"
      type="checkbox"
      name="admin"
      bind:checked={admin}
    />
  </label>
  <input type="hidden" name="id" value={user.id} />
  <button
    class="w-36 bg-emerald-600 hover:bg-emerald-700 rounded-md py-1 px-2 font-semibold text-white disabled:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    type="submit"
    disabled={user.username === username && user.email === email && admin
      ? user.role !== 'ADMIN'
      : user.role === 'ADMIN'}
  >
    Update
  </button>
  <button
    class="w-36 transition-all bg-rose-600 hover:bg-rose-700 rounded-md py-1 px-2 font-semibold text-white"
    formaction="?/delete"
  >
    {#if deleteClicked}
      <div in:fade>Sure?</div>
    {:else}
      <div in:fade>Delete</div>
    {/if}
  </button>
</form>
