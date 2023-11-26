<script lang="ts">
	import { enhance } from '$app/forms';
	import pickedFolder from '$lib/stores/folderPicker';
	import Folder from './Folder.svelte';

	export let data;
	let err: string | null = null;
</script>

<div class="flex flex-col gap-2 h-full">
	<h1 class="text-lg font-bold text-center">Welcome to the setup page</h1>
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
		class="flex flex-col gap-2 items-center w-full"
	>
		<label class="px-2 text-sm text-zinc-300 w-full max-w-2xl">
			<div>Username</div>
			<input
				class="bg-zinc-600 rounded-md text-white focus:bg-zinc-700 px-2 py-1 w-full"
				name="username"
				required
			/>
		</label>
		<label class="px-2 text-sm text-zinc-300 w-full max-w-2xl">
			<div>Email</div>
			<input
				class="bg-zinc-600 rounded-md text-white focus:bg-zinc-700 px-2 py-1 w-full"
				type="email"
				name="email"
				required
			/>
		</label>
		<label class="px-2 text-sm text-zinc-300 w-full max-w-2xl">
			<div>Password</div>
			<input
				class="bg-zinc-600 rounded-md text-white focus:bg-zinc-700 px-2 py-1 w-full"
				type="password"
				name="password"
				required
			/>
		</label>
		<input type="hidden" name="musicFolder" value={$pickedFolder?.path ?? null} />
		<button
			class="bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors p-2 rounded-md text-zinc-300"
			type="submit">Create Admin Account</button
		>
		{#if err}
			<p class="text-red-700">{err}</p>
		{/if}
	</form>
	<div class="overflow-hidden flex flex-col">
		Select a music folder: Currently selected: {$pickedFolder?.path ?? 'None'}
		<div class="flex flex-col overflow-auto">
			{#each data.musicFolders as folder}
				<Folder folderNode={folder} />
			{/each}
		</div>
	</div>
</div>
