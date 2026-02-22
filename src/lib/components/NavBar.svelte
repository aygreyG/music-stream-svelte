<script lang="ts">
  import type { SignedInUser } from '$lib/shared/types';
  import { fade, fly } from 'svelte/transition';
  import RoundMenu from '~icons/ic/round-menu';
  import RoundClose from '~icons/ic/round-close';
  import NavigationElements from './NavigationElements.svelte';
  import { vibrate } from '$lib/actions/vibrate';
  import { quintOut } from 'svelte/easing';
  import AlbumImage from './AlbumImage.svelte';
  import { beforeNavigate, goto } from '$app/navigation';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  interface Props {
    user?: SignedInUser | null;
  }

  let { user = null }: Props = $props();
  let open: boolean = $state(false);
  const audioPlayer = getAudioPlayer();

  beforeNavigate((navigation) => {
    if (open) {
      navigation.cancel();
      open = false;
    }
  });
</script>

<div class="h-sm:w-48 hidden h-full w-48 flex-none flex-col gap-1 sm:flex md:w-60">
  <div
    class="h-md:h-full h-md:shrink bg-surface flex h-full flex-col gap-2 overflow-y-auto rounded-xl p-4 transition-colors duration-500"
  >
    <NavigationElements {user} />
  </div>

  <div
    class="h-sm:size-48 bg-surface hidden size-48 flex-none overflow-hidden rounded-xl transition-colors duration-500 sm:block md:size-60"
  >
    {#if audioPlayer.currentTrack && user}
      {#key audioPlayer.currentTrack.id}
        <div
          in:fly|global={{ duration: 300, easing: quintOut, x: -20, delay: 300 }}
          out:fly={{ duration: 300, easing: quintOut, x: 20 }}
          class="flex h-full w-full overflow-hidden rounded-xl"
        >
          <a
            title={audioPlayer.currentTrack.album.title}
            class="h-full w-full"
            href="/album/{audioPlayer.currentTrack.album.id}"
          >
            <AlbumImage album={audioPlayer.currentTrack.album} />
          </a>
          <div
            class="text-on-surface absolute bottom-0 left-0 flex w-full flex-col justify-end gap-0.5 p-2 text-center"
          >
            <a
              href="/album/{audioPlayer.currentTrack.album.id}"
              class="bg-surface/80 z-10 overflow-hidden rounded-[10px] px-1 text-ellipsis whitespace-nowrap backdrop-blur-xs"
              title={audioPlayer.currentTrack.title}
            >
              {audioPlayer.currentTrack.title}
            </a>
            <div
              class="bg-surface/80 z-10 overflow-hidden rounded-md px-1 text-xs text-nowrap text-ellipsis backdrop-blur-xs"
            >
              {#each audioPlayer.currentTrack.artists.toSorted( (a, _) => (a.name !== audioPlayer.currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                {@const shouldHaveComma =
                  audioPlayer.currentTrack.artists.length > 1 &&
                  index != audioPlayer.currentTrack.artists.length - 1}
                <button
                  title={artist.name}
                  class={['hover:underline', shouldHaveComma && 'mr-1']}
                  onclick={() => goto(`/artist/${artist.id}`)}
                >
                  {artist.name}{#if shouldHaveComma},{/if}
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
  class="bg-surface-variant absolute top-24 -right-1 z-50 flex items-center justify-center rounded-s-xl shadow-md backdrop-blur-md transition-colors duration-300 sm:hidden"
>
  <button use:vibrate onclick={() => (open = !open)}>
    {#if open}
      <RoundClose
        class="text-on-surface-variant hover:text-primary active:text-primary text-4xl transition-colors duration-500"
      />
    {:else}
      <RoundMenu
        class="text-on-surface-variant hover:text-primary active:text-primary text-4xl transition-colors duration-500"
      />
    {/if}
  </button>
</div>

<div
  class="bg-surface/95 absolute top-0 z-40 flex h-[calc(100%-11.25rem)] justify-center overflow-x-clip overflow-y-auto rounded-xl backdrop-blur-md transition-all duration-300 sm:hidden"
  class:w-full={open}
  class:left-0={open}
  class:w-0={!open}
  class:left-full={!open}
>
  {#if open}
    <div
      class="flex h-full flex-col items-stretch justify-center"
      transition:fade|global={{ duration: 200 }}
    >
      <NavigationElements onclickedelement={() => (open = false)} {user} />
    </div>
  {/if}
</div>
