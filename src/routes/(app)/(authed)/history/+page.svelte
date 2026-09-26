<script lang="ts">
  import type { SubmitFunction } from '@sveltejs/kit';
  import { onMount } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { SvelteSet } from 'svelte/reactivity';
  import { fly, slide } from 'svelte/transition';

  import { enhance } from '$app/forms';
  import { vibrate } from '$lib/actions/vibrate';
  import TrackRow from '$lib/components/TrackRow.svelte';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import { getReadableTime } from '$lib/utils';

  import RoundArrowDropUp from '~icons/ic/round-arrow-drop-up';
  import RoundCalendarToday from '~icons/ic/round-calendar-today';
  import RoundRefresh from '~icons/ic/round-refresh';
  import History from '~icons/iconamoon/history';

  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

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
    mounted = true;
  });
</script>

<div class="flex h-full w-full flex-col items-center overflow-auto">
  <div
    class="flex items-center gap-1 p-2 text-center text-xl font-bold"
    in:fly|global={{ duration: 500, y: -10, easing: quintOut }}
  >
    <History class="text-base" />
    Listening history
  </div>
  <div
    class="mb-4 gap-1 px-2 text-center font-bold text-balance"
    in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 30 }}
  >
    Total listening time: {data.totalListeningTime ? getReadableTime(data.totalListeningTime) : '-'}
  </div>

  {#if sessions.length > 0}
    <div class="flex w-full max-w-3xl flex-none flex-col pb-2">
      {#each groupedSessions as group, groupIndex (group.label)}
        <div
          class="bg-surface sticky top-0 z-20 mx-2 pt-2 text-sm font-bold"
          in:fly|global={{
            duration: 500,
            x: -20,
            easing: quintOut,
            delay: Math.min(60 + groupIndex * 80, 1000)
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
          {@const groupBaseDelay = !mounted ? 110 + groupIndex * 80 : 0}
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
          in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 400 }}
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
  {:else}
    <div class="flex h-full items-center px-4 text-center text-lg">
      You haven't listened to any music yet.
    </div>
  {/if}
</div>
