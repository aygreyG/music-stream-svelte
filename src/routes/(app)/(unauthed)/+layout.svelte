<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

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
