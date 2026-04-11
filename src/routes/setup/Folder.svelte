<script lang="ts">
  import { tick } from 'svelte';
  import { slide } from 'svelte/transition';

  import { vibrate } from '$lib/actions/vibrate';
  import type { FolderNode } from '$lib/shared/types';
  import pickedFolder from '$lib/stores/folderPicker';

  import RoundRefresh from '~icons/ic/round-refresh';
  import FolderOpenRounded from '~icons/material-symbols-light/folder-open-rounded';
  import FolderRounded from '~icons/material-symbols-light/folder-rounded';

  import Folder from './Folder.svelte';

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
  class="ml-2 flex flex-col py-0.5 {level > 0 ? 'border-l-outline-variant/50 border-l-2 pl-3' : ''}"
>
  <button
    class={[
      'flex w-full items-center gap-1.5 rounded-lg px-2 py-1 transition-colors',
      $pickedFolder === folderNode
        ? 'bg-primary/15 text-primary'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-zinc-600/20'
    ]}
    {onclick}
    disabled={loading}
    use:vibrate
  >
    <div class="flex-none">
      {#if loading}
        <RoundRefresh class="h-5 w-5 animate-spin" />
      {:else if opened}
        <FolderOpenRounded class="h-5 w-5" />
      {:else}
        <FolderRounded class="h-5 w-5" />
      {/if}
    </div>
    <span
      title="{folderNode.label}{$pickedFolder === folderNode ? ' (selected)' : ''}"
      class="truncate text-sm"
    >
      {folderNode.label}
    </span>
  </button>

  {#each folderNode.children as node, index (node.path)}
    {#if opened}
      <Folder bind:folderNode={folderNode.children[index]} level={level + 1} />
    {/if}
  {/each}
</div>
