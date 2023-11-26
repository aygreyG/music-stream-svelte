<script lang="ts">
  import { applyAction, deserialize } from '$app/forms';
  import type { FolderNode } from '$lib/shared/types';
  import pickedFolder from '$lib/stores/folderPicker';
  import type { ActionResult } from '@sveltejs/kit';

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
    opened = !opened;
  }
</script>

<div class="flex py-2 mx-2 flex-col border-l-zinc-300 border-l-2 ml-2">
  <form class="flex items-center" action="?/getchildren" on:submit|preventDefault={onSubmit}>
    <div class="w-3 h-px bg-zinc-300" />
    <input type="hidden" name="path" value={folderNode.path} />
    <button type="submit" disabled={loading}>
      {folderNode.label}{$pickedFolder === folderNode ? ' (selected)' : ''}
    </button>
  </form>

  {#if opened}
    {#each folderNode.children as folder}
      <svelte:self folderNode={folder} level={level + 1} />
    {/each}
  {/if}
</div>
