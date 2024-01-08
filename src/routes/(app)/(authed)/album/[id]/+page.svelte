<script lang="ts">
  import RoundPlayCircleFilled from 'virtual:icons/ic/round-play-circle-filled';
  import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
  import RoundMoreVert from 'virtual:icons/ic/round-more-vert';
  import { currentTrack, paused, playTrack } from '$lib/stores/audioPlayer.js';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicInOut, quintOut } from 'svelte/easing';
  import { crossfade } from '$lib/transitions/crossfade';
  const [send, receive] = crossfade;

  export let data;
  let animate: boolean = false;
  let albumAnimating: boolean = false;

  onMount(() => {
    animate = true;
  });
</script>

{#key data.album.id}
  <div class="absolute top-0 left-0 w-full flex flex-col overflow-hidden h-full">
    {#if animate}
      <div
        in:fade|global={{ duration: 500, easing: cubicInOut }}
        class="absolute top-0 left-0 h-full w-full opacity-10"
      >
        <AlbumImage blur alt="Backdrop for {data.album.title}" id={data.album.id} maxSize="s" />
      </div>
    {/if}
    <div class="flex flex-col gap-6 p-4 pb-0 h-full">
      <div
        class="flex items-center justify-center md:justify-start gap-6"
        in:fade|global={{ duration: 500, easing: cubicInOut }}
      >
        <div
          class="w-32 h-32 rounded-md overflow-hidden"
          class:z-20={albumAnimating}
          in:receive|global={{ key: `album-image-${data.album.id}` }}
          on:introstart={() => (albumAnimating = true)}
          on:introend={() => (albumAnimating = false)}
        >
          <AlbumImage alt={data.album.title} id={data.album.id} />
        </div>
        <div class="flex flex-col">
          <div>
            {data.album.title}
          </div>
          <a class="hover:underline" href="/artist/{data.album.albumArtistId}">
            {data.album.albumArtist.name}
          </a>
          <div>
            {data.album.releaseDate}
          </div>
        </div>
        <div class="absolute top-0 right-0 bg-zinc-600/20 gap-2 flex rounded-md">
          <button>
            <RoundMoreVert
              class="text-3xl text-fuchsia-600/70 hover:text-fuchsia-600 transition-colors"
            />
          </button>
        </div>
      </div>

      <div class="h-full w-full overflow-auto pb-2">
        <table class="table-auto w-full">
          <thead>
            {#if animate}
              <tr
                in:fly|global={{ duration: 300, easing: quintOut, x: -20, delay: 100 }}
                class="sticky top-0 text-left left-0 z-10"
              >
                <th
                  class="p-1 text-center rounded-md bg-zinc-900/80 backdrop-blur-md border-e-2 border-e-transparent hidden sm:table-cell"
                >
                  #
                </th>
                <th class="p-1 rounded-s-md bg-zinc-900/80 backdrop-blur-md">Title</th>
                <th class="p-1 bg-zinc-900/80 backdrop-blur-md">Artist</th>
                <th class="rounded-e-md p-1 bg-zinc-900/80 backdrop-blur-md">Length</th>
              </tr>
            {/if}
          </thead>
          <tbody class="overflow-y-auto h-full select-none">
            {#each data.album.tracks as track, index (track.id)}
              {#if animate}
                <tr
                  on:dblclick={() => playTrack(track, data.album, true)}
                  class="cursor-pointer sm:cursor-auto group"
                  in:fly|global={{
                    duration: 300,
                    easing: quintOut,
                    x: -20,
                    delay: 100 + 50 * index
                  }}
                >
                  <td
                    class="hidden w-10 sm:table-cell group-hover:bg-gradient-to-r from-transparent to-zinc-600/5"
                  >
                    {#if $currentTrack?.track.id === track.id}
                      {#if $paused}
                        <button
                          class="text-fuchsia-600/70 hover:text-fuchsia-600 flex items-center justify-center"
                          on:click={() => ($paused = false)}
                        >
                          <RoundPlayCircleFilled class="text-3xl transition-colors" />
                        </button>
                      {:else}
                        <button
                          class="text-fuchsia-600/70 hover:text-fuchsia-600 flex items-center justify-center"
                          on:click={() => ($paused = true)}
                        >
                          <RoundPauseCircleOutline class="text-3xl transition-colors" />
                        </button>
                      {/if}
                    {:else}
                      <div class="group-hover:hidden group-target:hidden text-center">
                        {track.trackNumber}
                      </div>
                      <button
                        class="hidden group-target:flex group-hover:flex text-zinc-600 hover:text-fuchsia-600 items-center justify-center"
                        on:click={() => playTrack(track, data.album, true)}
                      >
                        <RoundPlayCircleFilled class="text-3xl transition-colors" />
                      </button>
                    {/if}
                  </td>
                  <td
                    class="group-hover:bg-zinc-600/5"
                    on:click={() => {
                      if (matchMedia('(max-width: 640px)').matches) {
                        playTrack(track, data.album, true);
                      }
                    }}
                  >
                    <div class="flex items-center p-1 gap-2">
                      {#if $currentTrack?.track.id === track.id}
                        {#if $paused}
                          <button
                            class="sm:hidden text-fuchsia-600/70 hover:text-fuchsia-600 flex items-center w-10 h-10 justify-center"
                            on:click={() => ($paused = false)}
                          >
                            <RoundPlayCircleFilled class="text-3xl transition-colors" />
                          </button>
                        {:else}
                          <button
                            class="sm:hidden text-fuchsia-600/70 hover:text-fuchsia-600 flex items-center justify-center w-10 h-10"
                            on:click={() => ($paused = true)}
                          >
                            <RoundPauseCircleOutline class="text-3xl transition-colors" />
                          </button>
                        {/if}
                      {:else}
                        <div class="flex-none h-10 w-10 rounded-md sm:hidden overflow-hidden">
                          <AlbumImage alt={data.album.title} id={data.album.id} maxSize="s" />
                        </div>
                      {/if}
                      <div class="flex-none h-10 w-10 rounded-md hidden sm:block overflow-hidden">
                        <AlbumImage alt={data.album.title} id={data.album.id} maxSize="s" />
                      </div>
                      {track.title}
                    </div>
                  </td>
                  <td class="group-hover:bg-zinc-600/5 p-1">
                    {#each track.artists.sort( (a, b) => (a.name !== data.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                      <a class="hover:underline" href="/artist/{artist.id}">
                        {artist.name}{#if track.artists.length > 1 && index != track.artists.length - 1},{/if}
                      </a>
                    {/each}
                  </td>
                  <td
                    class="group-hover:bg-gradient-to-r to-transparent from-zinc-600/5 p-1"
                    on:click={() => {
                      if (matchMedia('(hover: none), (pointer: coarse)').matches) {
                        playTrack(track, data.album, true);
                      }
                    }}
                  >
                    {new Date(track.length * 1000).toISOString().slice(14, 19)}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/key}
