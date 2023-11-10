<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SignedInUser } from '$lib/shared/types';

	export let user: SignedInUser | null = null;
</script>

<div class="w-4/12 xl:w-3/12 sm:flex flex-col h-full gap-1 hidden">
	<div class="bg-zinc-900/95 p-4 rounded-md h-2/6 flex flex-col gap-2">
		{#if user}
			<p class="font-bold">Welcome {user.username}</p>
			<a href="/dashboard">Dashboard</a>
			<form method="POST" action="/logout" use:enhance>
				<button type="submit">Logout</button>
			</form>
		{:else}
			<a href="/login">Login</a>
		{/if}
	</div>
	<div class="bg-zinc-900/95 p-2 rounded-md min-h-fit h-4/6 overflow-auto">
		Playlist or current queue
	</div>
</div>
