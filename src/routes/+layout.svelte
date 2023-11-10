<script lang="ts">
	import NavBar from '$lib/components/NavBar.svelte';
	import '../app.css';

	export let data;
</script>

<div class="h-[100dvh] w-full flex justify-center">
	<div class="h-full w-full max-w-[1920px] flex flex-col overflow-hidden gap-1 p-1">
		<div class="flex h-5/6 gap-1">
			<NavBar user={data.user} />
			<div class="sm:w-8/12 xl:w-9/12 w-full bg-zinc-900/95 rounded-md p-2 overflow-auto">
				<slot />
			</div>
		</div>
		<div class="bg-zinc-900/95 p-2 rounded-md h-1/6">Player</div>
	</div>
</div>
