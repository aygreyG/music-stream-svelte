<script lang="ts">
  import type { SignedInUser } from '$lib/shared/types';
  import RoundLougout from '~icons/ic/round-logout';
  import RoundLogin from '~icons/ic/round-login';
  import RoundSearch from '~icons/ic/round-search';
  import RoundAdminPanelSettings from '~icons/ic/round-admin-panel-settings';
  import RoundPlaylistPlay from '~icons/ic/round-playlist-play';
  import MusicArtistFill from '~icons/iconamoon/music-artist-fill';
  import MusicAlbumFill from '~icons/iconamoon/music-album-fill';
  import ProfileFill from '~icons/iconamoon/profile-fill';
  import { enhance } from '$app/forms';
  import NavigationElement from './NavigationElement.svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import { ROLE } from '$lib/shared/consts';

  interface Props {
    user?: SignedInUser | null;
    onclickedelement?: () => void;
  }

  let { user = null, onclickedelement }: Props = $props();

  type NavigationElementType = {
    href: string;
    text: string;
    Icon: any;
  };

  const adminElements: NavigationElementType[] = [
    {
      href: '/admin',
      text: 'Admin',
      Icon: RoundAdminPanelSettings
    }
  ];

  const loggedInElements: NavigationElementType[] = [
    {
      href: '/profile',
      text: 'Profile',
      Icon: ProfileFill
    },
    {
      href: '/search',
      text: 'Search',
      Icon: RoundSearch
    },
    {
      href: '/',
      text: 'Albums',
      Icon: MusicAlbumFill
    },
    {
      href: '/artist',
      text: 'Artists',
      Icon: MusicArtistFill
    },
    {
      href: '/playlist',
      text: 'Playlists',
      Icon: RoundPlaylistPlay
    },
    {
      href: '/logout',
      text: 'Logout',
      Icon: RoundLougout
    }
  ];

  const loggedOutElements: NavigationElementType[] = [
    {
      href: '/login',
      text: 'Login',
      Icon: RoundLogin
    }
  ];
</script>

{#if user}
  {#if user.role === ROLE.ADMIN || user.role === ROLE.OWNER}
    {#each adminElements as el (el.href)}
      <NavigationElement {onclickedelement} {...el} />
    {/each}
  {/if}
  {#each loggedInElements as el (el.href)}
    {#if el.href === '/logout'}
      <form class="block" method="POST" action="/logout" use:enhance>
        <button
          class="flex items-center gap-2 rounded-2xl px-16 py-2 text-2xl font-bold transition-colors sm:px-4 sm:text-base"
          onclick={() => onclickedelement?.()}
          type="submit"
          use:vibrate
        >
          <el.Icon />
          {el.text}
        </button>
      </form>
    {:else}
      <NavigationElement {onclickedelement} {...el} />
    {/if}
  {/each}
{:else}
  {#each loggedOutElements as el (el.href)}
    <NavigationElement {onclickedelement} {...el} />
  {/each}
{/if}
