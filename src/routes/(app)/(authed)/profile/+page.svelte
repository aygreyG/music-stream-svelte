<script lang="ts">
  import type { SubmitFunction } from '@sveltejs/kit';
  import { onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { SvelteSet } from 'svelte/reactivity';
  import { fly, slide } from 'svelte/transition';

  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import Accordion from '$lib/components/Accordion.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Portal from '$lib/components/Portal.svelte';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import { ROLE, SCHEME_TYPES } from '$lib/shared/consts';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import { getReadableTime } from '$lib/utils';

  import RoundArrowDropUp from '~icons/ic/round-arrow-drop-up';
  import RoundCalendarToday from '~icons/ic/round-calendar-today';
  import RoundRefresh from '~icons/ic/round-refresh';
  import History from '~icons/iconamoon/history';
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
  let deleteClicked = $state(false);
  let loading = $state(false);
  let sessionsLoading = $state(false);
  let collapsedGroups = new SvelteSet<string>();
  let mounted = $state(false);
  type Session = (typeof data.sessions)[number];
  type GroupedSessions = { label: string; sessions: Session[] }[];

  let extraSessions = $state.raw<Session[]>([]);

  let sessions = $derived.by<Session[]>(() => {
    // set is only used to filter out duplicate sessions
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const seen = new Set<string>();
    return [...data.sessions, ...extraSessions]
      .filter((s: Session) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .sort((a, b) => b.endedAt.getTime() - a.endedAt.getTime() || b.id.localeCompare(a.id));
  });

  let loadedSessionCount = $derived(sessions.length);

  function getDayLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  let groupedSessions = $derived.by<GroupedSessions>(() => {
    const groups: GroupedSessions = [];
    let currentLabel = '';

    for (const session of sessions) {
      const label = getDayLabel(session.startedAt);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, sessions: [] });
      }
      groups[groups.length - 1].sessions.push(session);
    }

    return groups;
  });

  const audioPlayer = getAudioPlayer();

  let latestPlayEventId = $derived.by<string | null>(() => {
    const currentTrackId = audioPlayer.currentTrack?.id;
    if (!currentTrackId) return null;

    // groupedSessions preserves sessions order (endedAt desc); iterate sessions directly.
    for (const session of sessions) {
      for (const event of session.events) {
        if (event.track.id === currentTrackId) {
          return event.id;
        }
      }
    }

    return null;
  });

  const handleSessionSubmit: SubmitFunction = () => {
    sessionsLoading = true;
    return async ({ update, result }) => {
      await update();
      sessionsLoading = false;

      if (result.type === 'success' && result.data?.sessions && result.data.sessions.length > 0) {
        extraSessions = [...extraSessions, ...result.data.sessions];
      }
    };
  };

  onMount(() => {
    selectedScheme =
      (localStorage.getItem('schemeType') as (typeof SCHEME_TYPES)[number]) || 'EXPRESSIVE';
    const localStorageDarkMode = localStorage.getItem('darkMode');
    if (localStorageDarkMode !== null) {
      darkMode = localStorageDarkMode as 'true' | 'false';
    } else {
      darkMode = 'auto';
    }

    mounted = true;
  });
</script>

<div class="flex h-full w-full flex-col items-center overflow-auto">
  <div class="flex w-full max-w-xl flex-col p-2">
    <div
      class="p-2 text-center text-xl font-bold"
      in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
    >
      Profile
    </div>

    <Accordion title="Update Profile">
      <div class="flex w-full flex-none justify-center">
        <form
          class="flex w-full flex-col gap-2 p-4 transition-all select-none"
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
      </div>
    </Accordion>

    <Accordion title="Change Password" delay={100}>
      <div class="flex w-full flex-none justify-center">
        <form
          class="flex w-full flex-col gap-2 p-4 select-none"
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

  {#if sessions.length > 0}
    <div
      class="mt-6 flex items-center gap-1 px-2 text-center text-xl font-bold"
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 400 }}
    >
      <History class="text-base" />
      Listening history
    </div>
    <div
      class="mb-4 gap-1 px-2 text-center font-bold text-balance"
      in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 430 }}
    >
      Total listening time: {data.totalListeningTime
        ? getReadableTime(data.totalListeningTime)
        : '-'}
    </div>

    <div class="flex w-full max-w-3xl flex-none flex-col pb-2">
      {#each groupedSessions as group, groupIndex (group.label)}
        <div
          class="bg-surface sticky top-0 z-20 mx-2 pt-2 text-sm font-bold"
          in:fly|global={{
            duration: 500,
            x: -20,
            easing: quintOut,
            delay: Math.min(460 + groupIndex * 80, 1000)
          }}
        >
          <button
            type="button"
            class="bg-surface-container hover:bg-surface-container/80 mb-1 flex w-full items-center gap-2 rounded-lg pr-2 pl-4 transition-colors"
            onclick={() => {
              if (collapsedGroups.has(group.label)) {
                collapsedGroups.delete(group.label);
              } else {
                collapsedGroups.add(group.label);
              }
            }}
            use:vibrate
          >
            <RoundCalendarToday class="text-on-surface-variant text-base" />
            <span class="flex-1 text-left">{group.label}</span>
            <RoundArrowDropUp
              class={[
                'text-on-surface text-3xl transition-transform duration-300',
                collapsedGroups.has(group.label) && 'rotate-180'
              ]}
            />
          </button>
        </div>

        {#if !collapsedGroups.has(group.label)}
          {@const groupBaseDelay = !mounted ? 510 + groupIndex * 80 : 0}
          <div transition:slide={{ duration: 500, easing: quintOut }}>
            {#each group.sessions as session, sessionIndex (session.id)}
              {@const isMigrated = session.startedAt.getTime() === session.endedAt.getTime()}
              <div
                in:fly|global={{
                  duration: 500,
                  x: -20,
                  easing: quintOut,
                  delay: groupBaseDelay + sessionIndex * 40
                }}
              >
                <div class="text-on-surface-variant px-4 py-1 text-xs font-medium">
                  {formatTime(session.startedAt)} - {formatTime(session.endedAt)}
                </div>
                {#each session.events as event, eventIndex (event.id)}
                  <TrackRow
                    delay={groupBaseDelay + 20 + sessionIndex * 40 + eventIndex * 25}
                    listenedInformation={{
                      lastListened: event.startedAt,
                      listened: event.listenedDuration
                    }}
                    track={event.track}
                    showPlayState={event.id === latestPlayEventId}
                    {isMigrated}
                    user={data.user}
                  />
                {/each}
              </div>
            {/each}
          </div>
        {/if}
      {/each}
    </div>

    {#if loadedSessionCount < data.totalSessions}
      <form
        method="POST"
        action="?/getSessions"
        class="flex items-center justify-center p-2"
        use:enhance={handleSessionSubmit}
      >
        <input type="hidden" name="cursorId" value={sessions[sessions.length - 1].id} />
        <button
          class="bg-surface-container hover:bg-surface-container/60 relative rounded-full px-6 py-2 font-semibold transition-colors"
          type="submit"
          use:vibrate
          in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 800 }}
          disabled={sessionsLoading}
        >
          <div class={[sessionsLoading && 'opacity-0']}>
            Load more ({data.totalSessions - loadedSessionCount} left)
          </div>
          {#if sessionsLoading}
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <RoundRefresh class="animate-spin text-xl" />
            </div>
          {/if}
        </button>
      </form>
    {/if}
  {/if}
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
