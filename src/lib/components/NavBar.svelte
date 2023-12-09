<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SignedInUser } from '$lib/shared/types';
  import { previous, queue } from '$lib/stores/audioPlayer';
  import NavigationElement from './NavigationElement.svelte';

  export let user: SignedInUser | null = null;

  type NavigationElement = {
    href: string;
    text: string;
  };

  const navigationElements: NavigationElement[] = [];

  const loggedInElements: NavigationElement[] = [
    {
      href: '/',
      text: 'Albums'
    },
    {
      href: '/artist',
      text: 'Artists'
    },
    {
      href: '/logout',
      text: 'Logout'
    }
  ];

  const loggedOutElements: NavigationElement[] = [
    {
      href: '/login',
      text: 'Login'
    }
  ];
</script>

<div class="w-4/12 xl:w-3/12 sm:flex flex-col h-full gap-1 hidden">
  <div class="bg-zinc-900/95 p-4 rounded-md flex flex-col gap-2">
    {#if user}
      <p class="font-bold">Welcome {user.username}</p>
    {/if}
    {#each navigationElements as el}
      <NavigationElement {...el} />
    {/each}
    {#if user}
      {#each loggedInElements as el}
        {#if el.href === '/logout'}
          <form method="POST" action="/logout" use:enhance>
            <button type="submit">{el.text}</button>
          </form>
        {:else}
          <NavigationElement {...el} />
        {/if}
      {/each}
    {:else}
      {#each loggedOutElements as el}
        <NavigationElement {...el} />
      {/each}
    {/if}
  </div>
  <div class="bg-zinc-900/95 p-2 rounded-md min-h-fit h-full overflow-auto">
    {#each $previous as { album, track }}
      <div>
        {track.artists.map((a) => a.name).join(', ')} - {track.title}
      </div>
    {/each}
    {#each $queue as { album, track }}
      <div>
        {track.artists.map((a) => a.name).join(', ')} - {track.title}
      </div>
    {/each}
  </div>
</div>
