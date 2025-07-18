<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import { ROLE } from '$lib/shared/consts';
  import type { User } from '../../../../generated/prisma-client/client';
  type UserWithoutPassword = Omit<User, 'password'>;
  import { fade } from 'svelte/transition';

  interface Props {
    user: UserWithoutPassword;
  }

  let { user }: Props = $props();
  let deleteClicked = $state(false);
  let admin = $state(user.role === ROLE.ADMIN);
  let username = $state(user.username);
  let email = $state(user.email);
</script>

<form
  action="?/update"
  class="flex items-center gap-1 p-1 transition-all hover:bg-zinc-600/10"
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
    class="focus-visible:ring-primary w-1/2 rounded-[10px] border-none bg-transparent px-2 py-1 outline-hidden transition-all focus-visible:bg-zinc-600 focus-visible:ring-2"
    type="text"
    bind:value={username}
    name="username"
  />
  <input
    class="focus-visible:ring-primary w-1/2 rounded-[10px] border-none bg-transparent px-2 py-1 outline-hidden transition-all focus-visible:bg-zinc-600 focus-visible:ring-2"
    type="email"
    bind:value={email}
    name="email"
  />
  <label class="mr-3 flex items-center gap-1">
    <div>Admin:</div>
    <input
      class="text-primary focus-visible:ring-primary/50 rounded-sm border-zinc-300/10 bg-zinc-600/20 transition-colors hover:bg-zinc-600/50 focus:ring-transparent focus:ring-offset-transparent focus-visible:ring-2"
      type="checkbox"
      name="admin"
      bind:checked={admin}
    />
  </label>
  <input type="hidden" name="id" value={user.id} />
  <button
    class="w-36 rounded-[10px] bg-emerald-600 px-2 py-1 font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600"
    type="submit"
    disabled={user.username === username &&
      user.email === email &&
      ((admin && user.role === ROLE.ADMIN) || (!admin && user.role === ROLE.USER))}
    use:vibrate
  >
    Update
  </button>
  <button
    class="w-36 rounded-[10px] bg-rose-600 px-2 py-1 font-semibold text-white transition-all hover:bg-rose-700"
    formaction="?/delete"
    use:vibrate
  >
    {#if deleteClicked}
      <div in:fade>Sure?</div>
    {:else}
      <div in:fade>Delete</div>
    {/if}
  </button>
</form>
