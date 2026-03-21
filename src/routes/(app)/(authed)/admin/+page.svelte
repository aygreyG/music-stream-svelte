<script lang="ts">
  import { enhance } from '$app/forms';
  import { fly } from 'svelte/transition';
  import UserElement from './UserElement.svelte';
  import { quintOut } from 'svelte/easing';
  import { onMount, onDestroy } from 'svelte';
  import { flip } from 'svelte/animate';
  import { vibrate } from '$lib/actions/vibrate';
  import RoundRefresh from '~icons/ic/round-refresh';
  import type { PageData } from './$types';
  import Accordion from '$lib/components/Accordion.svelte';
  import { resolve } from '$app/paths';
  import type {
    TaskEvent,
    LogEvent,
    TaskState,
    LogEntry,
    DbLogEntry,
    TaskDefinition
  } from '$lib/shared/types';
  import { SvelteMap } from 'svelte/reactivity';
  import { formatDate } from '$lib/utils';
  import Modal from '$lib/components/Modal.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let animate = $state(false);
  let loading = $state(false);

  let taskStates: Map<string, TaskState> = new SvelteMap();
  let logs: LogEntry[] = $state([]);
  let dbLogs: DbLogEntry[] = $state([]);
  let taskEventSource: EventSource | null = null;
  let logEventSource: EventSource | null = null;
  let showModal = $state<Omit<TaskDefinition, 'execute'> | null>(null);
  const isAnyTaskRunning = $derived.by(() => {
    for (const task of taskStates.values()) {
      if (task.status === 'running') return true;
    }
    return false;
  });

  function getTask(id: string): TaskState | undefined {
    return taskStates.get(id);
  }

  function connectTaskSSE() {
    taskEventSource = new EventSource(resolve('/api/admin/tasks/events'));

    taskEventSource.onmessage = (event) => {
      const data: TaskEvent = JSON.parse(event.data);

      if (data.type === 'snapshot') {
        for (const task of data.tasks) {
          taskStates.set(task.id, task);
        }
      } else if (data.type === 'update') {
        taskStates.set(data.task.id, data.task);
      }
    };

    taskEventSource.onerror = () => {
      taskEventSource?.close();
      setTimeout(connectTaskSSE, 3000);
    };
  }

  function connectLogSSE() {
    logEventSource = new EventSource(resolve('/api/admin/logs/events'));

    logEventSource.onmessage = (event) => {
      const data: LogEvent = JSON.parse(event.data);

      if (data.type === 'snapshot') {
        logs = data.logs;
        dbLogs = data.dbLogs;
      } else if (data.type === 'log') {
        logs = [data.log, ...logs];
      } else if (data.type === 'dbLog') {
        dbLogs = [data.dbLog, ...dbLogs];
      }
    };

    logEventSource.onerror = () => {
      logEventSource?.close();
      setTimeout(connectLogSSE, 3000);
    };
  }

  onMount(() => {
    animate = true;
    connectTaskSSE();
    connectLogSSE();
  });

  onDestroy(() => {
    taskEventSource?.close();
    logEventSource?.close();
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
      href={resolve('/(app)/(authed)/admin/download/logs/[filename]', { filename: file })}
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
    <div
      class="p-2 text-center text-xl font-bold"
      in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
    >
      Admin dashboard
    </div>

    <div
      class="mx-auto flex w-full max-w-3xl flex-none flex-col overflow-clip rounded-xl bg-zinc-600/10 p-2"
    >
      <div
        in:fly|global={{ duration: 500, x: -20, easing: quintOut }}
        class="flex items-center justify-between p-2"
      >
        <div class="font-bold">App version</div>
        <div>{data.APP_VERSION}</div>
      </div>
    </div>

    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 25 }}
      class="p-2 text-center text-xl font-bold"
    >
      Tasks
    </div>

    <div
      class="mx-auto flex w-full max-w-3xl flex-none flex-col overflow-clip rounded-xl bg-zinc-600/10 p-2 pb-1"
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 25 }}
    >
      {#each data.tasks as task, index (task.taskId)}
        {@const taskState = getTask(task.taskId)}
        <div
          in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 25 + 25 * index }}
          class="my-1 flex flex-col gap-2 rounded-xl bg-zinc-600/20 p-4"
        >
          <div class="flex items-center justify-between">
            <div class="font-bold">{task.label}</div>
            <button
              class="bg-tertiary text-on-tertiary enabled:hover:bg-tertiary/80 rounded-full px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              onclick={() => (showModal = task)}
              disabled={taskState?.status === 'running' || isAnyTaskRunning}
              use:vibrate
            >
              Start
            </button>
          </div>
          {#if taskState?.status === 'running'}
            <div class="flex items-center gap-2">
              <RoundRefresh class="text-primary animate-spin text-lg" />
              <span class="text-primary text-sm">
                {taskState.message}
                {#if taskState.progress !== undefined}
                  ({taskState.progress}%)
                {/if}
              </span>
            </div>
          {:else if taskState?.status === 'completed'}
            <span class="text-sm text-green-600">
              {#if taskState.completedAt}
                {formatDate(taskState.completedAt)} -
              {/if}
              {taskState.message}
            </span>
          {:else if taskState?.status === 'error'}
            <span class="text-sm text-red-400">{taskState.message}</span>
          {/if}
          {#if taskState?.status === 'running' && taskState.progress !== undefined}
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-600/30">
              <div
                class="bg-primary h-full rounded-full transition-all duration-300"
                style="width: {taskState.progress}%"
              ></div>
            </div>
          {/if}
        </div>
      {/each}
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
          <div class="text-sm font-bold">Username</div>
          <input
            class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-2 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
            name="username"
            required
          />
        </label>
        <label>
          <div class="text-sm font-bold">Email</div>
          <input
            class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-2 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
            type="email"
            name="email"
            required
          />
        </label>
        <label>
          <div class="text-sm font-bold">Password</div>
          <input
            class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 px-2 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
            type="password"
            name="password"
            required
          />
        </label>
        <label class="flex gap-2">
          <div class="text-sm font-bold">Admin</div>
          <input
            class="focus-visible:ring-primary/50 text-primary my-auto rounded-sm ring-transparent transition-colors focus:ring-transparent focus:ring-offset-transparent focus-visible:ring-2"
            type="checkbox"
            name="admin"
            id="admin"
          />
        </label>
        <button
          class="bg-primary hover:bg-primary/80 disabled:hover:bg-primary text-on-primary mt-2 w-full self-center rounded-md px-4 py-1 font-semibold transition-colors disabled:opacity-50"
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
            class={[
              'overflow-clip bg-zinc-600/10',
              index === 0 && 'rounded-t-xl',
              index === data.users.length - 1 && 'rounded-b-xl'
            ]}
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
      <Accordion delay={400} title="Errors/Warnings ({dbLogs.length})">
        {#if dbLogs.length > 0}
          <div class="max-h-96 overflow-y-auto px-2">
            {#each dbLogs as log, index (log.id)}
              <div
                class={[
                  'my-1 rounded-md bg-zinc-600/10 px-2 py-1 text-sm',
                  index === 0 && 'mt-2',
                  index === dbLogs.length - 1 && 'mb-2'
                ]}
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
                  {@const date = new Date(log.createdAt)}
                  {@const timestamp =
                    date.toLocaleString('en-GB', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    }) + `.${date.getMilliseconds()}`}
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

      <Accordion delay={450} title="Latest logs ({logs.length} lines)">
        {#if logs.length > 0}
          <div class="max-h-96 overflow-y-auto px-2">
            {#each logs as log, index (`${log.timestamp}-${index}`)}
              <div
                class={[
                  'my-1 rounded-md bg-zinc-600/10 px-2 py-1 text-sm',
                  index === 0 && 'mt-2',
                  index === logs.length - 1 && 'mb-2'
                ]}
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

  {#if showModal}
    <Modal title="Are you sure you want to start this task?" onclose={() => (showModal = null)}>
      <div class="flex h-full w-full flex-col items-center justify-center p-4">
        <div
          class="flex h-fit w-full max-w-3xl flex-col items-center gap-2 rounded-xl bg-zinc-600/20 p-4"
        >
          <div class="flex w-full items-center justify-between gap-2">
            <div class="font-bold">{showModal.label}</div>

            <div class="flex gap-2">
              <button
                class="rounded-full bg-gray-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-gray-600"
                onclick={() => (showModal = null)}
                use:vibrate
              >
                Cancel
              </button>
              <button
                class="bg-tertiary text-on-tertiary enabled:hover:bg-tertiary/80 rounded-full px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                onclick={() => {
                  fetch(`/api/admin/task/${showModal!.taskId}`, {
                    method: 'PUT'
                  });
                  showModal = null;
                }}
                disabled={isAnyTaskRunning}
                use:vibrate
              >
                Start
              </button>
            </div>
          </div>

          {#if showModal.description}
            <div class="w-full text-sm font-semibold text-yellow-600">
              {showModal.description}
            </div>
          {/if}
        </div>
      </div>
    </Modal>
  {/if}
{/if}
