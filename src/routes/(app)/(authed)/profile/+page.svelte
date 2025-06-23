<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ThemeChanger from './ThemeChanger.svelte';
  import RoundRefresh from '~icons/ic/round-refresh';
  import TrashFill from '~icons/iconamoon/trash-fill';
  import History from '~icons/iconamoon/history';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import Accordion from '$lib/components/Accordion.svelte';
  import { getReadableTime } from '$lib/utils';
  import { flip } from 'svelte/animate';
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { ActionData, PageData } from './$types';
  import { untrack } from 'svelte';
  import { ROLE } from '$lib/shared/consts';

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let deleteClicked = $state(false);
  let deleteTimeout: string | number | NodeJS.Timeout | undefined = $state();
  let loading = $state(false);
  let listensLoading = $state(false);
  let listenedIndex = $state(0);
  let listens = $state([...data.listens]);

  // Update listens when data changes but untracking listens array to prevent infinite loop
  $effect(() => {
    if (data.listens) {
      let tmpListens = [
        ...untrack(() => listens.filter((el) => !data.listens.find((v) => v.id === el.id))),
        ...data.listens
      ];
      untrack(() => {
        listens = tmpListens.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      });
    }
  });

  const handleListenSubmit: SubmitFunction = () => {
    listensLoading = true;
    return async ({ update, result }) => {
      await update();
      listensLoading = false;

      if (result.type === 'success' && result.data?.listens && result.data.listens.length > 0) {
        listenedIndex = listens.length;
        listens = [...listens, ...result.data.listens];
      }
    };
  };
</script>

<div class="absolute right-3 top-1 z-50 text-sm font-bold text-zinc-600/20">
  App version: {data.APP_VERSION}
</div>
<div class="flex h-full w-full flex-col items-center overflow-auto">
  <div class="flex w-full max-w-xl flex-col p-2">
    <div class="p-2 text-center text-xl font-bold">Profile</div>

    <Accordion title="Update Profile">
      <div class="flex w-full flex-none justify-center">
        <form
          class="flex w-full select-none flex-col gap-2 p-4 transition-all"
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
    </Accordion>

    <Accordion title="Change Password" delay={100}>
      <div class="flex w-full flex-none justify-center">
        <form
          class="flex w-full select-none flex-col gap-2 p-4"
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
    </Accordion>

    <Accordion title="Change Theme" delay={200}>
      <ThemeChanger ownerTheme={data.ownerTheme} owner={data.user?.role === ROLE.OWNER} />
    </Accordion>

    {#if data.user?.role !== ROLE.OWNER}
      <div
        class="mt-4 flex w-full items-center justify-between rounded-md bg-zinc-600/20 px-4 py-2"
      >
        <div
          in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 500 }}
          class="text-center text-xl font-bold"
        >
          Delete account
        </div>

        <div
          in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 600 }}
          class="flex items-center justify-center"
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
            class="flex w-full items-center justify-center"
            action="?/delete"
          >
            <button
              type="submit"
              class="w-full rounded-md bg-rose-700 px-4 py-1 font-semibold transition-all hover:bg-opacity-80"
            >
              {#if deleteClicked}
                Are you sure?
              {:else}
                <TrashFill class="text-xl" />
              {/if}
            </button>
          </form>
        </div>
      </div>
    {/if}
  </div>

  {#if data.listens.length > 0}
    <div
      class="mt-6 flex items-center gap-1 px-2 text-center text-xl font-bold"
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 500 }}
    >
      <History class="text-base" />
      Listening history
    </div>
    <div
      class="mb-4 gap-1 text-balance px-2 text-center font-bold"
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 500 }}
    >
      Total listening time: {data.totalListeningTime
        ? getReadableTime(data.totalListeningTime)
        : '-'}
    </div>

    <div class="flex w-full max-w-3xl flex-none flex-col pb-2">
      {#each listens as listen, index (listen.id)}
        <div class="w-full flex-none overflow-clip" animate:flip={{ duration: 200 }}>
          <TrackRow
            listenedInformation={{ lastListened: listen.updatedAt, listened: listen.listeningTime }}
            delay={listenedIndex === 0
              ? 500 + index * 30
              : Math.min(Math.abs(index - listenedIndex), index) * 30}
            track={listen.track}
          />
        </div>
      {/each}
    </div>

    {#if listens.length < data.totalListens}
      <form
        method="POST"
        action="?/getListens"
        class="flex items-center justify-center p-2"
        use:enhance={handleListenSubmit}
      >
        <input type="hidden" name="from" value={listens.length} />
        <button
          class="rounded-md bg-zinc-600/20 px-4 py-1 font-semibold transition-colors hover:bg-zinc-600/50"
          type="submit"
          use:vibrate
          in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 500 }}
          disabled={listensLoading}
        >
          <div class:opacity-0={listensLoading}>
            Load more ({data.totalListens - listens.length} left)
          </div>
          {#if listensLoading}
            <div class="absolute left-1/2 top-1 -translate-x-1/2">
              <RoundRefresh class="animate-spin text-xl" />
            </div>
          {/if}
        </button>
      </form>
    {/if}
  {/if}
</div>
