<script lang="ts">
  import RoundRefresh from 'virtual:icons/ic/round-refresh';
  import { enhance } from '$app/forms';
  import pickedFolder from '$lib/stores/folderPicker';
  import Folder from './Folder.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { vibrate } from '$lib/actions/vibrate';

  export let data;
  let err: string | null = null;
  let loading = false;
  let scrolled = false;
  let scrolledToBottom = false;
  let container: HTMLDivElement;

  onMount(() => {
    scrolledToBottom = container.scrollTop < container.scrollHeight - container.clientHeight - 10;

    if (data.defaultFolder.path !== '/') {
      pickedFolder.set(data.defaultFolder);
    }
  });
</script>

<div class="flex h-full flex-col items-center rounded-md bg-zinc-900/95 p-4">
  {#if loading}
    <div class="flex h-full w-full items-center justify-center">
      <RoundRefresh class="text-5xl text-fuchsia-600 motion-safe:animate-spin" />
      <div class="text-3xl font-bold">Loading...</div>
    </div>
  {:else}
    <h1 class="pb-4 text-center text-2xl font-bold">Welcome to the setup page</h1>

    <form
      method="post"
      action="?/createsetup"
      use:enhance={({ cancel, action }) => {
        if (!$pickedFolder && action.search !== '?/deleteowner') {
          cancel();
          err = 'Please select a music folder';
        } else {
          err = '';

          return async ({ update }) => {
            loading = true;
            await update();
            await goto('/login');
            loading = false;
          };
        }
      }}
      class="flex h-fit max-h-full w-full max-w-6xl flex-col items-center overflow-hidden rounded-md bg-zinc-600/10"
    >
      {#if data.hasOwner}
        <div class="flex w-full items-center justify-between pe-2">
          <div class="w-full p-2 text-lg font-bold">Database has an owner account already</div>
          <button
            class="whitespace-nowrap rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white transition-all hover:bg-rose-700"
            formaction="?/deleteowner"
            use:vibrate
          >
            Delete Owner
          </button>
        </div>
      {:else}
        <div class="w-full p-2 text-lg font-bold">Create an owner account</div>

        <label class="w-full px-4 text-sm text-zinc-300">
          <div>Username</div>
          <input
            class="w-full rounded-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
            name="username"
            autocomplete="off"
            required
          />
        </label>

        <label class="w-full px-4 text-sm text-zinc-300">
          <div>Email</div>
          <input
            class="w-full rounded-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
            type="email"
            name="email"
            autocomplete="off"
            required
          />
        </label>

        <label class="w-full px-4 text-sm text-zinc-300">
          <div>Password</div>
          <input
            class="w-full rounded-md bg-zinc-600 px-2 py-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-fuchsia-600"
            type="password"
            name="password"
            required
          />
        </label>
      {/if}

      <input type="hidden" name="musicFolder" value={$pickedFolder?.path ?? null} />

      <div class="flex h-fit max-h-full w-full flex-col overflow-hidden">
        <div class="p-2 pb-0 text-lg font-bold">Select a music folder:</div>
        <div class="flex gap-2 px-4 text-sm transition-shadow" class:shadow-md={scrolled}>
          Currently selected: {$pickedFolder?.path ?? 'None'}
          {#if err}
            <p class="text-sm font-normal text-red-600">{err}</p>
          {/if}
        </div>
        <div
          bind:this={container}
          on:scroll={() => {
            scrolledToBottom =
              container.scrollTop < container.scrollHeight - container.clientHeight - 10;
            scrolled = container.scrollTop > 0;
          }}
          class="flex flex-col overflow-auto"
        >
          {#if data.defaultFolder.path !== '/'}
            <Folder folderNode={data.defaultFolder} />
          {:else}
            {#each data.defaultFolder.children as folder}
              <Folder folderNode={folder} />
            {/each}
          {/if}
        </div>
      </div>

      <div
        class="flex w-full flex-none items-center justify-center transition-shadow"
        class:shadow-md-top={scrolledToBottom}
      >
        <button
          class="m-2 rounded-md bg-fuchsia-600 px-2 py-1 font-bold text-zinc-300 transition-colors hover:bg-fuchsia-700"
          type="submit"
          use:vibrate
        >
          Finish setup
        </button>
      </div>
    </form>
  {/if}
</div>
