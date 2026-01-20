<script lang="ts">
  import RoundPlayCircle from '~icons/ic/round-play-circle';
  import RoundPauseCircle from '~icons/ic/round-pause-circle';
  import RoundSkipPrevious from '~icons/ic/round-skip-previous';
  import RoundSkipNext from '~icons/ic/round-skip-next';
  import RoundRepeat from '~icons/ic/round-repeat';
  import RoundStop from '~icons/ic/round-stop';
  import { vibrate } from '$lib/actions/vibrate';
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  interface Props {
    onstop?: () => void;
    repeat?: boolean;
    class?: string;
  }

  let { onstop, repeat = $bindable(false), class: className = '' }: Props = $props();

  const audioPlayer = getAudioPlayer();
</script>

<div class={['flex gap-4', className]}>
  <button
    disabled={!audioPlayer.currentTrack}
    onclick={() => {
      onstop?.();
      audioPlayer.stopAndClear();
    }}
    class="text-primary-dark enabled:active:text-primary text-2xl transition-colors disabled:opacity-30"
    aria-label="Stop"
    use:vibrate={{ mute: !audioPlayer.currentTrack }}
  >
    <RoundStop />
  </button>
  <button
    onclick={audioPlayer.playPrevious}
    disabled={!audioPlayer.hasPrevious}
    class="text-primary-dark enabled:active:text-primary text-3xl transition-all disabled:opacity-30"
    aria-label="Previous"
    use:vibrate={{ mute: !audioPlayer.hasPrevious }}
  >
    <RoundSkipPrevious />
  </button>
  <button
    disabled={!audioPlayer.currentTrack}
    onclick={() => audioPlayer.togglePlay()}
    class="text-primary text-6xl transition-transform enabled:active:scale-95 disabled:opacity-30"
    aria-label="Toggle play"
    use:vibrate={{ mute: audioPlayer.currentTrack === null }}
  >
    {#if audioPlayer.paused}
      <RoundPlayCircle />
    {:else}
      <RoundPauseCircle />
    {/if}
  </button>
  <button
    onclick={audioPlayer.playNext}
    disabled={!audioPlayer.hasNext}
    class="text-primary-dark enabled:active:text-primary text-3xl transition-all disabled:opacity-30"
    aria-label="Next"
    use:vibrate={{ mute: !audioPlayer.hasNext }}
  >
    <RoundSkipNext />
  </button>
  <button
    onclick={() => (repeat = !repeat)}
    class={['text-2xl transition-colors', repeat && 'text-primary', !repeat && 'text-primary-dark']}
    aria-label="Repeat"
    use:vibrate
  >
    <RoundRepeat />
  </button>
</div>
