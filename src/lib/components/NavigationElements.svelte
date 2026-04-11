<script lang="ts">
  import type { Component } from 'svelte';
  import type { SVGAttributes } from 'svelte/elements';

  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import type { ResolvedPathname } from '$app/types';
  import { vibrate } from '$lib/actions/vibrate';
  import { ROLE } from '$lib/shared/consts';
  import type { SignedInUser } from '$lib/shared/types';

  import RoundAdminPanelSettings from '~icons/ic/round-admin-panel-settings';
  import RoundLabel from '~icons/ic/round-label';
  import RoundLogin from '~icons/ic/round-login';
  import RoundLougout from '~icons/ic/round-logout';
  import RoundNewReleases from '~icons/ic/round-new-releases';
  import RoundPlaylistPlay from '~icons/ic/round-playlist-play';
  import RoundSearch from '~icons/ic/round-search';
  import MusicAlbumFill from '~icons/iconamoon/music-album-fill';
  import MusicArtistFill from '~icons/iconamoon/music-artist-fill';
  import ProfileFill from '~icons/iconamoon/profile-fill';

  import NavigationElement from './NavigationElement.svelte';

  interface Props {
    user?: SignedInUser | null;
    onclickedelement?: () => void;
  }

  let { user = null, onclickedelement }: Props = $props();

  type NavigationElementType = {
    href: ResolvedPathname;
    text: string;
    Icon: Component<SVGAttributes<SVGSVGElement>>;
  };

  const adminElements: NavigationElementType[] = [
    {
      href: resolve('/admin'),
      text: 'Admin',
      Icon: RoundAdminPanelSettings
    }
  ];

  const loggedInElements: NavigationElementType[] = [
    {
      href: resolve('/profile'),
      text: 'Profile',
      Icon: ProfileFill
    },
    {
      href: resolve('/search'),
      text: 'Search',
      Icon: RoundSearch
    },
    {
      href: resolve('/'),
      text: 'Albums',
      Icon: MusicAlbumFill
    },
    {
      href: resolve('/artist'),
      text: 'Artists',
      Icon: MusicArtistFill
    },
    {
      href: resolve('/tag'),
      text: 'Tags',
      Icon: RoundLabel
    },
    {
      href: resolve('/playlist'),
      text: 'Playlists',
      Icon: RoundPlaylistPlay
    },
    {
      href: resolve('/changelog'),
      text: 'Changelog',
      Icon: RoundNewReleases
    },
    {
      href: resolve('/logout'),
      text: 'Logout',
      Icon: RoundLougout
    }
  ];

  const loggedOutElements: NavigationElementType[] = [
    {
      href: resolve('/login'),
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
