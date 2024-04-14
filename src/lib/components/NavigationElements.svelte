<script lang="ts">
  import type { SignedInUser } from '$lib/shared/types';
  import { createEventDispatcher } from 'svelte';
  import RoundLougout from 'virtual:icons/ic/round-logout';
  import RoundLogin from 'virtual:icons/ic/round-login';
  import RoundSearch from 'virtual:icons/ic/round-search';
  import RoundAdminPanelSettings from 'virtual:icons/ic/round-admin-panel-settings';
  import RoundPlaylistPlay from 'virtual:icons/ic/round-playlist-play';
  import MusicArtistFill from 'virtual:icons/iconamoon/music-artist-fill';
  import MusicAlbumFill from 'virtual:icons/iconamoon/music-album-fill';
  import { enhance } from '$app/forms';
  import NavigationElement from './NavigationElement.svelte';
  import { vibrate } from '$lib/actions/vibrate';

  export let user: SignedInUser | null = null;

  type NavigationElementType = {
    href: string;
    text: string;
    icon: any;
  };

  const adminElements: NavigationElementType[] = [
    {
      href: '/admin',
      text: 'Admin',
      icon: RoundAdminPanelSettings
    }
  ];

  const loggedInElements: NavigationElementType[] = [
    {
      href: '/search',
      text: 'Search',
      icon: RoundSearch
    },
    {
      href: '/',
      text: 'Albums',
      icon: MusicAlbumFill
    },
    {
      href: '/artist',
      text: 'Artists',
      icon: MusicArtistFill
    },
    {
      href: '/playlist',
      text: 'Playlists',
      icon: RoundPlaylistPlay
    },
    {
      href: '/logout',
      text: 'Logout',
      icon: RoundLougout
    }
  ];

  const loggedOutElements: NavigationElementType[] = [
    {
      href: '/login',
      text: 'Login',
      icon: RoundLogin
    }
  ];

  const dispatch = createEventDispatcher();
</script>

{#if user}
  <p class="whitespace-nowrap p-4 text-3xl font-bold sm:whitespace-normal sm:p-0 sm:text-base">
    Welcome {user.username}
  </p>
  {#if user.role === 'ADMIN' || user.role === 'OWNER'}
    {#each adminElements as el}
      <NavigationElement on:clickedelement {...el} />
    {/each}
  {/if}
  {#each loggedInElements as el}
    {#if el.href === '/logout'}
      <form class="px-16 sm:px-0" method="POST" action="/logout" use:enhance>
        <button
          class="flex w-full items-center justify-start gap-2 text-2xl sm:text-base"
          on:click={() => dispatch('clickedelement')}
          type="submit"
          use:vibrate
        >
          <svelte:component this={el.icon} />
          {el.text}
        </button>
      </form>
    {:else}
      <NavigationElement on:clickedelement {...el} />
    {/if}
  {/each}
{:else}
  {#each loggedOutElements as el}
    <NavigationElement on:clickedelement {...el} />
  {/each}
{/if}
