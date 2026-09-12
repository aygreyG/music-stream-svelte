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
  import HeartFill from '~icons/iconamoon/heart-fill';
  import HistoryFill from '~icons/iconamoon/history-fill';
  import MusicAlbumFill from '~icons/iconamoon/music-album-fill';
  import MusicArtistFill from '~icons/iconamoon/music-artist-fill';
  import SettingsFill from '~icons/iconamoon/settings-fill';

  import NavigationElement from './NavigationElement.svelte';

  interface Props {
    user?: SignedInUser | null;
    onclickedelement?: () => void;
    variant?: 'primary' | 'utility';
    appVersion?: string;
    stretch?: boolean;
  }

  let {
    user = null,
    onclickedelement,
    variant = 'primary',
    appVersion,
    stretch = false
  }: Props = $props();

  const changelogHref = resolve('/changelog');

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

  const primaryElements: NavigationElementType[] = [
    {
      href: resolve('/search'),
      text: 'Search',
      Icon: RoundSearch
    },
    {
      href: resolve('/artist'),
      text: 'Artists',
      Icon: MusicArtistFill
    },
    {
      href: resolve('/'),
      text: 'Albums',
      Icon: MusicAlbumFill
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
      href: resolve('/favourite'),
      text: 'Favourites',
      Icon: HeartFill
    }
  ];

  const utilityElements: NavigationElementType[] = [
    {
      href: resolve('/history'),
      text: 'Listening history',
      Icon: HistoryFill
    },
    {
      href: changelogHref,
      text: 'Changelog',
      Icon: RoundNewReleases
    },
    {
      href: resolve('/settings'),
      text: 'Settings',
      Icon: SettingsFill
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

{#if variant === 'utility'}
  {#if user}
    {#if user.role === ROLE.ADMIN || user.role === ROLE.OWNER}
      {#each adminElements as el (el.href)}
        <NavigationElement
          {onclickedelement}
          iconOnly
          class={stretch ? 'min-w-0 flex-1' : undefined}
          {...el}
        />
      {/each}
    {/if}
    {#each utilityElements as el (el.href)}
      <NavigationElement
        {onclickedelement}
        iconOnly
        class={stretch ? 'min-w-0 flex-1' : undefined}
        {...el}
        subtext={el.href === changelogHref ? appVersion : undefined}
      />
    {/each}
    <form
      class={stretch ? 'min-w-0 flex-1' : 'min-w-0 flex-none'}
      method="POST"
      action="/logout"
      use:enhance
    >
      <button
        class="hover:bg-on-surface-variant/15 flex w-full items-center justify-center rounded-full p-3 text-2xl transition-colors active:scale-95 sm:p-1.5 sm:text-base"
        onclick={() => onclickedelement?.()}
        aria-label="Logout"
        title="Logout"
        type="submit"
        use:vibrate
      >
        <RoundLougout />
      </button>
    </form>
  {/if}
{:else if user}
  {#each primaryElements as el (el.href)}
    <NavigationElement {onclickedelement} {...el} />
  {/each}
{:else}
  {#each loggedOutElements as el (el.href)}
    <NavigationElement {onclickedelement} {...el} />
  {/each}
{/if}
