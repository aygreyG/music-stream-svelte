<script lang="ts">
  import { onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import Accordion from '$lib/components/Accordion.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Portal from '$lib/components/Portal.svelte';
  import { ROLE, SCHEME_TYPES } from '$lib/shared/consts';

  import RoundRefresh from '~icons/ic/round-refresh';
  import InformationCircleFill from '~icons/iconamoon/information-circle-fill';
  import TrashFill from '~icons/iconamoon/trash-fill';

  import type { ActionData, PageData } from './$types';

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let selectedScheme: (typeof SCHEME_TYPES)[number] = $state('EXPRESSIVE');
  let darkMode = $state<'true' | 'false' | 'auto'>('auto');
  let playbackErrorMode = $state<'normal' | 'debug' | 'off'>('normal');
  let deleteClicked = $state(false);
  let loading = $state(false);

  onMount(() => {
    selectedScheme =
      (localStorage.getItem('schemeType') as (typeof SCHEME_TYPES)[number]) || 'EXPRESSIVE';
    const localStorageDarkMode = localStorage.getItem('darkMode');
    if (localStorageDarkMode !== null) {
      darkMode = localStorageDarkMode as 'true' | 'false';
    } else {
      darkMode = 'auto';
    }
    const errorMode = localStorage.getItem('playback-error-mode');
    if (errorMode === 'debug' || errorMode === 'off' || errorMode === 'normal') {
      playbackErrorMode = errorMode;
    }
  });
</script>

<div class="flex h-full w-full flex-col items-center overflow-auto">
  <div class="flex w-full max-w-xl flex-col p-2">
    <div
      class="p-2 text-center text-xl font-bold"
      in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
    >
      Settings
    </div>

    <Accordion title="Profile Settings">
      <div class="flex w-full flex-col gap-2 p-4">
        <div class="text-lg font-bold">Update Profile</div>
        <form
          class="flex w-full flex-col gap-2 select-none"
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
            <div class="text-sm font-bold">Username</div>
            <input
              autocomplete="username"
              id="username"
              value={data.user?.username}
              class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
              name="username"
              required
            />
          </label>
          <label class="flex flex-col gap-1">
            <div class="text-sm font-bold">Email</div>
            <input
              id="email"
              autocomplete="email"
              value={data.user?.email}
              class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
              type="email"
              name="email"
              required
            />
          </label>
          <button
            class="bg-primary text-on-primary hover:bg-primary/80 disabled:bg-primary mt-2 w-full self-center rounded-md px-4 py-1 font-semibold transition-colors disabled:opacity-50"
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

        <div class="border-outline-variant/40 my-2 border-t"></div>

        <div class="text-lg font-bold">Change Password</div>
        <form
          class="flex w-full flex-col gap-2 select-none"
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
            <div class="text-sm font-bold">Current password</div>
            <input
              autocomplete="current-password"
              type="password"
              id="currentpassword"
              class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
              name="currentpassword"
              required
            />
          </label>
          <label class="flex flex-col gap-1">
            <div class="text-sm font-bold">New password</div>
            <input
              id="newpassword"
              autocomplete="new-password"
              class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
              type="password"
              name="newpassword"
              required
            />
          </label>
          <label class="flex flex-col gap-1">
            <div class="text-sm font-bold">Repeat new password</div>
            <input
              id="repeatpassword"
              autocomplete="new-password"
              class="focus-visible:ring-primary w-full rounded-xl border-none bg-zinc-600/20 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
              type="password"
              name="repeatpassword"
              required
            />
          </label>
          {#if form?.error && form.action === 'changepassword'}
            <div class="text-sm font-bold text-red-500">{form.error}</div>
          {/if}
          <button
            class="bg-primary text-on-primary hover:bg-primary/80 disabled:bg-primary mt-2 w-full self-center rounded-md px-4 py-1 font-semibold transition-colors disabled:opacity-50"
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

    <Accordion title="General" delay={100}>
      <div class="flex w-full flex-col gap-2 p-4">
        <div class="text-sm font-bold">Playback errors</div>
        <select
          class="focus-visible:ring-primary focus-within:ring-primary w-full rounded-xl border-none bg-zinc-600/20 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
          onchange={(e) => {
            const value = (e.target as HTMLSelectElement).value as typeof playbackErrorMode;
            localStorage.setItem('playback-error-mode', value);
            playbackErrorMode = value;
          }}
          value={playbackErrorMode}
        >
          <option value="normal">Normal (default)</option>
          <option value="debug">Debug (full error)</option>
          <option value="off">Off</option>
        </select>
      </div>
    </Accordion>

    <Accordion title="Color Scheme" delay={200}>
      <div class="flex w-full flex-col gap-2 p-4">
        <div class="text-sm font-bold">Choose a color scheme for the app</div>
        <select
          class="focus-visible:ring-primary focus-within:ring-primary w-full rounded-xl border-none bg-zinc-600/20 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
          onchange={(e) => {
            const value = (e.target as HTMLSelectElement).value;
            localStorage.setItem('schemeType', value);
            location.reload();
          }}
          bind:value={selectedScheme}
        >
          {#each SCHEME_TYPES as schemeType (schemeType)}
            <option value={schemeType}>
              {schemeType.charAt(0) + schemeType.slice(1).toLowerCase().replaceAll('_', ' ')}
              {#if schemeType === 'EXPRESSIVE'}
                (default)
              {/if}
            </option>
          {/each}
        </select>

        <div class="text-sm font-bold">Dark mode</div>
        <select
          class="focus-visible:ring-primary focus-within:ring-primary w-full rounded-xl border-none bg-zinc-600/20 py-1 outline-hidden transition-all hover:bg-zinc-600/50 focus-visible:ring-2"
          onchange={(e) => {
            const value = (e.target as HTMLSelectElement).value;
            if (value === 'auto') {
              localStorage.removeItem('darkMode');
            } else {
              localStorage.setItem('darkMode', value);
            }
            location.reload();
          }}
          value={darkMode}
        >
          <option value="auto">Auto (follow system preference)</option>
          <option value="true">Dark</option>
          <option value="false">Light</option>
        </select>
      </div>
    </Accordion>

    {#if data.user?.role !== ROLE.OWNER}
      <div
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 300 }}
        class="bg-surface-container mt-4 flex w-full items-center justify-between rounded-xl py-2 pr-2 pl-4"
      >
        <div class="text-center text-xl font-bold">Delete account</div>

        <div class="flex items-center justify-center">
          <button
            onclick={() => (deleteClicked = true)}
            class="w-full rounded-md bg-rose-600 px-4 py-1 font-semibold text-white transition-all"
            use:vibrate
          >
            <TrashFill class="text-2xl" />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if deleteClicked}
  <Portal>
    <Modal title="Are you sure?" onclose={() => (deleteClicked = false)}>
      <div class="flex h-full flex-col items-center justify-center gap-10 p-6">
        <div class="rounded-xl bg-rose-600/10 p-4 text-center text-sm font-bold text-rose-600">
          <InformationCircleFill class="inline align-top text-base" />
          This action cannot be undone and will delete all your data, including your listening history!
        </div>

        <div class="flex w-full items-center justify-center gap-4 max-sm:flex-col">
          <form method="POST" action="?/delete">
            <button
              type="submit"
              class="rounded-3xl bg-rose-600 px-4 py-2 font-semibold text-white transition-all"
              use:vibrate
            >
              Yes, delete my account
            </button>
          </form>
          <button
            class="bg-primary text-on-primary rounded-3xl px-4 py-2 font-semibold transition-all"
            onclick={() => (deleteClicked = false)}
            use:vibrate
          >
            No, keep my account
          </button>
        </div>
      </div>
    </Modal>
  </Portal>
{/if}
