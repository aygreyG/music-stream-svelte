<script lang="ts">
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';
  import { onMount, type Snippet } from 'svelte';

  const audioPlayer = getAudioPlayer();

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  onMount(() => {
    audioPlayer.stopAndClear();
  });
</script>

{@render children?.()}
