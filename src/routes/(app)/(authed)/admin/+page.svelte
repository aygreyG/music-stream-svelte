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
  import Accordion from '$lib/components/Accordion.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let syncResponse: { message: string; type: 'full' | 'normal' } | null = $state(null);
  let imageGenResponse: { message: string } | null = $state(null);
  let animate = $state(false);
  let loading = $state(false);
  let timeout: string | number | NodeJS.Timeout | undefined = $state();
  let imageGenTimeout: string | number | NodeJS.Timeout | undefined = $state();

  onMount(() => {
    animate = true;
  });
</script>

{#snippet logFileRow({ first, last, file }: { first: boolean; last: boolean; file: string })}
  <div
    class={[
      'my-1 flex items-center justify-between rounded-md bg-zinc-600/10 px-2 py-1 text-sm',
      first && 'mt-2',
      last && 'mb-2'
    ]}
  >
    <div>
      {file}
      {#if file.includes(new Date().toISOString().split('T')[0])}
        (latest)
      {/if}
    </div>
    <a
      class="rounded-md bg-sky-600 px-4 py-1 font-semibold transition-colors hover:bg-sky-700"
      data-sveltekit-preload-data="false"
      href={`/admin/download/logs/${file}`}
      download
      target="_blank"
      use:vibrate
    >
      Download
    </a>
  </div>
{/snippet}

{#if animate}
  <div class="flex h-full flex-col gap-2 overflow-auto p-2">
    <div class="p-2 text-center text-xl font-bold">Admin dashboard</div>

    <div class="mx-auto flex w-full max-w-3xl flex-none flex-col overflow-clip rounded-xl">
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
      <div
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 150 }}
        class="flex items-center justify-between bg-zinc-600/10 p-4"
      >
        <div>Regenerate album images</div>
        {#if imageGenResponse}
          <div class="text-primary">{imageGenResponse.message}</div>
        {/if}
        <button
          class="rounded-md bg-sky-600 px-4 py-1 font-semibold transition-colors hover:bg-sky-700"
          onclick={async () => {
            const re = await fetch('/api/admin/regenerate-art');
            const response = await re.json();
            imageGenResponse = { message: response.message };
            clearTimeout(imageGenTimeout);
            imageGenTimeout = setTimeout(() => {
              imageGenResponse = null;
            }, 2000);
          }}
          use:vibrate
        >
          Regenerate
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
          class="bg-primary hover:bg-primary/80 disabled:hover:bg-primary text-accessible mt-2 w-full self-center rounded-md px-4 py-1 font-semibold transition-colors disabled:opacity-50"
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

    <div class="mx-auto w-full max-w-3xl">
      <Accordion delay={400} title="Errors/Warnings ({data.dbLogs?.length || 0})">
        {#if data.dbLogs && data.dbLogs.length > 0}
          <div class="max-h-96 overflow-y-auto px-2">
            {#each data.dbLogs as log, index (index)}
              <div
                class={[
                  'my-1 rounded-md bg-zinc-600/10 px-2 py-1 text-sm',
                  index === 0 && 'mt-2',
                  index === data.dbLogs.length - 1 && 'mb-2'
                ]}
                animate:flip={{ duration: 200 }}
              >
                <span
                  class={[
                    log.level === 'error' && 'text-red-500',
                    log.level === 'warn' && 'text-yellow-500'
                  ]}
                >
                  {log.level.toUpperCase()}
                </span>
                {#if log.createdAt}
                  {@const timestamp =
                    log.createdAt.toLocaleString('en-GB', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    }) + `.${log.createdAt.getMilliseconds()}`}
                  - <span class="text-zinc-400">{timestamp}</span>
                {/if}
                - {log.message}
              </div>
            {/each}
          </div>
        {:else}
          <div class="p-2 text-center text-sm">No errors/warnings</div>
        {/if}
      </Accordion>

      <Accordion delay={450} title="Latest logs ({data.logs?.length || 0} lines)">
        {#if data.logs && data.logs.length > 0}
          <div class="max-h-96 overflow-y-auto px-2">
            {#each data.logs as log, index (index)}
              <div
                class={[
                  'my-1 rounded-md bg-zinc-600/10 px-2 py-1 text-sm',
                  index === 0 && 'mt-2',
                  index === data.logs.length - 1 && 'mb-2'
                ]}
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
      </Accordion>

      <Accordion
        delay={500}
        title="Log Files ({(data.logFiles?.length || 0) + (data.logZips?.length || 0)} files)"
      >
        <div class="max-h-96 overflow-y-auto px-2">
          {#if data.logFiles && data.logFiles.length > 0}
            {#each data.logFiles as file, index (file)}
              {@render logFileRow({
                file,
                first: index === 0,
                last: index === data.logFiles.length - 1
              })}
            {/each}
          {:else}
            <div class="p-2 text-center text-sm">No log files</div>
          {/if}

          <div class="w-full px-2">Archived Logs</div>

          {#if data.logZips && data.logZips.length > 0}
            {#each data.logZips as file, index (file)}
              {@render logFileRow({
                file,
                first: index === 0,
                last: index === data.logZips.length - 1
              })}
            {/each}
          {:else}
            <div class="p-2 text-center text-sm">No archived logs</div>
          {/if}
        </div>
      </Accordion>
    </div>
  </div>
{/if}
