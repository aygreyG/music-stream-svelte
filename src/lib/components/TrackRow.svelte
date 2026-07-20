<script lang="ts">
  import type { Snippet } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import { invalidate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { vibrate } from '$lib/actions/vibrate';
  import { getExpressiveScheme, schemeToCSS } from '$lib/materialColors';
  import type { SignedInUser } from '$lib/shared/types';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import { deviceInfo } from '$lib/states/deviceInfo.svelte';
  import { getReadableTime, sortArtists } from '$lib/utils';

  import RoundArchive from '~icons/ic/round-archive';
  import RoundMoreVert from '~icons/ic/round-more-vert';
  import RoundPauseCircleOutline from '~icons/ic/round-pause-circle-outline';
  import RoundPlayCircleFilled from '~icons/ic/round-play-circle-filled';
  import RoundPlaylistAdd from '~icons/ic/round-playlist-add';
  import RoundRefresh from '~icons/ic/round-refresh';
  import Heart from '~icons/iconamoon/heart';
  import HeartFill from '~icons/iconamoon/heart-fill';
  import HeartOff from '~icons/iconamoon/heart-off';
  import MusicAlbumFill from '~icons/iconamoon/music-album-fill';
  import MusicArtistFill from '~icons/iconamoon/music-artist-fill';

  import type { Prisma } from '../../generated/prisma-client/client';
  import AlbumImage from './AlbumImage.svelte';
  import MenuButton, { type MenuItem } from './MenuButton.svelte';
  import PlaylistModal from './PlaylistModal.svelte';
  import PlaylistTrackList from './PlaylistTrackList.svelte';
  import Portal from './Portal.svelte';

  type TrackRowType = Prisma.TrackGetPayload<{
    select: {
      id: true;
      title: true;
      length: true;
      trackNumber: true;
      artists: { select: { name: true; id: true } };
      album: {
        select: {
          id: true;
          title: true;
          albumArtist: { select: { name: true; id: true } };
          albumArtId: true;
          albumArt: true;
          tracks: {
            select: { id: true; title: true; artists: { select: { name: true; id: true } } };
          };
        };
      };
    };
  }>;

  type ListenedType = { listened: number; lastListened: Date | null };

  interface Props {
    track: TrackRowType;
    index?: number | null;
    delay?: number;
    listenedInformation?: ListenedType;
    handleClick?: () => void;
    button?: Snippet;
    showAlbumName?: boolean;
    showPlayState?: boolean;
    isMigrated?: boolean;
    user?: SignedInUser | null;
    currentAlbumId?: string;
    currentPlaylistId?: string;
  }

  const player = getAudioPlayer();

  let {
    track,
    index = null,
    delay = (index || 0) * 30,
    listenedInformation = { listened: 0, lastListened: null },
    handleClick = () => {
      player.playTrack(
        track.album.tracks.map((t) => ({ ...t, album: track.album })),
        track.album.tracks.findIndex((t) => t.id === track.id)
      );
    },
    button,
    showAlbumName = true,
    showPlayState = true,
    isMigrated = false,
    user = null,
    currentAlbumId,
    currentPlaylistId
  }: Props = $props();

  let schemeStyle = $state('');
  let favouriteLoading = $state(false);

  let isFavourited = $derived(user?.favouriteTracks.some((t) => t.id === track.id) ?? false);

  async function toggleFavourite() {
    if (!user) return;
    favouriteLoading = true;
    try {
      const res = await fetch(`/api/favourite/${track.id}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (player.playlistInfo?.id === 'favourites') {
          if (!data.favourited) {
            player.removeFromQueue(track.id);
          } else {
            player.addToQueue(track);
          }
        }
        await invalidate('load:main');
      }
    } finally {
      favouriteLoading = false;
    }
  }

  function handlePlaylistChange(playlistId: string, added: boolean) {
    if (player.playlistInfo?.id === playlistId) {
      if (added) {
        player.addToQueue(track);
      } else {
        player.removeFromQueue(track.id);
      }
    }
  }

  async function removeFromPlaylist() {
    if (!currentPlaylistId) return;
    const res = await fetch(`/api/playlist/${currentPlaylistId}/track`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: track.id })
    });
    if (res.ok) {
      if (player.playlistInfo?.id === currentPlaylistId) {
        player.removeFromQueue(track.id);
      }
      await invalidate('load:main');
    }
  }

  $effect(() => {
    getExpressiveScheme(track.album.id, track.album.albumArtId).then((scheme) => {
      schemeStyle = schemeToCSS(scheme);
    });
  });

  let indexed = $derived(index !== null);
  let hasButton = $derived(!!button);
  let playlistModalOpen = $state(false);

  let menuItems = $derived.by<MenuItem[]>(() => {
    const sortedArtists = sortArtists(track.artists, track.album.albumArtist.name);

    return [
      {
        label: isFavourited ? 'Remove from favourites' : 'Add to favourites',
        icon: isFavourited ? HeartFill : Heart,
        loading: favouriteLoading,
        onclick: toggleFavourite,
        key: 'favourite',
        closeOnSelect: false
      },
      {
        label: 'Add to playlist',
        key: 'add-to-playlist',
        subMenu: playlistSubview,
        icon: RoundPlaylistAdd,
        onclick: () => {
          playlistModalOpen = true;
        }
      },
      {
        label: 'Remove from playlist',
        key: 'remove-from-playlist',
        icon: HeartOff,
        onclick: removeFromPlaylist,
        hidden: !currentPlaylistId
      },
      {
        label: 'Go to artist',
        key: 'artists',
        subItems: sortedArtists.map((artist) => ({
          label: artist.name,
          href: resolve(`/(app)/(authed)/artist/[id]`, { id: artist.id }),
          key: artist.id,
          icon: MusicArtistFill
        })),
        icon: MusicArtistFill,
        hidden: sortedArtists.length < 2
      },
      {
        label: sortedArtists[0].name,
        icon: MusicArtistFill,
        href: resolve(`/(app)/(authed)/artist/[id]`, { id: sortedArtists[0].id }),
        key: sortedArtists[0].id,
        hidden: sortedArtists.length > 1
      },
      {
        label: track.album.title,
        icon: MusicAlbumFill,
        href: resolve(`/(app)/(authed)/album/[id]`, { id: track.album.id }),
        key: `album-${track.album.id}`,
        hidden: track.album.id === currentAlbumId
      }
    ];
  });
</script>

{#snippet trackHeader()}
  <div class="mb-3 flex items-center gap-3">
    <div class="size-12 flex-none overflow-clip rounded-md">
      <AlbumImage album={track.album} maxSize="s" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="line-clamp-1 font-bold">
        {track.title}
      </div>
      <div class="line-clamp-1 text-xs">
        {sortArtists(track.artists, track.album.albumArtist.name)
          .map((a) => a.name)
          .join(', ')}
      </div>
    </div>
  </div>
{/snippet}

{#snippet playlistSubview()}
  <PlaylistTrackList {user} trackId={track.id} onplaylistchange={handlePlaylistChange} />
{/snippet}

<div
  in:fly|global={{
    duration: 500,
    x: -20,
    easing: quintOut,
    delay
  }}
  tabindex="0"
  role="button"
  onkeydown={(e) => {
    if (e.key === 'Enter' && player.currentTrack?.id !== track.id) handleClick();
  }}
  ondblclick={() => {
    if (player.currentTrack?.id !== track.id) handleClick();
  }}
  use:vibrate
  class={[
    'group flex h-16 w-full flex-none cursor-default items-center rounded-md from-transparent via-zinc-600/10 to-transparent transition-colors select-none hover:bg-linear-to-r focus-visible:bg-linear-to-r',
    showPlayState && player.currentTrack?.id === track.id && 'bg-linear-to-r',
    !indexed && 'px-4',
    (!!user || hasButton) && 'pr-2'
  ]}
  style={schemeStyle}
>
  {#if indexed}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onclick={() => {
        if (deviceInfo.isMobile.current) {
          handleClick();
        }
      }}
      class="flex h-full w-8 items-center justify-center"
      use:vibrate
    >
      {#if track.trackNumber !== null}
        {track.trackNumber}
      {:else if index !== null}
        {index + 1}
      {/if}
    </div>
  {/if}

  <div class="flex size-12 flex-none items-center justify-center">
    {#if showPlayState && player.currentTrack?.id === track.id}
      {#if player.paused}
        <button
          class="text-primary/70 hover:text-primary z-10 flex items-center justify-center"
          onclick={() => player.togglePlay()}
          use:vibrate
        >
          <RoundPlayCircleFilled class="text-center text-3xl" />
        </button>
      {:else}
        <button
          class="text-primary/70 hover:text-primary z-10 flex items-center justify-center"
          onclick={() => player.togglePlay()}
          use:vibrate
        >
          <RoundPauseCircleOutline class="text-center text-3xl" />
        </button>
      {/if}
    {:else}
      <button
        class="text-primary/50 hover:text-primary z-10 flex items-center justify-center opacity-0 group-hover:opacity-100"
        onclick={() => handleClick()}
        use:vibrate
      >
        <RoundPlayCircleFilled class="overflow-clip text-center text-3xl" />
      </button>
      <div
        class="pointer-events-none absolute top-0 left-0 z-0 h-12 w-12 overflow-hidden rounded-md group-hover:opacity-0"
      >
        <AlbumImage album={track.album} maxSize="s" />
      </div>
      <div
        class="pointer-events-none absolute top-0 left-0 z-0 h-12 w-12 overflow-hidden rounded-md opacity-0 group-hover:opacity-20"
      >
        <AlbumImage album={track.album} blur maxSize="s" />
      </div>
    {/if}
  </div>

  <div class="min-w-0 flex-1 pl-2">
    <button
      onclick={() => {
        if (deviceInfo.isMobile.current) {
          handleClick();
        }
      }}
      class="w-full cursor-default overflow-hidden text-start font-bold text-ellipsis whitespace-nowrap"
      use:vibrate
    >
      {track.title}
    </button>
    <div class="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap">
      {#each sortArtists(track.artists, track.album.albumArtist.name) as artist, index (artist.id)}
        {@const shouldHaveComma = track.artists.length > 1 && index != track.artists.length - 1}
        <a
          class={['hover:underline', shouldHaveComma && 'mr-1']}
          href={resolve(`/(app)/(authed)/artist/[id]`, { id: artist.id })}
        >
          {artist.name}{#if shouldHaveComma},{/if}
        </a>
      {/each}
      {#if showAlbumName}
        -
        <a
          href={resolve(`/(app)/(authed)/album/[id]`, { id: track.album.id })}
          class="hover:underline"
        >
          {track.album.title}
        </a>
      {/if}
    </div>
    {#if listenedInformation.lastListened}
      <div class="flex w-full justify-between text-xs font-medium whitespace-nowrap">
        <div class="flex items-center gap-1">
          {listenedInformation.lastListened.toLocaleString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })}
          {#if isMigrated}
            <span title="Migrated from previous listening history">
              <RoundArchive class="text-on-surface-variant text-sm" />
            </span>
          {/if}
        </div>
        <div
          class="translate-x-14 overflow-hidden text-ellipsis"
          title={getReadableTime(listenedInformation.listened)}
        >
          {getReadableTime(listenedInformation.listened)}
        </div>
      </div>
    {/if}
  </div>

  <button
    onclick={() => {
      if (deviceInfo.isMobile.current) {
        handleClick();
      }
    }}
    class="w-14 flex-none cursor-default pl-2 text-sm"
    use:vibrate
  >
    {new Date(track.length * 1000).toISOString().slice(14, 19)}
  </button>

  {#if hasButton}
    <div class="w-8 flex-none">
      {@render button?.()}
    </div>
  {/if}

  {#if !!user}
    <button
      class="hidden w-8 flex-none items-center justify-center sm:flex"
      onclick={(e) => {
        e.stopPropagation();
        toggleFavourite();
      }}
      disabled={favouriteLoading}
      aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
      use:vibrate
    >
      {#if favouriteLoading}
        <RoundRefresh class="animate-spin text-lg" />
      {:else if isFavourited}
        <HeartFill class="hover:text-primary text-lg transition-colors" />
      {:else}
        <Heart
          class="hover:text-primary text-lg opacity-50 transition-all group-hover:opacity-100"
        />
      {/if}
    </button>

    <MenuButton
      bottomSheetHeader={trackHeader}
      contentProps={{ align: 'end', style: schemeStyle }}
      items={menuItems}
    >
      <RoundMoreVert class="text-lg opacity-50 transition-opacity group-hover:opacity-100" />
    </MenuButton>
  {/if}
</div>

<Portal class="text-on-surface" style={schemeStyle}>
  <PlaylistModal
    open={playlistModalOpen}
    {user}
    trackId={track.id}
    trackTitle={track.title}
    onclose={() => (playlistModalOpen = false)}
    onplaylistchange={handlePlaylistChange}
  />
</Portal>
