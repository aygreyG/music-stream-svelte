<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		const timeout = setTimeout(() => {
			window.location.href = '/';
		}, 1000);

		return () => {
			clearTimeout(timeout);
		};
	});
</script>

<h1>The server is loading please wait...</h1>
