<script lang="ts">
	import { enhance } from '$app/forms';
	import pickedFolder from '$lib/stores/folderPicker';
	import Folder from './Folder.svelte';

	export let data;
	let err: string | null = null;
</script>

<h1>Welcome to the setup page</h1>
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
>
	<label>
		Username
		<input name="username" required />
	</label>
	<label>
		Email
		<input type="email" name="email" required />
	</label>
	<label>
		Password
		<input type="password" name="password" required />
	</label>
	<input type="hidden" name="musicFolder" value={$pickedFolder?.path ?? null} />
	<button type="submit">Create Admin Account</button>
	{#if err}
		<p style="color: red;">{err}</p>
	{/if}
</form>
Select a music folder: Currently selected: {$pickedFolder?.path ?? 'None'}
{#each data.musicFolders as folder}
	<Folder folderNode={folder} />
{/each}
