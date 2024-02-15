<script lang="ts">
  import PlaylistImage from '$lib/components/PlaylistImage.svelte';
  import { quintOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import RoundPlayCircleFilled from 'virtual:icons/ic/round-play-circle-filled';
  import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
  import HeartOff from 'virtual:icons/iconamoon/heart-off';
  import AlbumImage from '$lib/components/AlbumImage.svelte';
  import { crossfade } from '$lib/transitions/crossfade';
  import { currentTrack, paused, playTrack } from '$lib/stores/audioPlayer.js';
  import { flip } from 'svelte/animate';
  import { enhance } from '$app/forms';

  export let data;
  const [send, receive] = crossfade;
</script>

<div class="flex h-full w-full flex-col">
  <div class="flex p-4">
    <div
      class="flex h-32 w-32 flex-none items-center justify-center overflow-clip rounded-md md:h-40 md:w-40 xl:h-48 xl:w-48"
      in:receive|global={{ key: data.playlist.id, duration: 300 }}
    >
      <PlaylistImage albumSet={data.albumSet} />
    </div>

    <div
      in:fade|global={{ delay: 250, duration: 250 }}
      class="flex items-center justify-center p-2 text-2xl"
    >
      {data.playlist.name}
    </div>
  </div>

  <div class="flex h-full flex-col overflow-auto">
    {#each data.playlist.tracks as track, index (track.id)}
      <div
        in:fly|global={{
          duration: 500,
          x: -20,
          easing: quintOut,
          delay: 30 * index + 250
        }}
        animate:flip={{ duration: 100 }}
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
        on:dblclick={() => {
          if ($currentTrack?.track.id !== track.id) playTrack(track, track.album, true);
        }}
        class="group flex h-12 w-full flex-none cursor-default select-none items-center from-transparent via-zinc-600/10 to-transparent px-4 transition-colors hover:bg-gradient-to-r"
      >
        <div class="flex h-10 w-10 flex-none items-center justify-center">
          {#if $currentTrack?.track.id === track.id}
            {#if $paused}
              <button
                class="z-10 flex items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600"
                on:click={() => ($paused = false)}
              >
                <RoundPlayCircleFilled class="text-3xl transition-colors" />
              </button>
            {:else}
              <button
                class="z-10 flex items-center justify-center text-fuchsia-600/70 hover:text-fuchsia-600"
                on:click={() => ($paused = true)}
              >
                <RoundPauseCircleOutline class="text-3xl transition-colors" />
              </button>
            {/if}
          {:else}
            <button
              class="z-10 hidden items-center justify-center text-zinc-600 hover:text-fuchsia-600 group-hover:flex"
              on:click={() => playTrack(track, track.album, true)}
            >
              <RoundPlayCircleFilled class="text-3xl transition-colors" />
            </button>
            <div
              class="absolute left-0 top-0 z-0 h-10 w-10 overflow-hidden rounded-md group-hover:opacity-20"
            >
              <AlbumImage alt={track.album.title} id={track.album.id} maxSize="s" />
            </div>
          {/if}
        </div>
        <div class="w-[calc(50%-2rem)] flex-none pl-2">
          <div class="overflow-hidden text-ellipsis whitespace-nowrap">{track.title}</div>
          <div class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-white/70">
            {#each track.artists.sort( (a, b) => (a.name !== track.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
              <a class="hover:underline" href="/artist/{artist.id}">
                {artist.name}{#if track.artists.length > 1 && index != track.artists.length - 1},{/if}
              </a>
            {/each}
          </div>
        </div>
        <a
          href="/album/{track.album.id}"
          class="w-[calc(35%-2.5rem)] flex-none overflow-hidden text-ellipsis whitespace-nowrap pl-2 hover:underline"
        >
          {track.album.title}
        </a>
        <div class="w-[calc(15%)] flex-none pl-2">
          {new Date(track.length * 1000).toISOString().slice(14, 19)}
        </div>
        <div class="w-8 flex-none">
          <form use:enhance action="?/remove" method="POST">
            <input type="hidden" name="trackId" value={track.id} />
            <button
              class="flex h-full w-full items-center justify-center"
              title="Remove"
              type="submit"
            >
              <HeartOff class="text-2xl text-zinc-600 hover:text-fuchsia-600" />
            </button>
          </form>
        </div>
      </div>
    {:else}
      <div class="text-white/70 text-xl px-4">There are no tracks in this playlist</div>
    {/each}
  </div>
</div>
