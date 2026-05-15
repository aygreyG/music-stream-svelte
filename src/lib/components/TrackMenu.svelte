<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getExpressiveScheme, schemeToCSS } from '$lib/materialColors';
  import type { SignedInUser } from '$lib/shared/types';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  import RoundPlaylistAdd from '~icons/ic/round-playlist-add';
  import Heart from '~icons/iconamoon/heart';
  import HeartFill from '~icons/iconamoon/heart-fill';
  import HeartOff from '~icons/iconamoon/heart-off';
  import MusicAlbumFill from '~icons/iconamoon/music-album-fill';
  import MusicArtistFill from '~icons/iconamoon/music-artist-fill';

  import type { Prisma } from '../../generated/prisma-client/client';
  import AlbumImage from './AlbumImage.svelte';
  import MenuButton, { type MenuOption } from './MenuButton.svelte';
  import PlaylistModal from './PlaylistModal.svelte';
  import PlaylistTrackList from './PlaylistTrackList.svelte';
  import Portal from './Portal.svelte';

  type TrackMenuTrack = Prisma.TrackGetPayload<{
    select: {
      id: true;
      title: true;
      artists: { select: { id: true; name: true } };
      album: {
        select: {
          id: true;
          title: true;
          albumArtist: { select: { id: true; name: true } };
          albumArtId: true;
          albumArt: true;
        };
      };
    };
  }>;

  interface Props {
    track: TrackMenuTrack;
    user: SignedInUser | null;
    open: boolean;
    onclose: () => void;
    anchor?: HTMLElement | null;
    currentAlbumId?: string;
    currentPlaylistId?: string;
  }

  let {
    track,
    user,
    open,
    onclose,
    anchor = null,
    currentAlbumId,
    currentPlaylistId
  }: Props = $props();

  const audioPlayer = getAudioPlayer();

  let schemeStyle = $state('');

  $effect(() => {
    getExpressiveScheme(track.album.id, track.album.albumArtId).then((scheme) => {
      schemeStyle = schemeToCSS(scheme);
    });
  });

  let favouriteLoading = $state(false);
  let playlistModalOpen = $state(false);

  let isFavourited = $derived(user?.favouriteTracks.some((t) => t.id === track.id) ?? false);

  const menuOptions = $derived.by<MenuOption[]>(() => {
    const mo: MenuOption[] = [
      {
        label: isFavourited ? 'Remove from favourites' : 'Add to favourites',
        icon: isFavourited ? HeartFill : Heart,
        loading: favouriteLoading,
        onclick: toggleFavourite
      },
      {
        label: 'Add to playlist',
        icon: RoundPlaylistAdd,
        submenu: { title: 'Add to playlist', content: playlistSubview },
        onclick: () => {
          playlistModalOpen = true;
          onclose();
        }
      },
      {
        label: 'Remove from playlist',
        icon: HeartOff,
        hidden: !currentPlaylistId,
        onclick: removeFromPlaylist
      },
      {
        label: track.album.title,
        icon: MusicAlbumFill,
        hidden: track.album.id === currentAlbumId,
        href: resolve(`/(app)/(authed)/album/[id]`, { id: track.album.id })
      }
    ];

    if (track.artists.length > 1) {
      mo.push({
        label: 'Go to artist',
        icon: MusicArtistFill,
        submenu: { title: 'Go to artist', content: artistsSubview },
        desktopSubmenu: true,
        onclick: () => {}
      });
    } else {
      mo.push({
        label: track.album.albumArtist.name,
        icon: MusicArtistFill,
        href: resolve(`/(app)/(authed)/artist/[id]`, { id: track.album.albumArtist.id })
      });
    }

    return mo;
  });

  async function toggleFavourite() {
    if (!user) return;
    favouriteLoading = true;
    try {
      const res = await fetch(`/api/favourite/${track.id}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        // Sync queue if playing favourites
        if (audioPlayer.playlistInfo?.id === 'favourites') {
          if (!data.favourited) {
            audioPlayer.removeFromQueue(track.id);
          } else {
            audioPlayer.addToQueue(track);
          }
        }
        await invalidate('load:main');
      }
    } finally {
      favouriteLoading = false;
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
      if (audioPlayer.playlistInfo?.id === currentPlaylistId) {
        audioPlayer.removeFromQueue(track.id);
      }
      await invalidate('load:main');
      onclose();
    }
  }

  function handlePlaylistChange(playlistId: string, added: boolean) {
    if (audioPlayer.playlistInfo?.id === playlistId) {
      if (added) {
        audioPlayer.addToQueue(track);
      } else {
        audioPlayer.removeFromQueue(track.id);
      }
    }
  }
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
        {track.artists.map((a) => a.name).join(', ')}
      </div>
    </div>
  </div>
{/snippet}

{#snippet playlistSubview()}
  <PlaylistTrackList {user} trackId={track.id} onplaylistchange={handlePlaylistChange} />
{/snippet}

{#snippet artistsSubview()}
  <div class="flex flex-col">
    {#each track.artists as artist (artist.id)}
      <a
        href={resolve(`/(app)/(authed)/artist/[id]`, { id: artist.id })}
        class="hover:bg-on-surface/10 flex items-center gap-3 px-3 py-2 text-sm transition-colors"
      >
        <MusicArtistFill class="shrink-0 text-lg" />
        <span>{artist.name}</span>
      </a>
    {/each}
  </div>
{/snippet}

<MenuButton
  {open}
  {onclose}
  {anchor}
  options={menuOptions}
  header={trackHeader}
  style={schemeStyle}
/>

<!-- Desktop: PlaylistModal portaled separately -->
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
