<script lang="ts">
  import type { SignedInUser } from '$lib/shared/types';
  import { createEventDispatcher } from 'svelte';
  import RoundLougout from 'virtual:icons/ic/round-logout';
  import RoundLogin from 'virtual:icons/ic/round-login';
  import RoundAdminPanelSettings from 'virtual:icons/ic/round-admin-panel-settings';
  import MusicArtistFill from 'virtual:icons/iconamoon/music-artist-fill';
  import MusicAlbumFill from 'virtual:icons/iconamoon/music-album-fill';
  import { enhance } from '$app/forms';
  import NavigationElement from './NavigationElement.svelte';

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
  <p class="font-bold max-sm:whitespace-nowrap max-sm:p-4 max-sm:text-3xl">
    Welcome {user.username}
  </p>
  {#if user.role === 'ADMIN' || user.role === 'OWNER'}
    {#each adminElements as el}
      <NavigationElement on:clickedelement {...el} />
    {/each}
  {/if}
  {#each loggedInElements as el}
    {#if el.href === '/logout'}
      <form method="POST" action="/logout" use:enhance>
        <button
          class="flex items-center justify-center gap-2 max-sm:text-2xl"
          on:click={() => dispatch('clickedelement')}
          type="submit"
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
