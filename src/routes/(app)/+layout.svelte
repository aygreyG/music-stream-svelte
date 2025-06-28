<script lang="ts">
  import AudioPlayer from '$lib/components/AudioPlayer.svelte';
  import NavBar from '$lib/components/NavBar.svelte';
  import { setAudioPlayer } from '$lib/states/audioPlayer.svelte.js';
  import type { Snippet } from 'svelte';
  import type { PageData } from './(authed)/$types';
  import { getRGBColor } from '$lib/utils';

  const audioPlayer = setAudioPlayer();

  interface Props {
    data: PageData;
    children?: Snippet;
  }

  let { data, children }: Props = $props();
</script>

<div
  class="flex h-full w-full gap-1"
  style={getRGBColor(audioPlayer.currentTrack?.album?.albumArtLightVibrant || '#71717a', 'primary')}
>
  <NavBar user={data.user} />
  <div
    class="flex h-full w-full flex-col gap-1 sm:max-w-[calc(100%-12.25rem)] md:max-w-[calc(100%-15.25rem)] sm:h-sm:max-w-[calc(100%-12.25rem)]"
  >
    <div class="h-full w-full overflow-hidden rounded-xl bg-zinc-900/95">
      {@render children?.()}
    </div>
    <div class="h-44 flex-none sm:h-28">
      <AudioPlayer user={data.user} />
    </div>
  </div>
</div>
