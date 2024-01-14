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
  <div class="absolute left-0 top-0 flex h-full w-full flex-col overflow-hidden">
    {#if animate}
      <div
        in:fade|global={{ duration: 500, easing: cubicInOut }}
        class="absolute left-0 top-0 h-full w-full opacity-10"
      >
        <AlbumImage blur alt="Backdrop for {data.album.title}" id={data.album.id} maxSize="s" />
      </div>
    {/if}
    <div class="flex h-full flex-col gap-6 p-4 pb-0">
      <div
        class="flex items-center justify-center gap-6 md:justify-start"
        in:fade|global={{ duration: 500, easing: cubicInOut }}
      >
        <div
          class="h-32 w-32 overflow-hidden rounded-md"
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
        <div class="absolute right-0 top-0 flex gap-2 rounded-md bg-zinc-600/20">
          <button>
            <RoundMoreVert
              class="text-3xl text-fuchsia-600/70 transition-colors hover:text-fuchsia-600"
            />
          </button>
        </div>
      </div>

      <div class="h-full w-full overflow-auto pb-2">
        <table class="w-full table-auto">
          <thead>
            {#if animate}
              <tr
                in:fly|global={{ duration: 300, easing: quintOut, x: -20, delay: 100 }}
                class="sticky left-0 top-0 z-10 text-left"
              >
                <th
                  class="hidden rounded-md border-e-2 border-e-transparent bg-zinc-900/80 p-1 text-center backdrop-blur-md sm:table-cell"
                >
                  #
                </th>
                <th class="rounded-s-md bg-zinc-900/80 p-1 backdrop-blur-md">Title</th>
                <th class="bg-zinc-900/80 p-1 backdrop-blur-md">Artist</th>
                <th class="rounded-e-md bg-zinc-900/80 p-1 backdrop-blur-md">Length</th>
              </tr>
            {/if}
          </thead>
          <tbody class="h-full select-none overflow-y-auto">
            {#each data.album.tracks as track, index (track.id)}
              {#if animate}
                <tr
                  on:dblclick={() => playTrack(track, data.album, true)}
                  class="group cursor-pointer sm:cursor-auto"
                  in:fly|global={{
                    duration: 300,
                    easing: quintOut,
                    x: -20,
                    delay: 100 + 50 * index
                  }}
                >
                  <td
                    class="hidden w-10 from-transparent to-zinc-600/5 group-hover:bg-gradient-to-r sm:table-cell"
                  >
                    {#if $currentTrack?.track.id === track.id}
                      {#if $paused}
                        <button
                          class="flex items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600"
                          on:click={() => ($paused = false)}
                        >
                          <RoundPlayCircleFilled class="text-3xl transition-colors" />
                        </button>
                      {:else}
                        <button
                          class="flex items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600"
                          on:click={() => ($paused = true)}
                        >
                          <RoundPauseCircleOutline class="text-3xl transition-colors" />
                        </button>
                      {/if}
                    {:else}
                      <div class="text-center group-target:hidden group-hover:hidden">
                        {track.trackNumber}
                      </div>
                      <button
                        class="hidden items-center justify-center text-zinc-600 hover:text-fuchsia-600 group-target:flex group-hover:flex"
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
                    <div class="flex items-center gap-2 p-1">
                      {#if $currentTrack?.track.id === track.id}
                        {#if $paused}
                          <button
                            class="flex h-10 w-10 items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600 sm:hidden"
                            on:click={() => ($paused = false)}
                          >
                            <RoundPlayCircleFilled class="text-3xl transition-colors" />
                          </button>
                        {:else}
                          <button
                            class="flex h-10 w-10 items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600 sm:hidden"
                            on:click={() => ($paused = true)}
                          >
                            <RoundPauseCircleOutline class="text-3xl transition-colors" />
                          </button>
                        {/if}
                      {:else}
                        <div class="h-10 w-10 flex-none overflow-hidden rounded-md sm:hidden">
                          <AlbumImage alt={data.album.title} id={data.album.id} maxSize="s" />
                        </div>
                      {/if}
                      <div class="hidden h-10 w-10 flex-none overflow-hidden rounded-md sm:block">
                        <AlbumImage alt={data.album.title} id={data.album.id} maxSize="s" />
                      </div>
                      {track.title}
                    </div>
                  </td>
                  <td class="p-1 group-hover:bg-zinc-600/5">
                    {#each track.artists.sort( (a, b) => (a.name !== data.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                      <a class="hover:underline" href="/artist/{artist.id}">
                        {artist.name}{#if track.artists.length > 1 && index != track.artists.length - 1},{/if}
                      </a>
                    {/each}
                  </td>
                  <td
                    class="from-zinc-600/5 to-transparent p-1 group-hover:bg-gradient-to-r"
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
