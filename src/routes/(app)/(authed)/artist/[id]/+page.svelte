<script lang="ts">
  import { currentTrack, paused, playTrack } from '$lib/stores/audioPlayer.js';
  import RoundPlayCircleFilled from 'virtual:icons/ic/round-play-circle-filled';
  import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicInOut, quintOut } from 'svelte/easing';
  import TrackRow from '$lib/components/TrackRow.svelte';

  export let data;
  let animate = false;

  onMount(() => {
    animate = true;
  });
</script>

<div class="h-full overflow-auto p-2">
  {#if animate}
    <h1 class="p-2 text-center text-2xl font-bold">
      {data.artist.name}
    </h1>
    {#if data.artist.albums.length > 0}
      <div
        class="p-1 text-lg font-bold"
        in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: 50 }}
      >
        Albums:
      </div>
      <div class="flex w-full flex-wrap items-center justify-center gap-2">
        {#each data.artist.albums as album, index (album.id)}
          {@const delayForAlbum = 100 + index * 50}
          <div
            in:fly|global={{ duration: 500, x: -20, easing: quintOut, delay: delayForAlbum }}
            class="flex w-full gap-0.5 overflow-hidden rounded-md xl:w-[calc(50%-0.5rem)]"
          >
            <div
              class="absolute left-0 top-0 h-full w-full opacity-10"
              in:fade|global={{ delay: delayForAlbum, duration: 500, easing: cubicInOut }}
            >
              <AlbumImage blur alt="Backdrop for {album.title}" id={album.id} maxSize="s" />
            </div>
            <a
              href="/album/{album.id}"
              class="h-64 overflow-hidden text-ellipsis whitespace-nowrap bg-zinc-900/80 py-2 text-center backdrop-blur-md"
              style="writing-mode: vertical-lr;"
            >
              {album.title}
            </a>

            <div class="h-64 w-full overflow-y-auto overflow-x-hidden">
              <div class="flex w-full flex-col">
                <div class="sticky left-0 top-0 z-10 flex h-8 w-full font-bold">
                  <div
                    class="mr-0.5 flex w-10 items-center justify-center rounded-md bg-zinc-900/80 backdrop-blur-md"
                  >
                    #
                  </div>
                  <div
                    class="flex w-[calc(65%-1.25rem)] items-center justify-start rounded-s-md bg-zinc-900/80 pl-2 backdrop-blur-md"
                  >
                    Title
                  </div>
                  <div
                    class="flex w-[calc(35%-1.25rem)] items-center justify-start rounded-e-md bg-zinc-900/80 pl-2 backdrop-blur-md"
                  >
                    Length
                  </div>
                </div>

                {#each album.tracks as track, index (track.id)}
                  <div
                    tabindex="0"
                    role="button"
                    on:keydown={(e) => {
                      if (e.key === 'Enter' && $currentTrack?.id !== track.id)
                        playTrack(
                          album.tracks.map((t) => ({
                            ...t,
                            album: { ...album, albumArtist: data.artist }
                          })),
                          index
                        );
                    }}
                    on:click={() => {
                      if (matchMedia('(hover: none), (pointer: coarse)').matches) {
                        playTrack(
                          album.tracks.map((t) => ({
                            ...t,
                            album: { ...album, albumArtist: data.artist }
                          })),
                          index
                        );
                      }
                    }}
                    on:dblclick={() =>
                      $currentTrack?.id !== track.id
                        ? playTrack(
                            album.tracks.map((t) => ({
                              ...t,
                              album: { ...album, albumArtist: data.artist }
                            })),
                            index
                          )
                        : null}
                    class="group flex h-10 w-full cursor-default select-none items-center from-transparent via-zinc-600/10 to-transparent transition-colors hover:bg-gradient-to-r"
                  >
                    <div class="flex w-10 items-center justify-center">
                      {#if $currentTrack?.id === track.id}
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
                        <div class="w-10 text-center group-target:hidden group-hover:hidden">
                          {track.trackNumber}
                        </div>
                        <button
                          class="hidden items-center justify-center text-zinc-600 hover:text-fuchsia-600 group-target:flex group-hover:flex"
                          on:click={() =>
                            playTrack(
                              album.tracks.map((t) => ({
                                ...t,
                                album: { ...album, albumArtist: data.artist }
                              })),
                              index
                            )}
                        >
                          <RoundPlayCircleFilled class="text-3xl transition-colors" />
                        </button>
                      {/if}
                    </div>
                    <div
                      class="w-[calc(65%-1.25rem)] overflow-hidden text-ellipsis whitespace-nowrap pl-2"
                    >
                      {track.title}
                    </div>
                    <div class="w-[calc(35%-1.25rem)] pl-2">
                      {new Date(track.length * 1000).toISOString().slice(14, 19)}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
    {#if data.artist.tracks.length > 0}
      <div
        in:fly|global={{
          duration: 500,
          x: -20,
          easing: quintOut,
          delay: 50 + data.artist.albums.length * 50
        }}
        class="p-1 text-lg font-bold"
      >
        Featured on {data.artist.tracks.length} track{#if data.artist.tracks.length > 1}s{/if}:
      </div>
      {#each data.artist.tracks as track, index (track.id)}
        <TrackRow {track} delay={30 * index} />
      {/each}
    {/if}
  {/if}
</div>
