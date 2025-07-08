<script lang="ts">
  import { enhance } from '$app/forms';
  import { fly } from 'svelte/transition';
  import UserElement from './UserElement.svelte';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { vibrate } from '$lib/actions/vibrate';
  import RoundRefresh from '~icons/ic/round-refresh';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let syncResponse: { message: string; type: 'full' | 'normal' } | null = $state(null);
  let animate = $state(false);
  let loading = $state(false);
  let timeout: string | number | NodeJS.Timeout | undefined = $state();

  onMount(() => {
    animate = true;
  });
</script>

{#if animate}
  <div class="flex h-full flex-col gap-2 overflow-auto p-2">
    <div class="p-2 text-center text-xl font-bold">Admin dashboard</div>

    <div class="flex flex-none flex-col overflow-clip rounded-xl">
      <div
        in:fly|global={{ duration: 500, x: -20, easing: quintOut }}
        class="flex items-center justify-between bg-zinc-600/10 p-4"
      >
        <div>App version</div>
        <div>{data.APP_VERSION}</div>
      </div>
      <div
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 50 }}
        class="flex items-center justify-between bg-zinc-600/10 p-4"
      >
        <div>Start library sync</div>
        {#if syncResponse && syncResponse.type === 'normal'}
          <div class="text-primary">{syncResponse.message}</div>
        {/if}
        <button
          class="rounded-md bg-sky-600 px-4 py-1 font-semibold transition-colors hover:bg-sky-700"
          onclick={async () => {
            const re = await fetch('/api/admin/sync', {
              method: 'POST'
            });

            const response = await re.json();
            syncResponse = { message: response.message, type: 'normal' };
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              syncResponse = null;
            }, 2000);
          }}
          use:vibrate
        >
          Start
        </button>
      </div>
      <div
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 100 }}
        class="flex items-center justify-between bg-zinc-600/10 p-4"
      >
        <div>Full reset & sync</div>
        {#if syncResponse && syncResponse.type === 'full'}
          <div class="text-primary">{syncResponse.message}</div>
        {/if}
        <button
          class="rounded-md bg-sky-600 px-4 py-1 font-semibold transition-colors hover:bg-sky-700"
          onclick={async () => {
            const re = await fetch('/api/admin/sync?reset=true', {
              method: 'POST'
            });

            const response = await re.json();
            syncResponse = { message: response.message, type: 'full' };
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              syncResponse = null;
            }, 2000);
          }}
          use:vibrate
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
        class="flex w-full max-w-lg flex-col gap-2 rounded-xl bg-zinc-600/10 p-4 select-none"
        method="POST"
        action="?/create"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
      >
        <label>
          <div class="text-sm font-bold text-zinc-400">Username</div>
          <input
            class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-2 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
            name="username"
            required
          />
        </label>
        <label>
          <div class="text-sm font-bold text-zinc-400">Email</div>
          <input
            class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-2 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
            type="email"
            name="email"
            required
          />
        </label>
        <label>
          <div class="text-sm font-bold text-zinc-400">Password</div>
          <input
            class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-2 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
            type="password"
            name="password"
            required
          />
        </label>
        <label class="flex gap-2">
          <div class="text-sm font-bold text-zinc-400">Admin</div>
          <input
            class="text-primary focus-visible:ring-primary/50 my-auto rounded-sm border-zinc-300/10 bg-zinc-600/20 transition-colors hover:bg-zinc-600/50 focus:ring-transparent focus:ring-offset-transparent focus-visible:ring-2"
            type="checkbox"
            name="admin"
            id="admin"
          />
        </label>
        <button
          class="bg-primary hover:bg-primary/80 disabled:hover:bg-primary mt-2 w-full self-center rounded-md px-4 py-1 font-semibold transition-colors disabled:opacity-50"
          type="submit"
          use:vibrate
          disabled={loading}
        >
          {#if loading}
            <div class="flex items-center justify-center">
              <RoundRefresh class="animate-spin text-xl" />
            </div>
          {:else}
            Create
          {/if}
        </button>
      </form>
    </div>

    {#if data.users}
      <div class="flex flex-col rounded-xl">
        {#each data.users as usr, index (usr.id)}
          <div
            class="overflow-clip bg-zinc-600/10"
            class:rounded-t-xl={index === 0}
            class:rounded-b-xl={index === data.users.length - 1}
            in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 300 + 100 * index }}
            animate:flip={{ duration: 200 }}
          >
            <UserElement user={usr} />
          </div>
        {/each}
      </div>
    {/if}

    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 400 }}
      class="p-2 text-center text-xl font-bold"
    >
      Logs
    </div>
    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 450 }}
      class="flex flex-col gap-1"
    >
      {#await data.logs}
        <div>Loading...</div>
      {:then logs}
        {#if logs && logs.length > 0}
          <div class="flex max-h-96 flex-col gap-1 overflow-y-auto rounded-xl">
            {#each logs as log, index (index)}
              <div
                class="rounded-xl bg-zinc-600/10 px-2 py-1 text-sm"
                animate:flip={{ duration: 200 }}
              >
                <span
                  class={[
                    log.level === 'error' && 'text-red-500',
                    log.level === 'warn' && 'text-yellow-500',
                    log.level === 'info' && 'text-blue-500'
                  ]}
                >
                  {log.level.toUpperCase()}
                </span>
                {#if log.timestamp}
                  - <span class="text-zinc-400">{log.timestamp}</span>
                {/if}
                - {log.message}
              </div>
            {/each}
          </div>
        {:else}
          <div class="p-2 text-center text-sm">No logs</div>
        {/if}
      {/await}
    </div>
  </div>
{/if}
