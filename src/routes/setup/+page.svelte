<script lang="ts">
  import { enhance } from '$app/forms';
  import pickedFolder from '$lib/stores/folderPicker';
  import Folder from './Folder.svelte';

  export let data;
  let err: string | null = null;
</script>

<div class="flex h-full flex-col gap-2">
  <h1 class="text-center text-lg font-bold">Welcome to the setup page</h1>
  <form
    method="post"
    action="?/createsetup"
    use:enhance={({ cancel }) => {
      if (!$pickedFolder) {
        cancel();
        err = 'Please select a music folder';
      } else {
        err = '';
      }
    }}
    class="flex w-full flex-col items-center gap-2"
  >
    <label class="w-full max-w-2xl px-2 text-sm text-zinc-300">
      <div>Username</div>
      <input
        class="w-full rounded-md bg-zinc-600 px-2 py-1 text-white focus:bg-zinc-700"
        name="username"
        required
      />
    </label>
    <label class="w-full max-w-2xl px-2 text-sm text-zinc-300">
      <div>Email</div>
      <input
        class="w-full rounded-md bg-zinc-600 px-2 py-1 text-white focus:bg-zinc-700"
        type="email"
        name="email"
        required
      />
    </label>
    <label class="w-full max-w-2xl px-2 text-sm text-zinc-300">
      <div>Password</div>
      <input
        class="w-full rounded-md bg-zinc-600 px-2 py-1 text-white focus:bg-zinc-700"
        type="password"
        name="password"
        required
      />
    </label>
    <input type="hidden" name="musicFolder" value={$pickedFolder?.path ?? null} />
    <button
      class="rounded-md bg-fuchsia-600 p-2 text-zinc-300 transition-colors hover:bg-fuchsia-700"
      type="submit">Create Admin Account</button
    >
    {#if err}
      <p class="text-red-700">{err}</p>
    {/if}
  </form>
  <div class="flex flex-col overflow-hidden">
    Select a music folder: Currently selected: {$pickedFolder?.path ?? 'None'}
    <div class="flex flex-col overflow-auto">
      {#each data.musicFolders as folder}
        <Folder folderNode={folder} />
      {/each}
    </div>
  </div>
</div>
