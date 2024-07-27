<script lang="ts">
  import RoundRefresh from 'virtual:icons/ic/round-refresh';
  import { enhance } from '$app/forms';
  import pickedFolder from '$lib/stores/folderPicker';
  import Folder from './Folder.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { vibrate } from '$lib/actions/vibrate';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let err: string | null = $state(null);
  let loading = $state(false);
  let scrolled = $state(false);
  let scrolledToBottom = $state(false);
  let container: HTMLDivElement | null = $state(null);
  let defaultFolder = $state(data.defaultFolder);

  onMount(() => {
    if (container) {
      scrolledToBottom = container.scrollTop < container.scrollHeight - container.clientHeight - 10;
    }

    if (data.defaultFolder.path !== '/') {
      pickedFolder.set(data.defaultFolder);
    }
  });
</script>

<div class="flex h-full flex-col items-center rounded-md bg-zinc-900/95 p-4">
  {#if loading}
    <div class="flex h-full w-full items-center justify-center">
      <RoundRefresh class="text-5xl text-primary motion-safe:animate-spin" />
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
      class="flex h-fit max-h-full w-full max-w-xl flex-col items-center overflow-hidden rounded-md bg-zinc-600/10"
    >
      {#if data.hasOwner}
        <div class="flex w-full items-center justify-between pe-4 ps-2">
          <div class="w-full p-2 text-lg font-bold">Database has an owner account already</div>
          <button
            class="whitespace-nowrap rounded-md bg-rose-600 px-2 py-1 text-sm font-semibold text-white transition-all hover:bg-rose-700"
            formaction="?/deleteowner"
            use:vibrate
          >
            Delete Owner
          </button>
        </div>
      {:else}
        <div class="w-full p-2 text-lg font-bold">Create an owner account</div>

        <label class="w-full px-4 text-sm text-zinc-300">
          <div class="text-sm font-bold text-zinc-400">Username</div>
          <input
            class="w-full rounded-md border-none bg-zinc-600/20 px-2 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
            name="username"
            autocomplete="off"
            required
          />
        </label>

        <label class="w-full px-4 text-sm text-zinc-300">
          <div class="text-sm font-bold text-zinc-400">Email</div>
          <input
            class="w-full rounded-md border-none bg-zinc-600/20 px-2 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
            type="email"
            name="email"
            autocomplete="off"
            required
          />
        </label>

        <label class="w-full px-4 text-sm text-zinc-300">
          <div class="text-sm font-bold text-zinc-400">Password</div>
          <input
            class="w-full rounded-md border-none bg-zinc-600/20 px-2 py-1 outline-none transition-all hover:bg-zinc-600/50 focus-visible:ring-2 focus-visible:ring-primary"
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
          onscroll={() => {
            if (container) {
              scrolledToBottom =
                container.scrollTop < container.scrollHeight - container.clientHeight - 10;
              scrolled = container.scrollTop > 0;
            }
          }}
          class="flex flex-col overflow-auto"
        >
          {#if defaultFolder.path !== '/'}
            <Folder bind:folderNode={defaultFolder} />
          {:else}
            {#each defaultFolder.children as _, index}
              <Folder bind:folderNode={defaultFolder.children[index]} />
            {/each}
          {/if}
        </div>
      </div>

      <div
        class="flex w-full flex-none items-center justify-center transition-shadow"
        class:shadow-md-top={scrolledToBottom}
      >
        <button
          class="m-2 rounded-md bg-primary px-2 py-1 font-bold text-zinc-300 transition-colors hover:bg-primary/80"
          type="submit"
          use:vibrate
        >
          Finish setup
        </button>
      </div>
    </form>
  {/if}
</div>
