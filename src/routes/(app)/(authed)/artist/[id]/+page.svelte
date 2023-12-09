<script lang="ts">
  import { currentTrack, paused, playTrack } from '$lib/stores/audioPlayer.js';
  import RoundPlayCircleFilled from 'virtual:icons/ic/round-play-circle-filled';
  import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
  export let data;
</script>

<div class="h-full overflow-auto p-2">
  <h1 class="text-2xl text-center font-bold p-2">{data.artist.name}</h1>
  {#if data.artist.albums.length > 0}
    <div class="text-lg font-bold p-1">Albums:</div>
    <div class="flex flex-wrap w-full gap-2 justify-center items-center">
      {#each data.artist.albums as album (album.id)}
        <div class="flex gap-0.5 xl:w-[calc(50%-0.5rem)] w-full rounded-md overflow-hidden">
          <div
            class="absolute top-0 left-0 w-full h-full after:content-[''] after:w-full after:h-full after:absolute after:top-0 after:left-0 after:backdrop-blur-sm after:rounded-md"
          >
            <img
              class="object-cover h-full w-full opacity-5"
              src="/api/image/{album.id}"
              alt="Album Art Backdrop"
            />
          </div>
          <a
            href="/album/{album.id}"
            class="text-center bg-zinc-900/80 h-64 overflow-hidden text-ellipsis whitespace-nowrap backdrop-blur-md py-2"
            style="writing-mode: vertical-lr;"
          >
            {album.title}
          </a>

          <div class="h-64 overflow-y-auto overflow-x-hidden w-full">
            <div class="flex flex-col w-full">
              <div class="flex font-bold h-8 sticky top-0 left-0 z-10 w-full">
                <div
                  class="w-10 flex items-center justify-center rounded-md bg-zinc-900/80 backdrop-blur-md mr-0.5"
                >
                  #
                </div>
                <div
                  class="w-[calc(65%-1.25rem)] flex items-center justify-start rounded-s-md bg-zinc-900/80 backdrop-blur-md pl-2"
                >
                  Title
                </div>
                <div
                  class="w-[calc(35%-1.25rem)] flex items-center justify-start rounded-e-md bg-zinc-900/80 backdrop-blur-md pl-2"
                >
                  Length
                </div>
              </div>

              {#each album.tracks as track (track.id)}
                <div
                  tabindex="0"
                  role="button"
                  on:keydown={(e) => {
                    if (e.key === 'Enter' && $currentTrack?.track.id !== track.id)
                      playTrack(track, { ...album, albumArtist: data.artist }, true);
                  }}
                  on:click={() => {
                    if (matchMedia('(hover: none), (pointer: coarse)').matches) {
                      playTrack(track, { ...album, albumArtist: data.artist }, true);
                    }
                  }}
                  on:dblclick={() =>
                    $currentTrack?.track.id !== track.id
                      ? playTrack(track, { ...album, albumArtist: data.artist }, true)
                      : null}
                  class="select-none flex h-10 hover:bg-gradient-to-r from-transparent via-zinc-600/10 to-transparent transition-colors w-full group items-center cursor-default"
                >
                  <div class="w-10 flex items-center justify-center">
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
                      <div class="group-hover:hidden group-target:hidden text-center w-10">
                        {track.trackNumber}
                      </div>
                      <button
                        class="hidden group-target:flex group-hover:flex text-zinc-600 hover:text-fuchsia-600 items-center justify-center"
                        on:click={() =>
                          playTrack(track, { ...album, albumArtist: data.artist }, true)}
                      >
                        <RoundPlayCircleFilled class="text-3xl transition-colors" />
                      </button>
                    {/if}
                  </div>
                  <div
                    class="w-[calc(65%-1.25rem)] pl-2 overflow-hidden text-ellipsis whitespace-nowrap"
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
    <div class="text-lg font-bold p-1">
      Featured on {data.artist.tracks.length} track{#if data.artist.tracks.length > 1}s{/if}:
    </div>
    {#each data.artist.tracks as track (track.id)}
      <div
        tabindex="0"
        role="button"
        on:keydown={(e) => {
          if (e.key === 'Enter' && $currentTrack?.track.id !== track.id)
            playTrack(track, track.album, true);
        }}
        on:click={() => {
          if (matchMedia('(hover: none), (pointer: coarse)').matches) {
            playTrack(track, track.album, true);
          }
        }}
        on:dblclick={() =>
          $currentTrack?.track.id !== track.id ? playTrack(track, track.album, true) : null}
        class="flex h-11 hover:bg-gradient-to-r from-transparent via-zinc-600/10 to-transparent transition-colors w-full group items-center cursor-default select-none"
      >
        <div class="w-10 h-10 flex items-center justify-center">
          {#if $currentTrack?.track.id === track.id}
            {#if $paused}
              <button
                class="text-fuchsia-600/70 hover:text-fuchsia-600 flex items-center justify-center z-10"
                on:click={() => ($paused = false)}
              >
                <RoundPlayCircleFilled class="text-3xl transition-colors" />
              </button>
            {:else}
              <button
                class="text-fuchsia-600/70 hover:text-fuchsia-600 flex items-center justify-center z-10"
                on:click={() => ($paused = true)}
              >
                <RoundPauseCircleOutline class="text-3xl transition-colors" />
              </button>
            {/if}
          {:else}
            <button
              class="hidden group-hover:flex text-zinc-600 hover:text-fuchsia-600 items-center justify-center z-10"
              on:click={() => playTrack(track, track.album, true)}
            >
              <RoundPlayCircleFilled class="text-3xl transition-colors" />
            </button>
            <img
              class="group-hover:opacity-20 absolute top-0 left-0 z-0 object-cover h-10 w-10 rounded-md"
              src="/api/image/{track.album.id}"
              alt={track.album.title}
            />
          {/if}
        </div>
        <div class="w-[40%] pl-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {track.title}
        </div>
        <a
          href="/album/{track.album.id}"
          class="w-[35%] overflow-hidden whitespace-nowrap text-ellipsis hover:underline pl-2"
        >
          {track.album.title}
        </a>
        <div class="w-[calc(25%-2.5rem)] pl-2">
          {new Date(track.length * 1000).toISOString().slice(14, 19)}
        </div>
      </div>
    {/each}
  {/if}
</div>
