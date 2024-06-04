<script lang="ts">
  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import { quintOut } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';
  import ThemeChanger from './ThemeChanger.svelte';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import Accordion from '$lib/components/Accordion.svelte';
  import { getReadableTime } from '$lib/utils';

  export let data;
  export let form;

  let deleteClicked = false;
  let deleteTimeout: string | number | NodeJS.Timeout | undefined;

  let loading = false;
  let showThemeChanger = false;
  let showPasswordChanger = false;
  let showProfileUpdater = false;
</script>

<div class="flex h-full w-full flex-col items-center overflow-auto p-2">
  <div class="flex w-full max-w-lg flex-col">
    <div class="p-2 text-center text-xl font-bold">Profile</div>

    <Accordion title="Update Profile">
      <div
        transition:slide={{ duration: 300, easing: quintOut }}
        class="flex w-full flex-none justify-center"
      >
        <form
          class="flex w-full select-none flex-col gap-2 rounded-b-md bg-zinc-600/10 p-4 transition-all"
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
      <div
        transition:slide={{ duration: 300, easing: quintOut }}
        class="flex w-full flex-none justify-center"
      >
        <form
          class="flex w-full select-none flex-col gap-2 rounded-b-md bg-zinc-600/10 p-4"
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
      <ThemeChanger ownerTheme={data.ownerTheme} owner={data.user?.role === 'OWNER'} />
    </Accordion>
  </div>

  {#if data.listens.length > 0}
    <div
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 500 }}
      class="mt-2 p-2 text-center text-xl font-bold"
    >
      Listens
    </div>
    <div>
      Listened for: {getReadableTime(
        data.listens.reduce((acc, listen) => acc + listen.listeningTime, 0)
      )}
    </div>

    {#each data.listens as listen}
      <TrackRow track={listen.track} />
      {getReadableTime(listen.listeningTime)}
    {/each}
  {/if}

  {#if data.user?.role !== 'OWNER'}
    <div class="mt-4 flex w-full max-w-lg flex-col items-center">
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
          class="w-full"
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
    </div>
  {/if}
</div>
