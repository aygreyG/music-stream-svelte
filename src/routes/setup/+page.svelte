<script lang="ts">
  import { onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { vibrate } from '$lib/actions/vibrate';
  import pickedFolder from '$lib/stores/folderPicker';

  import RoundPerson from '~icons/ic/round-person';
  import RoundRefresh from '~icons/ic/round-refresh';
  import RoundSettings from '~icons/ic/round-settings';
  import CheckBold from '~icons/iconamoon/check-bold';
  import TrashFill from '~icons/iconamoon/trash-fill';
  import FolderRounded from '~icons/material-symbols-light/folder-rounded';

  import type { PageData } from './$types';
  import Folder from './Folder.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let err: string | null = $state(null);
  let loading = $state(false);
  let animate = $state(false);
  let scrolled = $state(false);
  let scrolledToBottom = $state(false);
  let container: HTMLDivElement | null = $state(null);
  // svelte-ignore state_referenced_locally
  let defaultFolder = $state(data.defaultFolder);

  onMount(() => {
    animate = true;

    if (container) {
      scrolledToBottom = container.scrollTop < container.scrollHeight - container.clientHeight - 10;
    }

    if (data.defaultFolder.path !== '/') {
      pickedFolder.set(data.defaultFolder);
    }
  });
</script>

{#if loading}
  <div class="flex h-full w-full flex-col items-center justify-center gap-3">
    <RoundRefresh class="text-primary text-5xl motion-safe:animate-spin" />
    <div class="text-on-surface text-2xl font-bold">Setting up...</div>
  </div>
{:else if animate}
  <div class="bg-surface flex h-full flex-col gap-2 overflow-auto rounded-xl p-2">
    <div
      class="flex items-center justify-center gap-2 p-2 text-center text-xl font-bold"
      in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
    >
      <RoundSettings class="text-primary text-2xl" />
      Initial Setup
    </div>

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
            await goto(resolve('/(app)/(unauthed)/login'));
            loading = false;
          };
        }
      }}
      class="mx-auto flex h-fit max-h-full w-full max-w-3xl flex-col overflow-hidden"
    >
      <div
        class="mx-auto flex w-full max-w-3xl flex-none flex-col overflow-clip rounded-xl bg-zinc-600/10 p-2"
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 50 }}
      >
        {#if data.hasOwner}
          <div class="flex items-center justify-between gap-2 rounded-xl p-4">
            <div class="flex items-center gap-2">
              <RoundPerson class="text-primary flex-none text-xl" />
              <span class="font-bold">Owner account exists already</span>
            </div>
            <button
              class="bg-error text-on-error enabled:hover:bg-error/80 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors"
              formaction="?/deleteowner"
              use:vibrate
            >
              <TrashFill class="text-base" />
              Delete account
            </button>
          </div>
        {:else}
          <div class="flex items-center gap-2 p-2 font-bold">
            <RoundPerson class="text-primary text-xl" />
            Create an owner account
          </div>

          <div class="flex flex-col gap-2 rounded-xl bg-zinc-600/20 p-4">
            <label class="flex flex-col gap-1">
              <div class="text-sm font-bold">Username</div>
              <input
                class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-3 py-1.5 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
                name="username"
                autocomplete="off"
                required
              />
            </label>

            <label class="flex flex-col gap-1">
              <div class="flex items-center justify-between gap-2 text-sm font-bold">
                Email
                <div class="text-xs font-normal">(mainly used for MusicBrainz API requests)</div>
              </div>
              <input
                class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-3 py-1.5 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
                type="email"
                name="email"
                autocomplete="off"
                required
              />
            </label>

            <label class="flex flex-col gap-1">
              <div class="text-sm font-bold">Password</div>
              <input
                class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-3 py-1.5 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
                type="password"
                name="password"
                required
              />
            </label>
          </div>
        {/if}
      </div>

      <input type="hidden" name="musicFolder" value={$pickedFolder?.path ?? null} />

      <div
        class="mx-auto mt-2 flex h-fit max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-zinc-600/10 p-2"
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 100 }}
      >
        <div class="flex items-center gap-2 p-2 font-bold">
          <FolderRounded class="text-primary text-xl" />
          Select a music folder
        </div>
        <div
          class={[
            'flex items-center gap-2 px-4 pb-1 text-sm transition-shadow',
            scrolled && 'shadow-md'
          ]}
        >
          <span class="text-on-surface-variant">
            Selected: <span
              class={$pickedFolder
                ? 'text-primary font-semibold'
                : 'text-on-surface-variant italic'}
            >
              {$pickedFolder?.path ?? 'None'}
            </span>
          </span>
          {#if err}
            <p class="text-error text-sm font-semibold">{err}</p>
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
          class="flex flex-col overflow-auto rounded-xl bg-zinc-600/20 p-2 pl-0"
        >
          {#if defaultFolder.path !== '/'}
            <Folder bind:folderNode={defaultFolder} />
          {:else}
            {#each defaultFolder.children as node, index (node.path)}
              <Folder bind:folderNode={defaultFolder.children[index]} />
            {/each}
          {/if}
        </div>
      </div>

      <div
        class="mx-auto mt-2 w-full max-w-3xl"
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 150 }}
      >
        <div
          class={[
            'flex w-full flex-none items-center justify-center transition-shadow',
            scrolledToBottom && 'shadow-md-top'
          ]}
        >
          <button
            class="bg-primary text-on-primary enabled:hover:bg-primary/80 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 font-bold transition-colors disabled:opacity-50"
            type="submit"
            use:vibrate
          >
            <CheckBold class="text-xl" />
            Finish setup
          </button>
        </div>
      </div>
    </form>
  </div>
{/if}
