<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ThemeChanger from './ThemeChanger.svelte';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';

  export let data;
  export let form;

  let deleteClicked = false;
  let deleteTimeout: string | number | NodeJS.Timeout | undefined;

  let loading = false;
</script>

<div class="flex h-full flex-col gap-2 overflow-auto p-2">
  <div class="p-2 text-center text-xl font-bold">Profile</div>

  <div
    in:fly|global={{ duration: 500, x: -20, easing: quintOut }}
    class="flex w-full justify-center"
  >
    <form
      class="flex w-full max-w-lg select-none flex-col gap-2 rounded-md bg-zinc-600/10 p-4"
      method="POST"
      action="?/update"
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
          autocomplete="username"
          id="username"
          value={data.user?.username}
          class="w-full rounded-md border-none bg-zinc-600/20 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
          name="username"
          required
        />
      </label>
      <label class="flex flex-col gap-1">
        <div class="text-sm font-bold text-zinc-400">Email</div>
        <input
          id="email"
          autocomplete="email"
          value={data.user?.email}
          class="w-full rounded-md border-none bg-zinc-600/20 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
          type="email"
          name="email"
          required
        />
      </label>
      <button
        class="mt-2 w-full self-center rounded-md bg-primary px-4 py-1 font-semibold transition-colors hover:bg-primary/80 disabled:bg-primary disabled:opacity-50"
        type="submit"
        use:vibrate
        disabled={loading}
      >
        {#if loading}
          <div class="flex items-center justify-center">
            <RoundRefresh class="animate-spin text-xl" />
          </div>
        {:else}
          Update
        {/if}
      </button>
      {#if form?.error && form.action === 'update'}
        <div class="text-sm font-bold text-red-500">{form.error}</div>
      {/if}
    </form>
  </div>

  <div
    in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 100 }}
    class="p-2 text-center text-xl font-bold"
  >
    Change password
  </div>

  <div
    in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 200 }}
    class="flex w-full justify-center"
  >
    <form
      class="flex w-full max-w-lg select-none flex-col gap-2 rounded-md bg-zinc-600/10 p-4"
      method="POST"
      action="?/changepassword"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          await update();
          loading = false;
        };
      }}
    >
      <label class="flex flex-col gap-1">
        <div class="text-sm font-bold text-zinc-400">Current password</div>
        <input
          autocomplete="current-password"
          type="password"
          id="currentpassword"
          class="w-full rounded-md border-none bg-zinc-600/20 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
          name="currentpassword"
          required
        />
      </label>
      <label class="flex flex-col gap-1">
        <div class="text-sm font-bold text-zinc-400">New password</div>
        <input
          id="newpassword"
          autocomplete="new-password"
          class="w-full rounded-md border-none bg-zinc-600/20 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
          type="password"
          name="newpassword"
          required
        />
      </label>
      <label class="flex flex-col gap-1">
        <div class="text-sm font-bold text-zinc-400">Repeat new password</div>
        <input
          id="repeatpassword"
          autocomplete="new-password"
          class="w-full rounded-md border-none bg-zinc-600/20 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
          type="password"
          name="repeatpassword"
          required
        />
      </label>
      {#if form?.error && form.action === 'changepassword'}
        <div class="text-sm font-bold text-red-500">{form.error}</div>
      {/if}
      <button
        class="mt-2 w-full self-center rounded-md bg-primary px-4 py-1 font-semibold transition-colors hover:bg-primary/80 disabled:bg-primary disabled:opacity-50"
        type="submit"
        use:vibrate
        disabled={loading}
      >
        {#if loading}
          <div class="flex items-center justify-center">
            <RoundRefresh class="animate-spin text-xl" />
          </div>
        {:else}
          Update
        {/if}
      </button>
    </form>
  </div>

  <div
    in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 300 }}
    class="p-2 text-center text-xl font-bold"
  >
    Change theme
  </div>

  <div
    in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 400 }}
    class="flex w-full justify-center"
  >
    <ThemeChanger ownerTheme={data.ownerTheme} owner={data.user?.role === 'OWNER'} />
  </div>

  {#if data.user?.role !== 'OWNER'}
    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 500 }}
      class="p-2 text-center text-xl font-bold"
    >
      Delete account
    </div>

    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 600 }}
      class="flex w-full justify-center"
    >
      <form
        method="POST"
        use:enhance={({ cancel }) => {
          if (!deleteClicked) {
            deleteClicked = true;
            deleteTimeout = setTimeout(() => {
              deleteClicked = false;
            }, 2000);
            cancel();
          } else {
            deleteClicked = false;
            clearTimeout(deleteTimeout);
          }
        }}
        class="w-full max-w-lg"
        action="?/delete"
      >
        <button
          type="submit"
          class="w-full rounded-md bg-rose-700 px-4 py-1 font-semibold transition-all hover:bg-opacity-80"
        >
          {#if deleteClicked}
            Are you sure?
          {:else}
            Delete
          {/if}
        </button>
      </form>
    </div>
  {/if}
</div>
