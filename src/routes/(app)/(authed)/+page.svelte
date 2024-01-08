<script lang="ts">
  import { onMount } from 'svelte';
  import AlbumLink from './AlbumLink.svelte';

  export let data;
  let container: HTMLDivElement;
  let firstVisibleElement: number;
  let foundScroll = false;
  let scrolled = false;

  function updateVisibleElements() {
    let first;
    for (const child of container.children) {
      const rect = child.getBoundingClientRect();
      if (
        rect.bottom >= 0 &&
        rect.bottom <= window.innerHeight &&
        (!scrolled || (scrolled && rect.top >= 0 && rect.top <= window.innerHeight))
      ) {
        first = parseInt(child.id);
        break;
      }
    }

    if (first) {
      firstVisibleElement = first;
    }
  }

  onMount(async () => {
    const scroll = localStorage.getItem('dashboard-scroll');
    if (scroll) {
      container.scrollTop = parseInt(scroll);
      foundScroll = true;
    }
    updateVisibleElements();
  });
</script>

<div
  class="flex gap-8 items-center justify-center flex-wrap h-full overflow-auto p-2"
  bind:this={container}
  on:scroll={() => {
    localStorage.setItem('dashboard-scroll', container.scrollTop.toString());

    updateVisibleElements();

    if (!foundScroll) {
      foundScroll = true;
      return;
    }

    scrolled = true;
  }}
>
  {#each data.albums as album, index (album.id)}
    <AlbumLink {album} {index} first={firstVisibleElement} />
  {/each}
</div>
