<script lang="ts">
	import { enhance } from '$app/forms';

	export let data;
	let message: string | null = null;
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
{#if data.user}
	<p>Logged in as {data.user.username}</p>
	{#if data.user.admin}
		{#if message}
			<p>{message}</p>
		{/if}
		<p>Admin</p>
		<button
			on:click={async () => {
				const re = await fetch('/api/admin/sync', {
					method: 'POST'
				});

				const response = await re.json();
				message = response.message;
			}}>Start library sync</button
		>
	{/if}
	<form method="POST" action="/logout" use:enhance>
		<button type="submit">Logout</button>
	</form>
{:else}
	<a href="login">Login</a>
{/if}
