<script lang="ts">
  import Folder from './Folder.svelte';
  import type { FolderNode } from '$lib/shared/types';
  import pickedFolder from '$lib/stores/folderPicker';
  import FolderOpenRounded from '~icons/material-symbols-light/folder-open-rounded';
  import FolderRounded from '~icons/material-symbols-light/folder-rounded';
  import RoundRefresh from '~icons/ic/round-refresh';
  import { slide } from 'svelte/transition';
  import { tick } from 'svelte';
  import { vibrate } from '$lib/actions/vibrate';

  interface Props {
    folderNode: FolderNode;
    level?: number;
  }

  let { folderNode = $bindable(), level = 0 }: Props = $props();
  let opened = $state(false);
  let loading = $state(false);

  async function onclick(event: Event) {
    event.preventDefault();

    if (folderNode.children.length === 0) {
      loading = true;

      const resp = await fetch('/api/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderNode.path })
      });

      const data = await resp.json();

      if (resp.ok) {
        folderNode.children = data;
      } else {
        console.error(data);
      }

      loading = false;
    }

    pickedFolder.set(folderNode);
    await tick();
    opened = !opened;
  }
</script>

<div
  transition:slide
  class="ml-4 flex flex-col py-1 {level > 0 ? 'border-l-2 border-l-zinc-300/50 pl-3' : ''}"
>
  <button
    class="flex w-full transition-colors hover:text-zinc-400"
    {onclick}
    disabled={loading}
    use:vibrate
  >
    <div class:text-primary={$pickedFolder === folderNode}>
      {#if loading}
        <RoundRefresh class="h-6 w-6 animate-spin" />
      {:else if opened}
        <FolderOpenRounded class="h-6 w-6" />
      {:else}
        <FolderRounded class="h-6 w-6" />
      {/if}
    </div>
    <div
      title="{folderNode.label}{$pickedFolder === folderNode ? ' (selected)' : ''}"
      class="whitespace-nowrap"
    >
      {folderNode.label}{$pickedFolder === folderNode ? ' (selected)' : ''}
    </div>
  </button>

  {#each folderNode.children as _, index}
    {#if opened}
      <Folder bind:folderNode={folderNode.children[index]} level={level + 1} />
    {/if}
  {/each}
</div>
