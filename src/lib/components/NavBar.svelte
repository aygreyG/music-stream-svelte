<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SignedInUser } from '$lib/shared/types';
	import { queue } from '$lib/stores/audioPlayer';

	export let user: SignedInUser | null = null;
</script>

<div class="w-4/12 xl:w-3/12 sm:flex flex-col h-full gap-1 hidden">
	<div class="bg-zinc-900/95 p-4 rounded-md flex flex-col gap-2">
		{#if user}
			<p class="font-bold">Welcome {user.username}</p>
		{/if}
		<a href="/">Home</a>
		{#if user}
			<a href="/dashboard">Dashboard</a>
			<form method="POST" action="/logout" use:enhance>
				<button type="submit">Logout</button>
			</form>
		{:else}
			<a href="/login">Login</a>
		{/if}
	</div>
	<div class="bg-zinc-900/95 p-2 rounded-md min-h-fit h-full overflow-auto">
		{#each $queue as { album, track }}
			<div>
				{track.artists.map((a) => a.name).join(', ')} - {track.title}
			</div>
		{/each}
	</div>
</div>
