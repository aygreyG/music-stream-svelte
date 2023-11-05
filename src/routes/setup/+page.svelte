<script lang="ts">
	import Folder from './folder.svelte';

	export let data;
</script>

<h1>Welcome to the setup page</h1>
{#each data.musicFolders as folder}
	<Folder folderNode={folder} />
{/each}
<form method="post" action="?/createsetup">
	<label>
		Folder
		<input name="folder" required />
	</label>
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
	<button type="submit">Create Admin Account</button>
</form>
