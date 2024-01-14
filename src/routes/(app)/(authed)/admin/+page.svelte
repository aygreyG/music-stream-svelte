<script lang="ts">
  import { enhance } from '$app/forms';
  import { fly } from 'svelte/transition';
  import UserElement from './UserElement.svelte';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';

  export let data;
  let message: string | null = null;
  let animate = false;

  onMount(() => {
    animate = true;
  });
</script>

{#if animate}
  <div class="flex h-full flex-col gap-2 overflow-auto p-2">
    <div class="p-2 text-center text-xl font-bold">Admin dashboard</div>

    <div class="flex flex-none flex-col overflow-clip rounded-md">
      <div
        in:fly|global={{ duration: 500, x: -20, easing: quintOut }}
        class="flex items-center justify-between bg-zinc-600/10 p-4"
      >
        <div>Start library sync</div>
        {#if message}
          <div class="text-fuchsia-600">{message}</div>
        {/if}
        <button
          class="rounded-md bg-sky-600 px-4 py-1 font-semibold transition-colors hover:bg-sky-700"
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
      <div
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 100 }}
        class="flex items-center justify-between bg-zinc-600/10 p-4"
      >
        <div>Full reset & sync</div>
        <button
          class="rounded-md bg-sky-600 px-4 py-1 font-semibold transition-colors hover:bg-sky-700"
          on:click={async () => {
            const re = await fetch('/api/admin/sync?reset=true', {
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
    </div>
    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 200 }}
      class="p-2 text-center text-xl font-bold"
    >
      Users
    </div>

    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 300 }}
      class="flex w-full justify-center"
    >
      <form
        class="flex w-full max-w-lg select-none flex-col gap-2 rounded-md bg-zinc-600/10 p-4"
        method="POST"
        action="?/create"
        use:enhance
      >
        <label>
          <div class="text-sm font-bold text-zinc-400">Username</div>
          <input
            class="w-full rounded-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
            name="username"
            required
          />
        </label>
        <label>
          <div class="text-sm font-bold text-zinc-400">Email</div>
          <input
            class="w-full rounded-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
            type="email"
            name="email"
            required
          />
        </label>
        <label>
          <div class="text-sm font-bold text-zinc-400">Password</div>
          <input
            class="w-full rounded-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
            type="password"
            name="password"
            required
          />
        </label>
        <label class="flex gap-2">
          <div class="text-sm font-bold text-zinc-400">Admin</div>
          <input
            class="my-auto rounded border-zinc-300/50 bg-zinc-600 text-fuchsia-600 transition-colors focus:ring-transparent focus:ring-offset-transparent focus-visible:ring-2 focus-visible:ring-fuchsia-600/50"
            type="checkbox"
            name="admin"
            id="admin"
          />
        </label>
        <button
          class="mt-2 w-full self-center rounded-md bg-fuchsia-600 px-4 py-1 font-semibold transition-colors hover:bg-fuchsia-700"
          type="submit">Create</button
        >
      </form>
    </div>

    {#if data.users}
      <div class="flex flex-col rounded-md">
        {#each data.users as usr, index (usr.id)}
          <div
            class="bg-zinc-600/10"
            class:rounded-t-md={index === 0}
            class:rounded-b-md={index === data.users.length - 1}
            in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 300 + 100 * index }}
            animate:flip
          >
            <UserElement user={usr} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
