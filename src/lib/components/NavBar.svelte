<script lang="ts">
  import type { SignedInUser } from '$lib/shared/types';
  import { fade, fly } from 'svelte/transition';
  import RoundMenu from 'virtual:icons/ic/round-menu';
  import RoundClose from 'virtual:icons/ic/round-close';
  import NavigationElements from './NavigationElements.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { vibrate } from '$lib/actions/vibrate';
  import { quintOut } from 'svelte/easing';
  import AlbumImage from './AlbumImage.svelte';
  import { beforeNavigate, goto } from '$app/navigation';
  import { stopPropagation } from '$lib/utils';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  interface Props {
    user?: SignedInUser | null;
  }

  let { user = null }: Props = $props();
  let open: boolean = $state(false);
  let animate = $state(false);
  let playlistTransitioning = $state(false);
  const audioPlayer = getAudioPlayer();

  onMount(() => {
    animate = true;
  });

  beforeNavigate((navigation) => {
    if (open) {
      navigation.cancel();
      open = false;
    }
  });
</script>

<div class="hidden h-full w-48 flex-none flex-col gap-1 sm:flex md:w-60 h-sm:w-48">
  <div
    class="flex flex-col gap-2 overflow-y-auto rounded-md bg-zinc-900/95 p-4 h-md:h-full h-md:flex-shrink"
    class:h-full={!(user && user.playlists.length > 0 && !playlistTransitioning)}
    class:flex-shrink-0={user && user.playlists.length > 0}
  >
    <NavigationElements {user} />
  </div>

  {#if user && user.playlists.length > 0}
    <div
      transition:fade={{ duration: 300 }}
      ontransitionstart={() => (playlistTransitioning = true)}
      ontransitionend={() => (playlistTransitioning = false)}
      class="h-full overflow-y-auto rounded-md bg-zinc-900/95 p-4 h-md:hidden"
    >
      <div
        ontransitionstart={stopPropagation()}
        ontransitionend={stopPropagation()}
        class="flex flex-none flex-col"
      >
        <div transition:fly|global={{ duration: 300, x: -20 }} class="font-bold">Playlists</div>
        {#each user.playlists as playlist, index (playlist.id)}
          {#if animate}
            <a
              href="/playlist/{playlist.id}"
              transition:fly|global={{ duration: 300, x: -20, delay: 30 * index }}
              class="transition-colors"
              class:text-primary={$page.url.pathname.replaceAll('/', '') ===
                `playlist${playlist.id}`}
            >
              {playlist.name}
            </a>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <div
    class="hidden size-48 flex-none overflow-hidden rounded-md bg-zinc-900/95 sm:block md:size-60 h-sm:size-48"
  >
    {#if audioPlayer.currentTrack && user}
      {#key audioPlayer.currentTrack.id}
        <div
          in:fly|global={{ duration: 300, easing: quintOut, x: -20, delay: 300 }}
          out:fly={{ duration: 300, easing: quintOut, x: 20 }}
          class="flex h-full w-full overflow-hidden rounded-md"
        >
          <a
            title={audioPlayer.currentTrack.album.title}
            class="h-full w-full"
            href="/album/{audioPlayer.currentTrack.album.id}"
          >
            <AlbumImage album={audioPlayer.currentTrack.album} />
          </a>
          <div
            class="absolute bottom-0 left-0 flex w-full flex-col justify-end gap-1 p-1 text-center"
          >
            <a
              href="/album/{audioPlayer.currentTrack.album.id}"
              class="z-10 overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-zinc-900/80 px-1 backdrop-blur-sm"
              title={audioPlayer.currentTrack.title}
            >
              {audioPlayer.currentTrack.title}
            </a>
            <div
              class="z-10 overflow-hidden text-ellipsis text-nowrap rounded-md bg-zinc-900/80 px-1 text-xs backdrop-blur-sm"
            >
              {#each audioPlayer.currentTrack.artists.sort( (a, b) => (a.name !== audioPlayer.currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                <button
                  title={artist.name}
                  class="hover:underline"
                  onclick={() => goto(`/artist/${artist.id}`)}
                >
                  {artist.name}{#if audioPlayer.currentTrack.artists.length > 1 && index != audioPlayer.currentTrack.artists.length - 1},{/if}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/key}
    {/if}
  </div>
</div>

<div
  class="absolute -right-1 top-24 z-50 flex items-center justify-center rounded-s-md bg-zinc-800/90 shadow-md backdrop-blur-md sm:hidden"
>
  <button use:vibrate onclick={() => (open = !open)}>
    {#if open}
      <RoundClose class="text-4xl text-primary/70 transition-colors hover:text-primary" />
    {:else}
      <RoundMenu class="text-4xl text-primary/70 transition-colors hover:text-primary" />
    {/if}
  </button>
</div>

<div
  class="absolute top-0 z-40 flex h-[calc(100%-11.25rem)] justify-center overflow-y-auto overflow-x-clip rounded-md bg-zinc-900/80 backdrop-blur-md transition-all duration-300 sm:hidden"
  class:w-full={open}
  class:left-0={open}
  class:w-0={!open}
  class:left-full={!open}
>
  {#if open}
    <div
      class="flex h-full flex-col items-stretch justify-center"
      transition:fade|global={{ duration: 300 }}
    >
      <NavigationElements onclickedelement={() => (open = false)} {user} />
    </div>
  {/if}
</div>
