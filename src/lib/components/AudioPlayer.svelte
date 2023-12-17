<script lang="ts">
  import RoundPlayCircleOutline from 'virtual:icons/ic/round-play-circle-outline';
  import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
  import RoundSkipPrevious from 'virtual:icons/ic/round-skip-previous';
  import RoundSkipNext from 'virtual:icons/ic/round-skip-next';
  import RoundVolumeUp from 'virtual:icons/ic/round-volume-up';
  import RoundVolumeDown from 'virtual:icons/ic/round-volume-down';
  import RoundVolumeMute from 'virtual:icons/ic/round-volume-mute';
  import RoundVolumeOff from 'virtual:icons/ic/round-volume-off';
  import RoundRepeat from 'virtual:icons/ic/round-repeat';
  import RoundShuffle from 'virtual:icons/ic/round-shuffle';
  import type { SignedInUser } from '$lib/shared/types';
  import { currentTrack, playNext, paused, playPrevious } from '$lib/stores/audioPlayer';
  import AlbumImage from './AlbumImage.svelte';

  export let user: SignedInUser | null = null;

  let player: HTMLAudioElement;
  let currentTime = 0;
  let duration: number;
  let volume = 0.1;
  let prevVolume = volume;
  let durationString = '--:--';
  let currentString = '--:--';
  let repeat = false;
  let shuffle = false;

  function togglePlay() {
    if (!$currentTrack) {
      return;
    }

    $paused = !$paused;
  }

  function onEnded() {
    if (repeat) {
      player.currentTime = 0;
      player.play();
    } else {
      playNext();
    }
  }

  function updateVolume(e: WheelEvent) {
    volume = Math.max(0, Math.min(1, volume + (e.deltaY < 0 ? 0.05 : -0.05)));
  }

  $: if (duration) {
    durationString = new Date(duration * 1000).toISOString().slice(14, 19);
    if (currentTime === 0) {
      currentString = '00:00';
    }
  } else {
    durationString = '--:--';
  }

  $: if (currentTime) {
    currentString = new Date(currentTime * 1000).toISOString().slice(14, 19);
  } else {
    currentString = '--:--';
  }

  currentTrack.subscribe((val) => {
    if (val && !val.shouldBePlayed) {
      $paused = true;
    }
  });
</script>

<div class="h-full flex gap-1 w-full">
  <div class="hidden sm:block">
    <div class="overflow-hidden h-44 w-44 rounded-md bg-zinc-900/95">
      {#if $currentTrack}
        <audio
          preload="metadata"
          src="/api/play/{$currentTrack.track.id}"
          bind:currentTime
          bind:duration
          bind:paused={$paused}
          bind:this={player}
          bind:volume
          autoplay={$currentTrack.shouldBePlayed}
          on:ended={onEnded}
        />
        <a href="/album/{$currentTrack.album.id}" class="overflow-hidden rounded-md h-44 w-44 flex">
          <AlbumImage alt={$currentTrack.album.title} id={$currentTrack.album.id} />
          <div
            class="bottom-0 left-0 absolute text-center flex justify-end flex-col gap-1 p-1 w-full"
          >
            <a
              href="/album/{$currentTrack.album.id}"
              class="whitespace-nowrap z-10 text-ellipsis overflow-hidden bg-zinc-900/80 backdrop-blur-sm rounded-md px-1"
            >
              {$currentTrack.track.title}
            </a>
            <div
              class="whitespace-nowrap z-10 text-ellipsis overflow-hidden bg-zinc-900/80 backdrop-blur-sm rounded-md text-xs px-1"
            >
              {#each $currentTrack.track.artists.sort( (a, b) => (a.name !== $currentTrack?.album.albumArtist.name ? 1 : -1) ) as artist, index (artist.id)}
                <a class="hover:underline" href="/artist/{artist.id}">
                  {artist.name}{#if $currentTrack.track.artists.length > 1 && index != $currentTrack.track.artists.length - 1},{/if}
                </a>
              {/each}
            </div>
          </div>
        </a>
      {/if}
    </div>
  </div>
  <div class="h-full p-2 w-full bg-zinc-900/95 rounded-md">
    {#if user}
      <div class="flex h-full w-full gap-4 px-2">
        <div class="flex flex-col justify-around h-full w-full">
          <div class="flex justify-between gap-2 items-center whitespace-nowrap sm:order-2">
            <div class="timer">{currentString}</div>
            <input
              class="w-full"
              type="range"
              min="0"
              max={duration}
              step="0.01"
              bind:value={currentTime}
              disabled={!duration}
            />
            <div class="timer">{durationString}</div>
          </div>
          <div class="flex gap-2 justify-center sm:justify-around lg:justify-center items-center">
            <div class="flex gap-4">
              <button
                on:click={() => (shuffle = !shuffle)}
                class="text-2xl transition-colors"
                class:text-fuchsia-600={shuffle}
                class:text-zinc-400={!shuffle}
              >
                <RoundShuffle />
              </button>
              <button
                on:click={playPrevious}
                class="text-3xl text-zinc-400 active:text-zinc-600 transition-colors"
              >
                <RoundSkipPrevious />
              </button>
              <button
                on:click={togglePlay}
                class="text-6xl text-zinc-400 active:text-zinc-600 transition-colors"
              >
                {#if $paused}
                  <RoundPlayCircleOutline />
                {:else}
                  <RoundPauseCircleOutline />
                {/if}
              </button>
              <button
                on:click={playNext}
                class="text-3xl text-zinc-400 active:text-zinc-600 transition-colors"
              >
                <RoundSkipNext />
              </button>
              <button
                on:click={() => (repeat = !repeat)}
                class="text-2xl transition-colors"
                class:text-fuchsia-600={repeat}
                class:text-zinc-400={!repeat}
              >
                <RoundRepeat />
              </button>
            </div>
            <div
              class="sm:flex hidden gap-2 items-center lg:absolute right-0"
              on:mousewheel={updateVolume}
            >
              <button
                on:click={() => {
                  if (volume === 0) {
                    volume = prevVolume;
                  } else {
                    prevVolume = volume;
                    volume = 0;
                  }
                }}
              >
                {#if volume === 0}
                  <RoundVolumeOff class="text-3xl text-zinc-400" />
                {:else if volume < 0.3}
                  <RoundVolumeMute class="text-3xl text-zinc-400" />
                {:else if volume < 0.7}
                  <RoundVolumeDown class="text-3xl text-zinc-400" />
                {:else}
                  <RoundVolumeUp class="text-3xl text-zinc-400" />
                {/if}
              </button>
              <input type="range" min="0" max="1" step="0.01" bind:value={volume} />
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    @apply h-4 rounded-full bg-zinc-600 cursor-pointer outline-none overflow-hidden;
  }

  input[type='range']::-webkit-slider-runnable-track {
    @apply bg-zinc-600 rounded-full h-4;
  }

  input[type='range']::-moz-range-track {
    @apply bg-zinc-600 rounded-full h-4;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    border: 2px solid rgb(192 38 211);
    box-shadow: -10007px 0 0 10000px rgb(192 38 211);
    @apply w-4 h-4 bg-zinc-300 rounded-full;
  }

  input[type='range']::-moz-range-thumb {
    border: 2px solid rgb(192 38 211);
    box-shadow: -10007px 0 0 10000px rgb(192 38 211);
    @apply w-3 h-3 bg-zinc-300 rounded-full;
  }

  input[type='range']:focus {
    outline: none;
  }

  .timer {
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
</style>
