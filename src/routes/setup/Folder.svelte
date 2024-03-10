<script lang="ts">
  import { applyAction, deserialize } from '$app/forms';
  import type { FolderNode } from '$lib/shared/types';
  import pickedFolder from '$lib/stores/folderPicker';
  import type { ActionResult } from '@sveltejs/kit';
  import FolderOpenRounded from 'virtual:icons/material-symbols-light/folder-open-rounded';
  import FolderRounded from 'virtual:icons/material-symbols-light/folder-rounded';
  import RoundRefresh from 'virtual:icons/ic/round-refresh';
  import { slide } from 'svelte/transition';
  import { tick } from 'svelte';
  import { vibrate } from '$lib/actions/vibrate';

  export let folderNode: FolderNode;
  export let level = 0;
  let opened = false;
  let loading = false;

  async function onSubmit(
    event: SubmitEvent & {
      currentTarget: EventTarget & HTMLFormElement;
    }
  ) {
    if (folderNode.children.length === 0) {
      const data = new FormData(event.currentTarget);
      loading = true;
      const response = await fetch(event.currentTarget.action, {
        method: 'POST',
        body: data
      });
      const result: ActionResult = deserialize(await response.text());

      if (result.type === 'success') {
        folderNode.children = result.data?.body || [];
      }

      loading = false;

      applyAction(result);
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
  <form class="flex items-center" action="?/getchildren" on:submit|preventDefault={onSubmit}>
    <input type="hidden" name="path" value={folderNode.path} />
    <button
      class="flex w-full transition-colors hover:text-zinc-400"
      type="submit"
      disabled={loading}
      use:vibrate
    >
      <div class:text-fuchsia-600={$pickedFolder === folderNode}>
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
        class="overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {folderNode.label}{$pickedFolder === folderNode ? ' (selected)' : ''}
      </div>
    </button>
  </form>

  {#each folderNode.children as folder}
    {#if opened}
      <svelte:self folderNode={folder} level={level + 1} />
    {/if}
  {/each}
</div>
