<script lang="ts">
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  interface Props {
    currentString: string;
    durationString: string;
    prevSeekTime: number;
    duration?: number;
    currentTime?: number;
    bufferedRanges: { start: number; end: number }[];
  }

  let {
    currentString,
    durationString,
    duration,
    currentTime = $bindable(0),
    prevSeekTime = $bindable(0),
    bufferedRanges = []
  }: Props = $props();

  const audioPlayer = getAudioPlayer();
</script>

<div class="flex items-center justify-between gap-2 whitespace-nowrap sm:order-2">
  <div class={['timer', !audioPlayer.currentTrack && 'opacity-0']}>
    {currentString}
  </div>
  <div class="flex w-full items-center justify-between overflow-clip rounded-full">
    <input
      class="z-10 w-full opacity-85"
      type="range"
      min="0"
      max={duration || 0}
      step="0.01"
      bind:value={currentTime}
      disabled={!duration}
      aria-label="Progress bar"
      oninput={() => {
        if (
          navigator &&
          'vibrate' in navigator &&
          matchMedia('(prefers-reduced-motion: no-preference)').matches &&
          matchMedia('(hover: none), (pointer: coarse)').matches &&
          currentTime &&
          Math.abs(currentTime - prevSeekTime) > 0.5
        ) {
          prevSeekTime = currentTime;
          navigator.vibrate(1);
        }
      }}
    />
    {#if duration}
      {#each bufferedRanges as range (range.start)}
        <div
          class="bg-primary/50 absolute h-4 blur-[2px]"
          style="width: {((range.end - range.start) / duration) * 100}%; left: {(range.start /
            duration) *
            100}%;"
        ></div>
      {/each}
    {/if}
  </div>
  <div class={['timer', !audioPlayer.currentTrack && 'opacity-0']}>
    {durationString}
  </div>
</div>

<style lang="postcss">
  @reference "../../../app.css";

  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    @apply h-4 cursor-pointer overflow-hidden rounded-full bg-zinc-600/60 outline-hidden backdrop-blur-md sm:h-2;
  }

  input[type='range']::-webkit-slider-runnable-track {
    @apply h-4 rounded-full bg-transparent sm:h-2;
  }

  input[type='range']::-moz-range-track {
    @apply h-4 rounded-full bg-transparent sm:h-2;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    border: none;
    outline: none;
    box-shadow: -10000px 0 0 10000px theme(--color-primary);
    @apply size-0 transition-shadow duration-500;
  }

  input[type='range']::-moz-range-thumb {
    border: none;
    outline: none;
    box-shadow: -10000px 0 0 10000px theme(--color-primary);
    @apply size-0 transition-shadow duration-500;
  }

  input[type='range']:focus {
    outline: none;
  }

  .timer {
    @apply font-mono font-bold transition-opacity;
  }
</style>
